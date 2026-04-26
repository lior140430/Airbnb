import { Calendar, MapPin, Search, Users } from 'lucide-react';
import React from 'react';
import { type ActivePanel, type SearchFilters } from '../search.types';

interface SearchFiltersRowProps {
    filters: SearchFilters;
    activePanel: ActivePanel;
    setActivePanel: (panel: ActivePanel) => void;
    onSearch: () => void;
}

export const SearchFiltersRow: React.FC<SearchFiltersRowProps> = ({
    filters,
    activePanel,
    setActivePanel,
    onSearch,
}) => (
    <div className="search-filters-row">
        {/* Location */}
        <button
            className={`search-filter-tab ${activePanel === 'location' ? 'active' : ''} ${filters.location ? 'has-value' : ''}`}
            onClick={() => setActivePanel(activePanel === 'location' ? null : 'location')}
        >
            <MapPin size={16} />
            <div className="search-filter-tab-content">
                <span className="search-filter-label">יעד</span>
                <span className="search-filter-value">{filters.location || 'לאן?'}</span>
            </div>
        </button>

        <div className="search-divider" />

        {/* Check-in */}
        <button
            className={`search-filter-tab ${activePanel === 'checkin' ? 'active' : ''} ${filters.checkIn ? 'has-value' : ''}`}
            onClick={() => setActivePanel(activePanel === 'checkin' ? null : 'checkin')}
        >
            <Calendar size={16} />
            <div className="search-filter-tab-content">
                <span className="search-filter-label">צ'ק-אין</span>
                <span className="search-filter-value">{filters.checkIn || 'הוסף תאריך'}</span>
            </div>
        </button>

        <div className="search-divider" />

        {/* Check-out */}
        <button
            className={`search-filter-tab ${activePanel === 'checkout' ? 'active' : ''} ${filters.checkOut ? 'has-value' : ''}`}
            onClick={() => setActivePanel(activePanel === 'checkout' ? null : 'checkout')}
        >
            <Calendar size={16} />
            <div className="search-filter-tab-content">
                <span className="search-filter-label">צ'ק-אאוט</span>
                <span className="search-filter-value">{filters.checkOut || 'הוסף תאריך'}</span>
            </div>
        </button>

        <div className="search-divider" />

        {/* Guests */}
        <button
            className={`search-filter-tab ${activePanel === 'guests' ? 'active' : ''} ${filters.guests > 0 ? 'has-value' : ''}`}
            onClick={() => setActivePanel(activePanel === 'guests' ? null : 'guests')}
        >
            <Users size={16} />
            <div className="search-filter-tab-content">
                <span className="search-filter-label">אורחים</span>
                <span className="search-filter-value">
                    {filters.guests > 0 ? `${filters.guests} אורחים` : 'כמה?'}
                </span>
            </div>
        </button>

        {/* Search button */}
        <button className="search-submit-btn" onClick={onSearch}>
            <Search size={16} />
            <span>חיפוש</span>
        </button>
    </div>
);
