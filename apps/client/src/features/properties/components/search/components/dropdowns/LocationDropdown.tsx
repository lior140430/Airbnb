import { Loader2, MapPin } from 'lucide-react';
import React, { useRef, useState } from 'react';

interface LocationDropdownProps {
    value: string;
    searchText: string;
    onSearchChange: (text: string) => void;
    onSelect: (location: string) => void;
    onClear: () => void;
}

interface NominatimResult {
    display_name: string;
    address: {
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        county?: string;
    };
}

export const LocationDropdown: React.FC<LocationDropdownProps> = ({
    value,
    searchText,
    onSearchChange,
    onSelect,
    onClear,
}) => {
    const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(!!value);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleInput = (val: string) => {
        onSearchChange(val);
        setSelected(false);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (val.length < 2) {
            setSuggestions([]);
            return;
        }

        timeoutRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&addressdetails=1&limit=5&countrycodes=il`,
                    { headers: { 'Accept-Language': 'he' } },
                );
                const data: NominatimResult[] = await res.json();
                setSuggestions(data);
            } catch {
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        }, 400);
    };

    const handleSelect = (s: NominatimResult) => {
        const city =
            s.address.city ||
            s.address.town ||
            s.address.village ||
            s.address.state ||
            s.address.county ||
            s.display_name;
        setSelected(true);
        setSuggestions([]);
        onSearchChange(city);
        onSelect(city);
    };

    return (
        <div className="search-dropdown location-dropdown" style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    className="search-dropdown-input"
                    placeholder="הקלד עיר או אזור..."
                    value={searchText}
                    onChange={(e) => handleInput(e.target.value)}
                    autoFocus
                />
                {loading && (
                    <Loader2
                        size={16}
                        className="location-spinner search-pill-spinner"
                        style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                    />
                )}
            </div>

            {!selected && searchText.length >= 2 && suggestions.length > 0 && (
                <ul className="location-suggestions">
                    {suggestions.map((s, i) => (
                        <li key={i} onClick={() => handleSelect(s)}>
                            <MapPin size={14} style={{ flexShrink: 0 }} />
                            <span>{s.display_name}</span>
                        </li>
                    ))}
                </ul>
            )}

            {!loading && !selected && searchText.length >= 2 && suggestions.length === 0 && (
                <div className="location-empty">לא נמצאו תוצאות</div>
            )}

            {value && (
                <button
                    className="search-clear-selection"
                    onClick={() => {
                        onSearchChange('');
                        setSelected(false);
                        setSuggestions([]);
                        onClear();
                    }}
                >
                    נקה בחירה
                </button>
            )}
        </div>
    );
};
