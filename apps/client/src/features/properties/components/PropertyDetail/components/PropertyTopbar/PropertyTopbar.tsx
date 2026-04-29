import { ChevronLeft, Share, Heart, Check } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface PropertyTopbarProps {
    isLiked: boolean;
    onLikeClick: (e: React.MouseEvent) => void;
}

export const PropertyTopbar: React.FC<PropertyTopbarProps> = ({ isLiked, onLikeClick }) => {
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try { await navigator.share({ title: document.title, url }); } catch { /* user cancelled */ }
        } else {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="pd-topbar">
            <button className="pd-back" onClick={() => navigate(-1)}>
                <ChevronLeft size={20} />
                <span>חזרה</span>
            </button>
            <div className="pd-topbar-actions">
                <button className="pd-action-btn" onClick={handleShare}>
                    {copied ? <Check size={16} color="#22c55e" /> : <Share size={16} />}
                    <span>{copied ? 'הועתק!' : 'שיתוף'}</span>
                </button>
                <button className="pd-action-btn" onClick={onLikeClick}>
                    <Heart size={16} fill={isLiked ? '#FF385C' : 'transparent'} color={isLiked ? '#FF385C' : 'currentColor'} />
                    <span>{isLiked ? 'נשמר' : 'שמירה'}</span>
                </button>
            </div>
        </div>
    );
};
