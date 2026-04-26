import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import './PropertyMap.css';

// Fix default marker icon issue with Leaflet + Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

interface PropertyMapProps {
    properties: Array<{
        _id: string;
        title: string;
        price: number;
        coordinates?: { lat: number; lng: number } | null;
        location: { city: string; street: string };
    }>;
    center?: [number, number];
    zoom?: number;
    onMarkerClick?: (propertyId: string) => void;
    height?: string;
    singleProperty?: boolean;
}

function createPricePillIcon(price: number): L.DivIcon {
    return L.divIcon({
        className: 'pm-price-marker',
        html: `<div class="pm-price-pill">\u20AA${price.toLocaleString()}</div>`,
        iconSize: [80, 32],
        iconAnchor: [40, 32],
    });
}

export const PropertyMap: React.FC<PropertyMapProps> = ({
    properties,
    center = [31.5, 34.8],
    zoom = 8,
    onMarkerClick,
    height = '100%',
    singleProperty = false,
}) => {
    const propertiesWithCoords = useMemo(
        () => properties.filter((p) => p.coordinates?.lat != null && p.coordinates?.lng != null),
        [properties],
    );

    const mapCenter = useMemo<[number, number]>(() => {
        if (propertiesWithCoords.length === 1 && propertiesWithCoords[0].coordinates) {
            return [propertiesWithCoords[0].coordinates.lat, propertiesWithCoords[0].coordinates.lng];
        }
        if (propertiesWithCoords.length > 0 && singleProperty && propertiesWithCoords[0].coordinates) {
            return [propertiesWithCoords[0].coordinates.lat, propertiesWithCoords[0].coordinates.lng];
        }
        return center;
    }, [propertiesWithCoords, center, singleProperty]);

    const mapZoom = singleProperty ? 15 : zoom;

    if (propertiesWithCoords.length === 0) {
        return (
            <div className="pm-empty" style={{ height }}>
                <span className="pm-empty-text">אין נתוני מיקום להצגה</span>
            </div>
        );
    }

    return (
        <div className="pm-container" style={{ height }}>
            <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                className="pm-map"
                scrollWheelZoom={!singleProperty}
                dragging={!singleProperty || propertiesWithCoords.length > 0}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {propertiesWithCoords.map((property) => (
                    <Marker
                        key={property._id}
                        position={[property.coordinates!.lat, property.coordinates!.lng]}
                        icon={singleProperty ? new L.Icon.Default() : createPricePillIcon(property.price)}
                        eventHandlers={{
                            click: () => onMarkerClick?.(property._id),
                        }}
                    >
                        <Popup className="pm-popup">
                            <div className="pm-popup-content">
                                <strong className="pm-popup-title">{property.title}</strong>
                                <span className="pm-popup-price">{'\u20AA'}{property.price.toLocaleString()} / לילה</span>
                                <span className="pm-popup-location">
                                    {property.location.city}, {property.location.street}
                                </span>
                                {onMarkerClick && (
                                    <button
                                        className="pm-popup-link"
                                        onClick={() => onMarkerClick(property._id)}
                                    >
                                        צפה בנכס
                                    </button>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};
