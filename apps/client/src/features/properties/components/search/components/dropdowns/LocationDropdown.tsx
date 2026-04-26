import { MapPin } from 'lucide-react';
import React from 'react';
import { LOCATIONS } from '../../search.types';

interface LocationDropdownProps {
    value: string;
    searchText: string;
    onSearchChange: (text: string) => void;
    onSelect: (location: string) => void;
    onClear: () => void;
}

export const LocationDropdown: React.FC<LocationDropdownProps> = ({
    value,
    searchText,
    onSearchChange,
    onSelect,
    onClear,
}) => {
    const filtered = LOCATIONS.filter((loc) =>
        loc.toLowerCase().includes(searchText.toLowerCase()),
    );

    return (
        <div className="search-dropdown location-dropdown">
            <input
                type="text"
                className="search-dropdown-input"
                placeholder="חפש יעד..."
                value={searchText}
                onChange={(e) => onSearchChange(e.target.value)}
                autoFocus
            />
            <div className="location-list">
                {filtered.map((loc) => (
                    <button
                        key={loc}
                        className={`location-item ${value === loc ? 'selected' : ''}`}
                        onClick={() => onSelect(loc)}
                    >
                        <MapPin size={16} />
                        <span>{loc}</span>
                    </button>
                ))}
                {filtered.length === 0 && (
                    <div className="location-empty">לא נמצאו תוצאות</div>
                )}
            </div>
            {value && (
                <button className="search-clear-selection" onClick={onClear}>
                    נקה בחירה
                </button>
            )}
        </div>
    );
};
