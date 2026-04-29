import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import './PropertyMap.css';

// Fallback coordinates for known Israeli cities — used when a property
// has no exact coordinates stored (e.g. created with an imprecise address)
const CITY_CENTERS: Record<string, [number, number]> = {
    'תל אביב': [32.0853, 34.7818],
    'ירושלים': [31.7767, 35.2345],
    'חיפה': [32.7940, 34.9896],
    'אילת': [29.5577, 34.9519],
    'נתניה': [32.3226, 34.8533],
    'באר שבע': [31.2518, 34.7913],
    'ראשון לציון': [31.9730, 34.7925],
    'אשדוד': [31.8044, 34.6553],
    'צפת': [32.9647, 35.4975],
    'טבריה': [32.7922, 35.5312],
    'מצפה רמון': [30.6105, 34.8017],
    'ראש פינה': [32.9758, 35.5678],
    'עכו': [32.9278, 35.0760],
    'נהריה': [33.0037, 35.0975],
    'רמת גן': [32.0686, 34.8239],
    'פתח תקווה': [32.0842, 34.8878],
    'הרצליה': [32.1644, 34.8444],
    'רחובות': [31.8960, 34.8118],
    'גבעתיים': [32.0664, 34.8137],
    'בת ים': [32.0179, 34.7506],
    'חולון': [32.0114, 34.7735],
    'בני ברק': [32.0833, 34.8333],
    'דימונה': [31.0698, 35.0336],
    'ערד': [31.2574, 35.2134],
    'קצרין': [32.9951, 35.6942],
};

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
        () =>
            properties
                .map((p) => {
                    if (p.coordinates?.lat != null && p.coordinates?.lng != null) return p;
                    // Fallback: use city-centre coordinates when property has no exact coords
                    const cityFallback = CITY_CENTERS[p.location?.city];
                    if (cityFallback) {
                        return { ...p, coordinates: { lat: cityFallback[0], lng: cityFallback[1] }, _cityFallback: true };
                    }
                    return p;
                })
                .filter((p) => p.coordinates?.lat != null && p.coordinates?.lng != null),
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
