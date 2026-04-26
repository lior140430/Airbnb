import { Star } from 'lucide-react';
import React from 'react';

interface PropertyTitleProps {
    title: string;
    avgRating?: string | null;
    commentsCount: number;
    city: string;
    street: string;
}

export const PropertyTitle: React.FC<PropertyTitleProps> = ({ title, avgRating, commentsCount, city, street }) => {
    return (
        <div className="pd-title-section">
            <h1 className="pd-title">{title}</h1>
            <div className="pd-title-meta">
                {avgRating !== null && avgRating !== undefined && (
                    <>
                        <span className="pd-rating-badge">
                            <Star size={14} fill="currentColor" />
                            {avgRating}
                        </span>
                        <span className="pd-dot">·</span>
                        <span className="pd-review-count">{commentsCount} ביקורות</span>
                        <span className="pd-dot">·</span>
                    </>
                )}
                <span className="pd-location">{city}, {street}</span>
            </div>
        </div>
    );
};
