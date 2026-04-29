import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/utils/format';
import { getImageUrl, handleImageError } from '@/utils/image';
import { Heart, MessageCircle, Star, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toggleLike, type Property } from '../../property.service';
import './PropertyCard.css';

interface PropertyCardProps {
    property: Property;
    onDelete?: (id: string) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onDelete }) => {
    const [isLiked, setIsLiked] = useState(property.isLiked || false);
    const [likesCount, setLikesCount] = useState(property.likesCount || 0);
    const [deleting, setDeleting] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated, openAuthDialog } = useAuth();

    const handleDeleteClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm(`למחוק את "${property.title}"?`)) return;
        setDeleting(true);
        try {
            await onDelete!(property._id);
        } finally {
            setDeleting(false);
        }
    };

    const handleLikeClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            openAuthDialog();
            return;
        }

        const newState = !isLiked;
        setIsLiked(newState);
        setLikesCount((prev) => (newState ? prev + 1 : prev - 1));

        try {
            await toggleLike(property._id);
        } catch (error) {
            setIsLiked(!newState);
            setLikesCount((prev) => (!newState ? prev + 1 : prev - 1));
            console.error('Failed to toggle like', error);
        }
    };

    const imageUrl = getImageUrl(property.images?.[0]);

    const onCardClick = () => {
        navigate(`/property/${property._id}`);
    };

    return (
        <div className="property-card" style={{ cursor: 'pointer' }} onClick={onCardClick}>
            <div className="property-image-container" style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px' }}>
                <img
                    src={imageUrl}
                    alt={property.title}
                    className="property-image"
                    style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }}
                    onError={handleImageError}
                />

                <button
                    className="like-button"
                    onClick={handleLikeClick}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    title={`${likesCount} לייקים`}
                    style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        zIndex: 10
                    }}
                >
                    <Heart
                        size={24}
                        fill={isLiked ? '#FF385C' : 'rgba(0, 0, 0, 0.5)'}
                        color={isLiked ? '#FF385C' : '#FFFFFF'}
                        strokeWidth={2}
                        style={{ pointerEvents: 'none' }}
                    />
                </button>

                {onDelete && (
                    <button
                        className="delete-property-btn"
                        onClick={handleDeleteClick}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        title="מחק נכס"
                        disabled={deleting}
                        style={{
                            position: 'absolute',
                            top: '12px',
                            left: '12px',
                            background: 'rgba(0,0,0,0.45)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: deleting ? 'not-allowed' : 'pointer',
                            zIndex: 10,
                            opacity: deleting ? 0.5 : 1,
                            transition: 'background 0.2s',
                        }}
                    >
                        <Trash2 size={16} color="#fff" style={{ pointerEvents: 'none' }} />
                    </button>
                )}
            </div>

            <div className="property-details">
                <div className="property-header">
                    <span className="property-title">{property.title}</span>        
                    {property.averageRating !== null && (
                        <div className="property-rating">
                            <Star size={14} fill="currentColor" strokeWidth={0} />  
                            <span style={{ fontWeight: 600 }}>{property.averageRating}</span>
                        </div>
                    )}
                </div>

                <div className="property-location">
                    {property.location.city}, {property.location.street}
                </div>

                <div className="property-price">
                    <span className="price-bold">{formatPrice(property.price)}</span> ללילה
                </div>

                <div className="property-stats">
                    <span className="property-stat">
                        <Heart size={14} />
                        {likesCount}
                    </span>
                    <span className="property-stat">
                        <MessageCircle size={14} />
                        {property.commentsCount}
                    </span>
                </div>
            </div>
        </div>
    );
};
