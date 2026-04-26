import { useAuth } from '@/context/AuthContext';
import { useChatContext } from '@/context/ChatContext';
import { Plus, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import './ChatDrawer.css';
import { ChatWindow } from './ChatWindow';
import { ConversationItem } from './ConversationItem';
import { NewChatPanel } from './NewChatPanel';

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
    } = useChatContext();

    const [view, setView] = useState<'list' | 'new'>('list');

    /* Reset view when drawer closes or a conversation becomes active */
    useEffect(() => {
        if (!isChatOpen || activeConversation) {
            setView('list');
        }
    }, [isChatOpen, activeConversation]);

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
                ) : view === 'new' ? (
                    <NewChatPanel onBack={() => setView('list')} />
                ) : (
                    <>
                        {/* Header */}
                        <div className="cd-header">
                            <h2 className="cd-title">הודעות</h2>
                            <div className="cd-header-actions">
                                <button
                                    className="cd-icon-btn"
                                    onClick={() => setView('new')}
                                    aria-label="שיחה חדשה"
                                >
                                    <Plus size={20} />
                                </button>
                                <button
                                    className="cd-icon-btn"
                                    onClick={handleClose}
                                    aria-label="סגירה"
                                >
                                    <X size={20} />
                                </button>
                            </div>
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

                                    return (
                                        <ConversationItem
                                            key={conv._id}
                                            otherUser={otherUser}
                                            lastMessage={conv.lastMessage}
                                            lastMessageAt={conv.lastMessageAt}
                                            isActive={activeConversation === otherId}
                                            unreadCount={0}
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
