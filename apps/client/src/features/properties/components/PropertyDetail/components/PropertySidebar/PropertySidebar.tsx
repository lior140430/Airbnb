import { formatPrice } from '@/utils/format';
import React from 'react';

interface PropertySidebarProps {
    price: number;
}

export const PropertySidebar: React.FC<PropertySidebarProps> = ({ price }) => {
    return (
        <aside className="pd-sidebar">
            <div className="pd-booking-card">
                <div className="pd-booking-price">
                    <span className="pd-price-amount">{formatPrice(price)}</span>
                    <span className="pd-price-unit">ללילה</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '16px', textAlign: 'center', lineHeight: 1.5 }}>
                    להזמנה — פנה למארח דרך כפתור "צור קשר עם המארח"
                </p>
            </div>
        </aside>
    );
};
