import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DateDropdown } from './components/dropdowns/DateDropdown';
import { GuestsDropdown } from './components/dropdowns/GuestsDropdown';
import { LocationDropdown } from './components/dropdowns/LocationDropdown';
import { SearchAIRow } from './components/SearchAIRow';
import { SearchFiltersRow } from './components/SearchFiltersRow';
import { SearchPill } from './components/SearchPill';
import { EMPTY_FILTERS, type ActivePanel, type SearchFilters } from './search.types';
import './SearchBar.css';

export type { SearchFilters };

interface SearchBarProps {
    onSearch: (filters: SearchFilters) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
    const [expanded, setExpanded] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
    const [activePanel, setActivePanel] = useState<ActivePanel>(null);
    const [locationSearch, setLocationSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const expandedRef = useRef(false);

    const closeExpanded = useCallback(() => {
        if (!expandedRef.current) return;
        setIsClosing(true);
        setTimeout(() => {
            setExpanded(false);
            setIsClosing(false);
            setActivePanel(null);
            expandedRef.current = false;
        }, 130);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                closeExpanded();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [closeExpanded]);

    const handleSearch = useCallback(() => {
        onSearch(filters);
        closeExpanded();
    }, [filters, onSearch, closeExpanded]);

    const handleClear = useCallback(() => {
        setFilters(EMPTY_FILTERS);
        setLocationSearch('');
        onSearch(EMPTY_FILTERS);
    }, [onSearch]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') handleSearch();
            if (e.key === 'Escape') closeExpanded();
        },
        [handleSearch, closeExpanded],
    );

    const hasFilters =
        filters.query || filters.location || filters.checkIn || filters.checkOut || filters.guests > 0;

    const getSummaryText = (): string | null => {
        const parts: string[] = [];
        if (filters.location) parts.push(filters.location);
        if (filters.checkIn || filters.checkOut) {
            parts.push([filters.checkIn, filters.checkOut].filter(Boolean).join(' - '));
        }
        if (filters.guests > 0) parts.push(`${filters.guests} אורחים`);
        if (filters.query) parts.push(`"${filters.query}"`);
        return parts.length > 0 ? parts.join(' · ') : null;
    };

    if (!expanded && !isClosing) {
        return (
            <SearchPill
                summaryText={getSummaryText()}
                onClick={() => { setExpanded(true); expandedRef.current = true; }}
                containerRef={containerRef}
            />
        );
    }

    return (
        <div
            className={`search-bar-expanded${isClosing ? ' search-bar-expanded--closing' : ''}`}
            ref={containerRef}
        >
            <SearchAIRow
                value={filters.query}
                onChange={(query) => setFilters((f) => ({ ...f, query }))}
                onKeyDown={handleKeyDown}
            />

            <SearchFiltersRow
                filters={filters}
                activePanel={activePanel}
                setActivePanel={setActivePanel}
                onSearch={handleSearch}
            />

            {activePanel === 'location' && (
                <LocationDropdown
                    value={filters.location}
                    searchText={locationSearch}
                    onSearchChange={setLocationSearch}
                    onSelect={(loc) => {
                        setFilters((f) => ({ ...f, location: loc }));
                        setLocationSearch('');
                        setActivePanel('checkin');
                    }}
                    onClear={() => setFilters((f) => ({ ...f, location: '' }))}
                />
            )}

            {activePanel === 'checkin' && (
                <DateDropdown
                    label="תאריך צ'ק-אין"
                    value={filters.checkIn}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(checkIn) => {
                        setFilters((f) => ({ ...f, checkIn }));
                        setActivePanel('checkout');
                    }}
                />
            )}

            {activePanel === 'checkout' && (
                <DateDropdown
                    label="תאריך צ'ק-אאוט"
                    value={filters.checkOut}
                    min={filters.checkIn || new Date().toISOString().split('T')[0]}
                    onChange={(checkOut) => {
                        setFilters((f) => ({ ...f, checkOut }));
                        setActivePanel(null);
                    }}
                />
            )}

            {activePanel === 'guests' && (
                <GuestsDropdown
                    value={filters.guests}
                    onChange={(guests) => setFilters((f) => ({ ...f, guests }))}
                />
            )}

            {hasFilters && (
                <button className="search-clear-all" onClick={handleClear}>
                    נקה הכל
                </button>
            )}
        </div>
    );
};
