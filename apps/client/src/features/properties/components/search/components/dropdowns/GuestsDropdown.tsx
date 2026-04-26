import { Minus, Plus } from 'lucide-react';
import React from 'react';

interface GuestsDropdownProps {
    value: number;
    onChange: (value: number) => void;
}

export const GuestsDropdown: React.FC<GuestsDropdownProps> = ({ value, onChange }) => (
    <div className="search-dropdown guests-dropdown">
        <div className="guests-row">
            <span className="guests-label">אורחים</span>
            <div className="guests-counter">
                <button
                    className="guests-btn"
                    disabled={value <= 0}
                    onClick={() => onChange(Math.max(0, value - 1))}
                >
                    <Minus size={16} />
                </button>
                <span className="guests-count">{value}</span>
                <button
                    className="guests-btn"
                    disabled={value >= 16}
                    onClick={() => onChange(Math.min(16, value + 1))}
                >
                    <Plus size={16} />
                </button>
            </div>
        </div>
    </div>
);
