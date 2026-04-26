import { Avatar } from '@/components/ui/Avatar/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useChatContext } from '@/context/ChatContext';
import { getUserDisplayName, getUserInitial } from '@/utils/user';
import { ArrowRight, Send } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChatBubble } from './ChatBubble';
import './ChatWindow.css';

export const ChatWindow: React.FC = () => {
    const { user } = useAuth();
    const {
        activeConversation,
        messages,
        isTyping,
        usersCache,
        sendMessage,
        markAsRead,
        setActiveConversation,
        startTyping,
        stopTyping,
    } = useChatContext();

    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const otherUser = activeConversation ? usersCache[activeConversation] : null;
    const displayName = otherUser ? getUserDisplayName(otherUser) : '...';
    const initial = otherUser ? getUserInitial(otherUser) : '?';

    /* ---------- auto-scroll ---------- */

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    /* ---------- mark as read ---------- */

    useEffect(() => {
        if (activeConversation) {
            markAsRead(activeConversation);
        }
    }, [activeConversation, messages.length, markAsRead]);

    /* ---------- focus input ---------- */

    useEffect(() => {
        if (activeConversation) {
            inputRef.current?.focus();
        }
    }, [activeConversation]);

    /* ---------- handlers ---------- */

    const handleSend = useCallback(() => {
        const text = inputText.trim();
        if (!text || !activeConversation) return;
        sendMessage(activeConversation, text);
        setInputText('');
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
        stopTyping(activeConversation);
    }, [inputText, activeConversation, sendMessage, stopTyping]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value);
        if (!activeConversation) return;

        startTyping(activeConversation);

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            stopTyping(activeConversation);
            typingTimeoutRef.current = null;
        }, 2000);
    };

    const handleBack = () => {
        setActiveConversation(null);
    };

    if (!activeConversation) return null;

    return (
        <div className="cw-container">
            {/* Header */}
            <div className="cw-header">
                <button className="cw-back-btn" onClick={handleBack} aria-label="חזרה">
                    <ArrowRight size={20} />
                </button>
                <Avatar
                    src={otherUser?.picture}
                    alt={displayName}
                    fallback={initial}
                    size="small"
                />
                <span className="cw-header-name">{displayName}</span>
            </div>

            {/* Messages */}
            <div className="cw-messages">
                {messages.length === 0 && (
                    <div className="cw-empty">
                        <p>התחילו שיחה חדשה</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <ChatBubble
                        key={msg._id}
                        message={msg}
                        isMine={msg.senderId === user?._id}
                    />
                ))}
                {isTyping && (
                    <div className="cw-typing-indicator">
                        <span className="cw-typing-dots">
                            <span />
                            <span />
                            <span />
                        </span>
                        <span className="cw-typing-text">...מקליד/ה</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="cw-input-bar">
                <input
                    ref={inputRef}
                    className="cw-input"
                    type="text"
                    placeholder="הקלידו הודעה..."
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                />
                <button
                    className="cw-send-btn"
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    aria-label="שליחה"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};
