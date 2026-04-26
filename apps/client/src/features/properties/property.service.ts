import axios from 'axios';
import { PROPERTY_API_URL, addAuthInterceptors } from '../../services/api';

const propertyApi = axios.create({
    baseURL: PROPERTY_API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

addAuthInterceptors(propertyApi);


export interface Property {
    _id: string;
    title: string;
    description: string;
    price: number;
    location: {
        city: string;
        street: string;
    };
    images: string[];
    likesCount: number;
    commentsCount: number;
    averageRating: number | null;
    isLiked?: boolean;
    ownerId?: string;
    comments?: Comment[];
    maxGuests?: number;
    bedrooms?: number;
    beds?: number;
    bathrooms?: number;
    amenities?: string[];
    coordinates?: { lat: number; lng: number } | null;
}

export interface Comment {
    _id: string;
    text: string;
    username: string;
    rating: number;
    createdAt?: string;
}

export interface PaginatedProperties {
    data: Property[];
}

export const createProperty = async (data: FormData) => {
    const response = await propertyApi.post('/properties', data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export interface SearchParams {
    query?: string;
    location?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
}

export const getProperties = async (page: number = 1, limit: number = 10, search?: SearchParams): Promise<Property[]> => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (search?.query) params.set('q', search.query);
    if (search?.location) params.set('location', search.location);
    if (search?.checkIn) params.set('checkIn', search.checkIn);
    if (search?.checkOut) params.set('checkOut', search.checkOut);
    if (search?.guests && search.guests > 0) params.set('guests', String(search.guests));

    const response = await propertyApi.get(`/properties?${params.toString()}`);
    return response.data;
};

export const aiSearch = async (page: number = 1, limit: number = 20, search?: SearchParams): Promise<Property[]> => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (search?.query) params.set('q', search.query);
    if (search?.location) params.set('location', search.location);
    if (search?.checkIn) params.set('checkIn', search.checkIn);
    if (search?.checkOut) params.set('checkOut', search.checkOut);
    if (search?.guests && search.guests > 0) params.set('guests', String(search.guests));

    const response = await propertyApi.get(`/properties/ai-search?${params.toString()}`);
    return response.data;
};

export const getProperty = async (id: string): Promise<Property> => {
    const response = await propertyApi.get(`/properties/${id}`);
    return response.data;
};

export const getMyProperties = async (page: number = 1, limit: number = 10): Promise<Property[]> => {
    const response = await propertyApi.get(`/properties/me?page=${page}&limit=${limit}`);
    return response.data;
};

export const toggleLike = async (id: string): Promise<{ liked: boolean }> => {
    const response = await propertyApi.post(`/properties/${id}/like`);
    return response.data;
};

export const addComment = async (id: string, text: string, rating: number) => {
    const response = await propertyApi.post(`/properties/${id}/comment`, { text, rating });
    return response.data;
};

export const getComments = async (id: string) => {
    const response = await propertyApi.get(`/properties/${id}/comments`);
    return response.data;
};

export const getUserProperties = async (userId: string, page: number = 1, limit: number = 10): Promise<Property[]> => {
    const response = await propertyApi.get(`/properties?ownerId=${userId}&page=${page}&limit=${limit}`);
    return response.data;
};
