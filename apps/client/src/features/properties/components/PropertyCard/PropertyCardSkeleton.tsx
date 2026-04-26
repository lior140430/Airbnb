import React from 'react';
import './PropertyCardSkeleton.css';

export const PropertyCardSkeleton: React.FC = () => {
    return (
        <div className="property-card-skeleton">
            <div className="skeleton-image"></div>
            <div className="skeleton-details">
                <div className="skeleton-line skeleton-title"></div>
                <div className="skeleton-line skeleton-location"></div>
                <div className="skeleton-line skeleton-price"></div>
            </div>
        </div>
    );
};
