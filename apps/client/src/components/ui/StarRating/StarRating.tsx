import { Star } from 'lucide-react';
import React, { useState } from 'react';
import './StarRating.css';

interface StarRatingProps {
    value: number;
    onChange?: (rating: number) => void;
    size?: number;
    readOnly?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({ value, onChange, size = 24, readOnly = false }) => {
    const [hoverValue, setHoverValue] = useState<number>(0);

    const handleMouseEnter = (index: number) => {
        if (!readOnly) setHoverValue(index);
    };

    const handleMouseLeave = () => {
        if (!readOnly) setHoverValue(0);
    };

    const handleClick = (index: number) => {
        if (!readOnly && onChange) {
            onChange(index);
        }
    };

    return (
        <div className="star-rating" onMouseLeave={handleMouseLeave}>
            {[1, 2, 3, 4, 5].map((star) => {
                const activeLimit = hoverValue > 0 ? hoverValue : value;
                const isActive = activeLimit >= star;

                const color = isActive ? 'var(--brand-joy)' : '#DDDDDD';
                const fill = isActive ? 'var(--brand-joy)' : 'none';

                return (
                    <Star
                        key={star}
                        size={size}
                        className={`star ${readOnly ? 'readonly' : ''}`}
                        onClick={() => handleClick(star)}
                        onMouseEnter={() => handleMouseEnter(star)}
                        color={color}
                        fill={fill}
                        strokeWidth={1.5}
                    />
                );
            })}
        </div>
    );
};
