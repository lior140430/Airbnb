import type { ChatMessage } from '@/context/ChatContext';
import React from 'react';
import './ChatBubble.css';

interface ChatBubbleProps {
    message: ChatMessage;
    isMine: boolean;
}

const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isMine }) => {
    return (
        <div className={`cb-wrapper ${isMine ? 'cb-mine' : 'cb-theirs'}`}>
            <div className={`cb-bubble ${isMine ? 'cb-bubble-mine' : 'cb-bubble-theirs'}`}>
                <p className="cb-text">{message.text}</p>
                <span className="cb-time">{formatTime(message.createdAt)}</span>
            </div>
        </div>
    );
};
