import { ChevronLeft, Share, Heart } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface PropertyTopbarProps {
    isLiked: boolean;
    onLikeClick: (e: React.MouseEvent) => void;
}

export const PropertyTopbar: React.FC<PropertyTopbarProps> = ({ isLiked, onLikeClick }) => {
    const navigate = useNavigate();
    return (
        <div className="pd-topbar">
            <button className="pd-back" onClick={() => navigate(-1)}>
                <ChevronLeft size={20} />
                <span>חזרה</span>
            </button>
            <div className="pd-topbar-actions">
                <button className="pd-action-btn">
                    <Share size={16} />
                    <span>שיתוף</span>
                </button>
                <button className="pd-action-btn" onClick={onLikeClick}>
                    <Heart size={16} fill={isLiked ? '#FF385C' : 'transparent'} color={isLiked ? '#FF385C' : 'currentColor'} />
                    <span>{isLiked ? 'נשמר' : 'שמירה'}</span>
                </button>
            </div>
        </div>
    );
};
