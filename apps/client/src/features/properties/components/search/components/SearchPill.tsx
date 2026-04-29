import { useProperty } from '@/context/PropertyContext';
import { Loader2, Search } from 'lucide-react';
import React from 'react';

interface SearchPillProps {
    summaryText: string | null;
    onClick: () => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
}

export const SearchPill: React.FC<SearchPillProps> = ({ summaryText, onClick, containerRef }) => {
    const { isSearching } = useProperty();

    return (
        <div className="search-bar-collapsed" onClick={onClick} ref={containerRef}>
            <div className="search-pill">
                <span className="search-pill-text">{summaryText ?? 'התחל לחפש'}</span>
                <div className="search-pill-icon">
                    {isSearching ? <Loader2 size={14} className="search-pill-spinner" /> : <Search size={14} />}
                </div>
            </div>
        </div>
    );
};
