export interface SearchFilters {
    query: string;
    location: string;
    checkIn: string;
    checkOut: string;
    guests: number;
}

export const EMPTY_FILTERS: SearchFilters = {
    query: '',
    location: '',
    checkIn: '',
    checkOut: '',
    guests: 0,
};

export const LOCATIONS = [
    'Tel Aviv',
    'Jerusalem',
    'Haifa',
    'Eilat',
    'Rishon LeZion',
    'Netanya',
    'Ashdod',
];

export type ActivePanel = 'location' | 'checkin' | 'checkout' | 'guests' | null;
