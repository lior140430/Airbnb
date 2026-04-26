import { Avatar } from '@/components/ui/Avatar/Avatar';
import type { ChatUser } from '@/context/ChatContext';
import { getUserDisplayName, getUserInitial } from '@/utils/user';
import React from 'react';
import './ConversationItem.css';

interface ConversationItemProps {
    otherUser: ChatUser | null;
    lastMessage: string;
    lastMessageAt: string;
    isActive: boolean;
    unreadCount: number;
    onClick: () => void;
}

const formatRelativeTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'עכשיו';
    if (diffMins < 60) return `${diffMins} דק'`;
    if (diffHours < 24) return `${diffHours} שע'`;
    if (diffDays < 7) return `${diffDays} ימים`;
    return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
};

export const ConversationItem: React.FC<ConversationItemProps> = ({
    otherUser,
    lastMessage,
    lastMessageAt,
    isActive,
    unreadCount,
    onClick,
}) => {
    const displayName = otherUser ? getUserDisplayName(otherUser) : '...';
    const initial = otherUser ? getUserInitial(otherUser) : '?';

    return (
        <div
            className={`ci-container ${isActive ? 'ci-active' : ''}`}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}
        >
            <div className="ci-avatar">
                <Avatar
                    src={otherUser?.picture}
                    alt={displayName}
                    fallback={initial}
                    size="medium"
                />
            </div>
            <div className="ci-content">
                <div className="ci-top-row">
                    <span className="ci-name">{displayName}</span>
                    <span className="ci-time">{formatRelativeTime(lastMessageAt)}</span>
                </div>
                <div className="ci-bottom-row">
                    <span className="ci-last-message">{lastMessage}</span>
                    {unreadCount > 0 && (
                        <span className="ci-unread-dot" aria-label={`${unreadCount} הודעות שלא נקראו`} />
                    )}
                </div>
            </div>
        </div>
    );
};
