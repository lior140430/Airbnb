import { getImageUrl, getPlaceholderImageHe } from '@/utils/image';
import React from 'react';

interface PropertyGalleryProps {
    images: string[];
    title: string;
}

export const PropertyGallery: React.FC<PropertyGalleryProps> = ({ images, title }) => {
    const list = images || [];
    return (
        <div className={`pd-gallery pd-gallery--${Math.min(list.length, 5)}`}>
            {list.slice(0, 5).map((img, i) => (
                <div className={`pd-gallery-cell pd-gallery-cell--${i}`} key={i}>
                    <img src={getImageUrl(img)} alt={`${title} ${i + 1}`} />
                </div>
            ))}
            {list.length === 0 && (
                <div className="pd-gallery-cell pd-gallery-cell--0">
                    <img src={getPlaceholderImageHe()} alt={title} />
                </div>
            )}
            {list.length > 5 && (
                <button className="pd-gallery-show-all">
                    הצג את כל התמונות
                </button>
            )}
        </div>
    );
};
