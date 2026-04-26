import { PropertyMap } from '@/components/ui/Map/PropertyMap';
import { PropertyFeed } from '@/features/properties/components/PropertyFeed/PropertyFeed';
import type { Property } from '@/features/properties/property.service';
import { Map, X } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeScreen.css';

const MAP_VISIBLE_KEY = 'home-map-visible';

function getInitialMapVisible(): boolean {
    try {
        const stored = localStorage.getItem(MAP_VISIBLE_KEY);
        return stored === 'true';
    } catch {
        return false;
    }
}

export const HomeScreen: React.FC = () => {
    const [showMap, setShowMap] = useState(getInitialMapVisible);
    const [properties, setProperties] = useState<Property[]>([]);
    const navigate = useNavigate();

    const handleToggleMap = () => {
        setShowMap((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(MAP_VISIBLE_KEY, String(next));
            } catch { /* ignore */ }
            return next;
        });
    };

    const handlePropertiesLoaded = useCallback((props: Property[]) => {
        setProperties(props);
    }, []);

    const handleMarkerClick = (propertyId: string) => {
        navigate(`/property/${propertyId}`);
    };

    return (
        <div className={`hs-container ${showMap ? 'hs-container--with-map' : ''}`}>
            <button className="hs-map-toggle" onClick={handleToggleMap}>
                {showMap ? <X size={18} /> : <Map size={18} />}
                <span>{showMap ? 'הסתר מפה' : 'הצג מפה'}</span>
            </button>

            <div className="hs-feed">
                <PropertyFeed onPropertiesLoaded={handlePropertiesLoaded} />
            </div>

            {showMap && (
                <div className="hs-map">
                    <PropertyMap
                        properties={properties}
                        onMarkerClick={handleMarkerClick}
                        height="100%"
                    />
                </div>
            )}
        </div>
    );
};
