import { Bath, Bed, Car, Check, Dumbbell, PawPrint, Sofa, Star, Thermometer, Trees, Users, Utensils, WashingMachine, Waves, Wifi } from 'lucide-react';
import React from 'react';

const AMENITY_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
    wifi: { label: 'Wi-Fi', icon: <Wifi size={18} /> },
    kitchen: { label: 'מטבח', icon: <Utensils size={18} /> },
    washer: { label: 'מכונת כביסה', icon: <WashingMachine size={18} /> },
    airConditioning: { label: 'מיזוג אוויר', icon: <Thermometer size={18} /> },
    tv: { label: 'טלוויזיה', icon: <Sofa size={18} /> },
    parking: { label: 'חנייה חינם', icon: <Car size={18} /> },
    pool: { label: 'בריכה', icon: <Waves size={18} /> },
    petFriendly: { label: 'ידידותי לחיות', icon: <PawPrint size={18} /> },
    gym: { label: 'חדר כושר', icon: <Dumbbell size={18} /> },
    balcony: { label: 'מרפסת', icon: <Trees size={18} /> },
};

interface PropertyMainInfoProps {
    title: string;
    description: string;
    maxGuests?: number;
    bedrooms?: number;
    beds?: number;
    bathrooms?: number;
    amenities?: string[];
    avgRating?: string | null;
    commentsCount?: number;
}

export const PropertyMainInfo: React.FC<PropertyMainInfoProps> = ({
    title,
    description,
    maxGuests = 2,
    bedrooms = 1,
    beds = 1,
    bathrooms = 1,
    amenities = [],
    avgRating,
    commentsCount = 0,
}) => {
    // Build dynamic highlights only from real data
    const highlights: React.ReactNode[] = [];

    if (avgRating && commentsCount > 0) {
        highlights.push(
            <div className="pd-highlight" key="rating">
                <div className="pd-highlight-icon"><Star size={24} /></div>
                <div>
                    <div className="pd-highlight-title">דירוג ממוצע {avgRating} ★</div>
                    <div className="pd-highlight-desc">על בסיס {commentsCount} ביקורות אורחים</div>
                </div>
            </div>
        );
    }

    if (amenities.includes('wifi')) {
        highlights.push(
            <div className="pd-highlight" key="wifi">
                <div className="pd-highlight-icon"><Wifi size={24} /></div>
                <div>
                    <div className="pd-highlight-title">Wi-Fi מהיר</div>
                    <div className="pd-highlight-desc">גלישה מהירה בכל רחבי הנכס</div>
                </div>
            </div>
        );
    }

    if (amenities.includes('parking')) {
        highlights.push(
            <div className="pd-highlight" key="parking">
                <div className="pd-highlight-icon"><Car size={24} /></div>
                <div>
                    <div className="pd-highlight-title">חנייה חינם</div>
                    <div className="pd-highlight-desc">חנייה צמודה כלולה בהזמנה</div>
                </div>
            </div>
        );
    }

    if (amenities.includes('pool')) {
        highlights.push(
            <div className="pd-highlight" key="pool">
                <div className="pd-highlight-icon"><Waves size={24} /></div>
                <div>
                    <div className="pd-highlight-title">בריכה פרטית</div>
                    <div className="pd-highlight-desc">שחייה ורגיעה בנכס</div>
                </div>
            </div>
        );
    }

    return (
        <div className="pd-main">
            {/* Host row */}
            <div className="pd-host-row">
                <div>
                    <h2 className="pd-host-title">נכס שלם · מארח/ת</h2>
                    <p className="pd-host-detail">
                        {maxGuests} אורחים · {bedrooms} חדרי שינה · {beds} מיטות · {bathrooms} חדרי אמבטיה
                    </p>
                </div>
                <div className="pd-host-avatar">
                    <span>{title?.[0] || '?'}</span>
                </div>
            </div>

            <hr className="pd-divider" />

            {/* Highlights — shown only when real data exists */}
            {highlights.length > 0 && (
                <>
                    <div className="pd-highlights">
                        {highlights}
                    </div>
                    <hr className="pd-divider" />
                </>
            )}

            {/* Stats strip */}
            <div className="pd-stats-strip">
                <div className="pd-stat"><Users size={18} /><span>{maxGuests} אורחים</span></div>
                <div className="pd-stat"><Bed size={18} /><span>{bedrooms} חדרי שינה · {beds} מיטות</span></div>
                <div className="pd-stat"><Bath size={18} /><span>{bathrooms} חדרי אמבטיה</span></div>
            </div>

            <hr className="pd-divider" />

            {/* Description */}
            <div className="pd-description">
                <h3 className="pd-section-title">אודות הנכס</h3>
                <p className="pd-description-text">{description}</p>
            </div>

            <hr className="pd-divider" />

            {/* Amenities */}
            <div className="pd-amenities">
                <h3 className="pd-section-title">מה המקום מציע</h3>
                <div className="pd-amenities-grid">
                    {amenities.length > 0 ? amenities.map((key) => {
                        const cfg = AMENITY_CONFIG[key];
                        return cfg ? (
                            <div className="pd-amenity-item" key={key}>
                                <span className="pd-amenity-icon">{cfg.icon}</span>
                                <span>{cfg.label}</span>
                            </div>
                        ) : (
                            <div className="pd-amenity-item" key={key}>
                                <Check size={16} className="pd-amenity-icon" />
                                <span>{key}</span>
                            </div>
                        );
                    }) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>לא צוינו שירותים</p>
                    )}
                </div>
            </div>
        </div>
    );
};
