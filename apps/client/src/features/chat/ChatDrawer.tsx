import { useAuth } from '@/context/AuthContext';
import { useChatContext } from '@/context/ChatContext';
import { X } from 'lucide-react';
import React, { useEffect } from 'react';
import './ChatDrawer.css';
import { ChatWindow } from './ChatWindow';
import { ConversationItem } from './ConversationItem';

export const ChatDrawer: React.FC = () => {
    const { user } = useAuth();
    const {
        conversations,
        activeConversation,
        isChatOpen,
        setIsChatOpen,
        setActiveConversation,
        usersCache,
        fetchUser,
        unreadByUser,
    } = useChatContext();

    /* Ensure we have user data for all conversation participants */
    useEffect(() => {
        if (!isChatOpen || !user) return;
        conversations.forEach((conv) => {
            const otherId = conv.participants.find((id) => id !== user._id);
            if (otherId && !usersCache[otherId]) {
                fetchUser(otherId);
            }
        });
    }, [isChatOpen, conversations, user, usersCache, fetchUser]);

    const handleClose = () => {
        setIsChatOpen(false);
        setActiveConversation(null);
    };

    const handleOverlayClick = () => {
        handleClose();
    };

    const handleConversationClick = (otherUserId: string) => {
        setActiveConversation(otherUserId);
    };

    return (
        <>
            {/* Overlay */}
            <div
                className={`cd-overlay ${isChatOpen ? 'cd-overlay-visible' : ''}`}
                onClick={handleOverlayClick}
            />

            {/* Drawer panel */}
            <div className={`cd-drawer ${isChatOpen ? 'cd-drawer-open' : ''}`}>
                {activeConversation ? (
                    <ChatWindow />
                ) : (
                    <>
                        {/* Header */}
                        <div className="cd-header">
                            <h2 className="cd-title">הודעות</h2>
                            <button
                                className="cd-close-btn"
                                onClick={handleClose}
                                aria-label="סגירה"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Conversations list */}
                        <div className="cd-list">
                            {conversations.length === 0 ? (
                                <div className="cd-empty">
                                    <p>אין הודעות עדיין</p>
                                </div>
                            ) : (
                                conversations.map((conv) => {
                                    const otherId = conv.participants.find(
                                        (id) => id !== user?._id,
                                    );
                                    if (!otherId) return null;
                                    const otherUser = usersCache[otherId] || null;
                                    const unread = unreadByUser[otherId] || 0;

                                    return (
                                        <ConversationItem
                                            key={conv._id}
                                            otherUser={otherUser}
                                            lastMessage={conv.lastMessage}
                                            lastMessageAt={conv.lastMessageAt}
                                            isActive={activeConversation === otherId}
                                            unreadCount={unread}
                                            onClick={() => handleConversationClick(otherId)}
                                        />
                                    );
                                })
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    );
};
