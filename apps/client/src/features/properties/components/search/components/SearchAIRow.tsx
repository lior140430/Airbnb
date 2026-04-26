import { Sparkles, X } from 'lucide-react';
import React from 'react';

interface SearchAIRowProps {
    value: string;
    onChange: (value: string) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
}

export const SearchAIRow: React.FC<SearchAIRowProps> = ({ value, onChange, onKeyDown }) => (
    <div className="search-ai-row">
        <Sparkles size={16} className="search-ai-icon" />
        <input
            type="text"
            className="search-ai-input"
            placeholder="חפש חופשי... (למשל: דירה שקטה ליד הים)"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            autoFocus
        />
        {value && (
            <button className="search-clear-field" onClick={() => onChange('')}>
                <X size={14} />
            </button>
        )}
    </div>
);
