import { useAuth } from '@/context/AuthContext';
import { AUTH_API_URL, PROPERTY_API_URL } from '@/services/api';
import axios from 'axios';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface Conversation {
    _id: string;
    participants: string[];
    lastMessage: string;
    lastMessageAt: string;
}

export interface ChatMessage {
    _id: string;
    senderId: string;
    receiverId: string;
    text: string;
    read: boolean;
    createdAt: string;
}

export interface ChatUser {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    picture?: string;
}

export interface PropertyChatContext {
    _id: string;
    title: string;
    price: number;
    image?: string;
}

interface ChatContextType {
    conversations: Conversation[];
    activeConversation: string | null;
    messages: ChatMessage[];
    unreadCount: number;
    isTyping: boolean;
    isChatOpen: boolean;
    usersCache: Record<string, ChatUser>;
    propertyContext: PropertyChatContext | null;
    toggleChat: () => void;
    setIsChatOpen: (open: boolean) => void;
    sendMessage: (receiverId: string, text: string) => void;
    markAsRead: (userId: string) => void;
    setActiveConversation: (userId: string | null) => void;
    startTyping: (receiverId: string) => void;
    stopTyping: (receiverId: string) => void;
    fetchUser: (userId: string) => Promise<ChatUser | null>;
    openChatWithUser: (userId: string, property?: PropertyChatContext) => Promise<void>;
    searchUsers: (q: string) => Promise<ChatUser[]>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

/* ------------------------------------------------------------------ */
/*  User cache helper                                                  */
/* ------------------------------------------------------------------ */

const userFetchPromises: Record<string, Promise<ChatUser | null>> = {};

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, token, isAuthenticated } = useAuth();
    const socketRef = useRef<Socket | null>(null);

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [usersCache, setUsersCache] = useState<Record<string, ChatUser>>({});
    const [propertyContext, setPropertyContext] = useState<PropertyChatContext | null>(null);

    const isChatOpenRef = useRef(false);
    useEffect(() => {
        isChatOpenRef.current = isChatOpen;
    }, [isChatOpen]);

    const activeConversationRef = useRef<string | null>(null);
    useEffect(() => {
        activeConversationRef.current = activeConversation;
    }, [activeConversation]);

    /* ---------- fetch helpers ---------- */

    const fetchUser = useCallback(async (userId: string): Promise<ChatUser | null> => {
        if (usersCache[userId]) return usersCache[userId];

        // Deduplicate concurrent fetches for the same user
        if (!userFetchPromises[userId]) {
            userFetchPromises[userId] = axios
                .get<ChatUser>(`${AUTH_API_URL}/users/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                .then((res) => {
                    const u = res.data;
                    setUsersCache((prev) => ({ ...prev, [userId]: u }));
                    delete userFetchPromises[userId];
                    return u;
                })
                .catch(() => {
                    delete userFetchPromises[userId];
                    return null;
                });
        }
        return userFetchPromises[userId];
    }, [token, usersCache]);

    const fetchConversations = useCallback(async () => {
        if (!token) return;
        try {
            const { data } = await axios.get<Conversation[]>(
                `${PROPERTY_API_URL}/chat/conversations`,
                { headers: { Authorization: `Bearer ${token}` } },
            );
            setConversations(data);

            // Pre-fetch user info for all participants
            const otherIds = data.flatMap((c) =>
                c.participants.filter((id) => id !== user?._id),
            );
            const unique = [...new Set(otherIds)];
            unique.forEach((id) => fetchUser(id));
        } catch {
            /* silent */
        }
    }, [token, user?._id, fetchUser]);

    const fetchMessages = useCallback(
        async (userId: string) => {
            if (!token) return;
            try {
                const { data } = await axios.get<ChatMessage[]>(
                    `${PROPERTY_API_URL}/chat/messages/${userId}`,
                    { headers: { Authorization: `Bearer ${token}` } },
                );
                setMessages(data);
            } catch {
                setMessages([]);
            }
        },
        [token],
    );

    /* ---------- socket connection ---------- */

    useEffect(() => {
        if (!isAuthenticated || !token) {
            socketRef.current?.disconnect();
            socketRef.current = null;
            return;
        }

        const socket = io(`${PROPERTY_API_URL}/chat`, {
            auth: { token },
        });

        socketRef.current = socket;

        socket.on('new_message', (msg: ChatMessage) => {
            // Update conversations list
            setConversations((prev) => {
                const otherUserId =
                    msg.senderId === user?._id ? msg.receiverId : msg.senderId;
                const idx = prev.findIndex((c) =>
                    c.participants.includes(otherUserId),
                );
                if (idx >= 0) {
                    const updated = [...prev];
                    updated[idx] = {
                        ...updated[idx],
                        lastMessage: msg.text,
                        lastMessageAt: msg.createdAt,
                    };
                    // Move to top
                    const [conv] = updated.splice(idx, 1);
                    updated.unshift(conv);
                    return updated;
                }
                // New conversation - refetch
                fetchConversations();
                return prev;
            });

            // Add to messages if active conversation matches
            const otherUserId =
                msg.senderId === user?._id ? msg.receiverId : msg.senderId;
            if (activeConversationRef.current === otherUserId) {
                setMessages((prev) => [...prev, msg]);
            }

            // Update unread count for messages not in active view
            if (msg.senderId !== user?._id) {
                const isViewing =
                    isChatOpenRef.current &&
                    activeConversationRef.current === msg.senderId;
                if (!isViewing) {
                    setUnreadCount((prev) => prev + 1);
                }
            }

            // Pre-fetch sender info
            fetchUser(msg.senderId);
        });

        socket.on('messages_read', ({ readBy }: { readBy: string }) => {
            setMessages((prev) =>
                prev.map((m) =>
                    m.receiverId === readBy ? { ...m, read: true } : m,
                ),
            );
        });

        socket.on('user_typing', ({ userId }: { userId: string }) => {
            if (activeConversationRef.current === userId) {
                setIsTyping(true);
            }
        });

        socket.on('user_stop_typing', ({ userId }: { userId: string }) => {
            if (activeConversationRef.current === userId) {
                setIsTyping(false);
            }
        });

        socket.on('user_online', () => {
            /* can be extended */
        });

        socket.on('user_offline', () => {
            /* can be extended */
        });

        // Fetch conversations on mount
        fetchConversations();

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, token]);

    /* ---------- active conversation change ---------- */

    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation);
            setIsTyping(false);
        } else {
            setMessages([]);
        }
    }, [activeConversation, fetchMessages]);

    /* ---------- refresh conversations when drawer opens ---------- */

    useEffect(() => {
        if (isChatOpen && token) {
            fetchConversations();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isChatOpen]);

    /* ---------- actions ---------- */

    const sendMessage = useCallback(
        (receiverId: string, text: string) => {
            socketRef.current?.emit('send_message', { receiverId, text });
        },
        [],
    );

    const markAsRead = useCallback(
        (userId: string) => {
            socketRef.current?.emit('mark_read', { userId });
            setMessages((prev) =>
                prev.map((m) =>
                    m.senderId === userId && !m.read ? { ...m, read: true } : m,
                ),
            );
            // Recalculate unread
            setUnreadCount((prev) => Math.max(0, prev - 1));
        },
        [],
    );

    const startTyping = useCallback(
        (receiverId: string) => {
            socketRef.current?.emit('typing', { receiverId });
        },
        [],
    );

    const stopTyping = useCallback(
        (receiverId: string) => {
            socketRef.current?.emit('stop_typing', { receiverId });
        },
        [],
    );

    const toggleChat = useCallback(() => {
        setIsChatOpen((prev) => !prev);
    }, []);

    const openChatWithUser = useCallback(
        async (userId: string, property?: PropertyChatContext) => {
            setIsChatOpen(true);
            setActiveConversation(userId);
            setPropertyContext(property ?? null);
            await fetchUser(userId);
        },
        [fetchUser],
    );

    const searchUsers = useCallback(
        async (q: string): Promise<ChatUser[]> => {
            if (!token || q.trim().length < 2) return [];
            try {
                const { data } = await axios.get<ChatUser[]>(
                    `${AUTH_API_URL}/users/search`,
                    {
                        params: { q },
                        headers: { Authorization: `Bearer ${token}` },
                    },
                );
                return data;
            } catch {
                return [];
            }
        },
        [token],
    );

    return (
        <ChatContext.Provider
            value={{
                conversations,
                activeConversation,
                messages,
                unreadCount,
                isTyping,
                isChatOpen,
                usersCache,
                propertyContext,
                toggleChat,
                setIsChatOpen,
                sendMessage,
                markAsRead,
                setActiveConversation,
                startTyping,
                stopTyping,
                fetchUser,
                openChatWithUser,
                searchUsers,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
};
