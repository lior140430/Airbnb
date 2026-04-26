import { useProperty } from '@/context/PropertyContext';
import React, { useEffect, useRef, useState } from 'react';
import { aiSearch, getProperties, type Property } from '../../property.service';
import { PropertyCard } from '../PropertyCard/PropertyCard';
import { PropertyCardSkeleton } from '../PropertyCard/PropertyCardSkeleton';
import './PropertyFeed.css';

interface PropertyFeedProps {
    onPropertiesLoaded?: (properties: Property[]) => void;
}

export const PropertyFeed: React.FC<PropertyFeedProps> = ({ onPropertiesLoaded }) => {
    const { refreshTrigger, searchFilters } = useProperty();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(false);

    // Refs so the IntersectionObserver callback is never stale
    const sentinelRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef(false);
    const hasMoreRef = useRef(true);
    const pageRef = useRef(1);
    const filtersRef = useRef(searchFilters);

    // Keep filtersRef in sync every render (no re-subscription needed)
    filtersRef.current = searchFilters;

    // Notify parent when properties change
    useEffect(() => {
        onPropertiesLoaded?.(properties);
    }, [properties, onPropertiesLoaded]);

    const loadNext = () => {
        if (loadingRef.current || !hasMoreRef.current) return;

        const currentPage = pageRef.current;
        const search = filtersRef.current;

        loadingRef.current = true;
        setLoading(true);

        // Only use AI search when there is actual free-text query; otherwise use plain endpoint
        const fetcher = search.query?.trim() ? aiSearch : getProperties;
        fetcher(currentPage, 20, {
            query: search.query,
            location: search.location,
            checkIn: search.checkIn,
            checkOut: search.checkOut,
            guests: search.guests,
        })
            .then((data) => {
                if (data.length === 0) {
                    hasMoreRef.current = false;
                    if (currentPage === 1) setProperties([]);
                } else {
                    setProperties((prev) => currentPage === 1 ? data : [...prev, ...data]);
                    pageRef.current = currentPage + 1;
                    hasMoreRef.current = data.length === 20;
                }
            })
            .catch((err) => console.error('Failed to load properties', err))
            .finally(() => {
                loadingRef.current = false;
                setLoading(false);
            });
    };

    // Reset + initial load whenever search is triggered
    useEffect(() => {
        hasMoreRef.current = true;
        pageRef.current = 1;
        loadNext();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshTrigger]);

    // IntersectionObserver — registered once, never stale because it reads from refs
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) loadNext();
            },
            { rootMargin: '300px' },
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // mount-only: loadNext reads refs so there's no stale closure

    return (
        <>
            <div className="property-feed-grid">
                {properties.map((property) => (
                    <PropertyCard key={property._id} property={property} />
                ))}
                {loading && Array.from({ length: properties.length === 0 ? 8 : 4 }).map((_, i) => (
                    <PropertyCardSkeleton key={`skeleton-${i}`} />
                ))}
            </div>
            {!loading && properties.length === 0 && (
                <div className="feed-loader">לא נמצאו נכסים.</div>
            )}
            <div ref={sentinelRef} style={{ height: 1 }} />
        </>
    );
};
