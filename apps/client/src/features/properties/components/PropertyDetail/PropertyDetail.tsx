import { useAuth } from '@/context/AuthContext';
import { useChatContext } from '@/context/ChatContext';
import { getAverageRating } from '@/utils/rating';
import { MessageCircle } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toggleLike, type Property } from '../../property.service';
import './PropertyDetail.css';
import { PropertyGallery } from './components/PropertyGallery/PropertyGallery';
import { PropertyMainInfo } from './components/PropertyMainInfo/PropertyMainInfo';
import { PropertyReviews } from './components/PropertyReviews/PropertyReviews';
import { PropertySidebar } from './components/PropertySidebar/PropertySidebar';
import { PropertyTitle } from './components/PropertyTitle/PropertyTitle';
import { PropertyLocation } from '../PropertyLocation/PropertyLocation';
import { PropertyTopbar } from './components/PropertyTopbar/PropertyTopbar';

interface PropertyDetailProps {
    property: Property;
    onRefresh: () => void;
}

export const PropertyDetail: React.FC<PropertyDetailProps> = ({ property, onRefresh }) => {
    const { isAuthenticated, openAuthDialog, user } = useAuth();
    const { openChatWithUser } = useChatContext();
    const [isLiked, setIsLiked] = useState<boolean>(property.isLiked || false);

    const isOwnProperty = user?._id === property.ownerId;

    const handleContactHost = () => {
        if (!isAuthenticated) {
            openAuthDialog();
            return;
        }
        if (property.ownerId) {
            openChatWithUser(property.ownerId);
        }
    };

    const handleLikeClick = async (e: React.MouseEvent) => {
        e.preventDefault();

        if (!isAuthenticated) {
            openAuthDialog();
            return;
        }

        const newState = !isLiked;
        setIsLiked(newState);

        try {
            await toggleLike(property._id);
        } catch (error) {
            setIsLiked(!newState);
            console.error('Failed to toggle like', error);
        }
    };

    const avgRating = getAverageRating(property.comments);

    return (
        <div className="pd">
            <PropertyTopbar
                isLiked={isLiked}
                onLikeClick={handleLikeClick}
            />

            <PropertyTitle
                title={property.title}
                avgRating={avgRating}
                commentsCount={property.commentsCount}
                city={property.location.city}
                street={property.location.street}
            />

            <PropertyGallery
                images={property.images || []}
                title={property.title}
            />

            <div className="pd-content">
                <PropertyMainInfo
                    title={property.title}
                    description={property.description}
                    maxGuests={property.maxGuests}
                    bedrooms={property.bedrooms}
                    beds={property.beds}
                    bathrooms={property.bathrooms}
                    amenities={property.amenities}
                />

                <PropertySidebar
                    price={property.price}
                />
            </div>

            {!isOwnProperty && (
                <div className="pd-contact-host">
                    <button className="pd-contact-host-btn" onClick={handleContactHost}>
                        <MessageCircle size={20} />
                        צור קשר עם המארח
                    </button>
                </div>
            )}

            <PropertyLocation
                coordinates={property.coordinates}
                city={property.location.city}
                street={property.location.street}
            />

            <PropertyReviews
                property={property}
                avgRating={avgRating}
                onRefresh={onRefresh}
            />

            {property.commentsCount > 0 && (
                <div className="pd-all-reviews-link">
                    <Link to={`/property/${property._id}/reviews`}>
                        ראה את כל הביקורות
                    </Link>
                </div>
            )}
        </div>
    );
};
