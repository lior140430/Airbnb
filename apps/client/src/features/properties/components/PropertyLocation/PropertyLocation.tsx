import React from 'react';
import { PropertyMap } from '@/components/ui/Map/PropertyMap';
import './PropertyLocation.css';

interface PropertyLocationProps {
    coordinates?: { lat: number; lng: number } | null;
    city: string;
    street: string;
}

export const PropertyLocation: React.FC<PropertyLocationProps> = ({
    coordinates,
    city,
    street,
}) => {
    return (
        <section className="pl-section">
            <h2 className="pl-heading">מיקום</h2>

            {coordinates ? (
                <PropertyMap
                    properties={[
                        {
                            _id: 'single',
                            title: `${city}, ${street}`,
                            price: 0,
                            coordinates,
                            location: { city, street },
                        },
                    ]}
                    singleProperty
                    height="400px"
                />
            ) : (
                <div className="pl-unavailable">מיקום לא זמין</div>
            )}

            <p className="pl-address">
                {street}, {city}
            </p>
        </section>
    );
};
