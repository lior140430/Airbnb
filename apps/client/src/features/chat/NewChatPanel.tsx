import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { useChatContext, type ChatUser } from '@/context/ChatContext';
import { getUserDisplayName, getUserInitial } from '@/utils/user';
import { ArrowRight, Search } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import './NewChatPanel.css';

interface NewChatPanelProps {
    onBack: () => void;
}

export const NewChatPanel: React.FC<NewChatPanelProps> = ({ onBack }) => {
    const { searchUsers, openChatWithUser } = useChatContext();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ChatUser[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const handle = setTimeout(async () => {
            const users = await searchUsers(trimmed);
            setResults(users);
            setLoading(false);
        }, 300);

        return () => clearTimeout(handle);
    }, [query, searchUsers]);

    const handlePick = (userId: string) => {
        openChatWithUser(userId);
    };

    const trimmed = query.trim();

    return (
        <div className="ncp-container">
            {/* Header */}
            <div className="ncp-header">
                <button className="ncp-back-btn" onClick={onBack} aria-label="חזרה">
                    <ArrowRight size={20} />
                </button>
                <h2 className="ncp-title">שיחה חדשה</h2>
            </div>

            {/* Search input */}
            <div className="ncp-search-wrap">
                <Search size={16} className="ncp-search-icon" />
                <input
                    ref={inputRef}
                    className="ncp-search-input"
                    type="text"
                    placeholder="חפשו לפי שם או אימייל"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {/* Results */}
            <div className="ncp-results">
                {trimmed.length < 2 ? (
                    <div className="ncp-hint">הקלידו לפחות 2 תווים כדי לחפש</div>
                ) : loading ? (
                    <div className="ncp-state">
                        <Spinner size={24} />
                    </div>
                ) : results.length === 0 ? (
                    <div className="ncp-state">לא נמצאו משתמשים</div>
                ) : (
                    results.map((u) => {
                        const displayName = getUserDisplayName(u);
                        const initial = getUserInitial(u);
                        return (
                            <div
                                key={u._id}
                                className="ncp-row"
                                role="button"
                                tabIndex={0}
                                onClick={() => handlePick(u._id)}
                                onKeyDown={(e) => e.key === 'Enter' && handlePick(u._id)}
                            >
                                <Avatar
                                    src={u.picture}
                                    alt={displayName}
                                    fallback={initial}
                                    size="medium"
                                />
                                <div className="ncp-row-content">
                                    <span className="ncp-row-name">{displayName}</span>
                                    {u.email && displayName !== u.email && (
                                        <span className="ncp-row-email">{u.email}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
