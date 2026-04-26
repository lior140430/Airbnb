import type { SearchFilters } from '@/features/properties/components/search/search.types';
import React, { createContext, useCallback, useContext, useState } from 'react';

const EMPTY_FILTERS: SearchFilters = {
    query: '',
    location: '',
    checkIn: '',
    checkOut: '',
    guests: 0,
};

interface PropertyContextType {
    refreshTrigger: number;
    triggerRefresh: () => void;
    searchFilters: SearchFilters;
    setSearchFilters: (filters: SearchFilters) => void;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export const PropertyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [searchFilters, setSearchFiltersState] = useState<SearchFilters>(EMPTY_FILTERS);

    const triggerRefresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    const setSearchFilters = useCallback((filters: SearchFilters) => {
        setSearchFiltersState(filters);
        // Also trigger a refresh so PropertyFeed picks up new filters
        setRefreshTrigger(prev => prev + 1);
    }, []);

    return (
        <PropertyContext.Provider value={{ refreshTrigger, triggerRefresh, searchFilters, setSearchFilters }}>
            {children}
        </PropertyContext.Provider>
    );
};

export const useProperty = () => {
    const context = useContext(PropertyContext);
    if (!context) {
        throw new Error('useProperty must be used within a PropertyProvider');
    }
    return context;
};
