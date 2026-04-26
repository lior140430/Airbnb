import React from 'react';

interface DateDropdownProps {
    label: string;
    value: string;
    min?: string;
    onChange: (value: string) => void;
}

export const DateDropdown: React.FC<DateDropdownProps> = ({ label, value, min, onChange }) => (
    <div className="search-dropdown date-dropdown">
        <label className="date-label">{label}</label>
        <input
            type="date"
            className="date-input"
            value={value}
            min={min}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);
