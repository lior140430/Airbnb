import { Button } from '@/components/ui/Button/Button';
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

                <div className="pd-booking-dates">
                    <div className="pd-booking-date-cell">
                        <label>צ'ק-אין</label>
                        <span>12/03/2026</span>
                    </div>
                    <div className="pd-booking-date-cell">
                        <label>צ'ק-אאוט</label>
                        <span>14/03/2026</span>
                    </div>
                </div>

                <div className="pd-booking-guests">
                    <label>אורחים</label>
                    <span>1 אורח</span>
                </div>

                <Button className="pd-booking-btn">הזמנה</Button>

                <p className="pd-booking-note">לא תחויבו עדיין</p>

                <div className="pd-price-breakdown">
                    <div className="pd-price-row">
                        <span>{formatPrice(price)} x 2 לילות</span>
                        <span>{formatPrice(price * 2)}</span>
                    </div>
                    <div className="pd-price-row">
                        <span>דמי שירות</span>
                        <span>{formatPrice(Math.round(price * 0.14))}</span>
                    </div>
                    <hr className="pd-divider" />
                    <div className="pd-price-row pd-price-total">
                        <span>סה״כ</span>
                        <span>{formatPrice(price * 2 + Math.round(price * 0.14))}</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};
