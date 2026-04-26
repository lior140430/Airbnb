import { PROPERTY_API_URL, AUTH_API_URL } from '@/services/api';

const PLACEHOLDER_IMAGE = 'https://placehold.co/600x400';
const PLACEHOLDER_IMAGE_HE = 'https://placehold.co/600x400?text=אין+תמונה';

/**
 * Resolves an image path to a full URL.
 * - Returns placeholder if no path provided
 * - Returns as-is if already a full URL
 * - Prepends the property API base URL otherwise
 */
export const getImageUrl = (imagePath?: string): string => {
    if (!imagePath) return PLACEHOLDER_IMAGE;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.includes('uploads/avatars')) return `${AUTH_API_URL}/${imagePath}`;
    return `${PROPERTY_API_URL}/${imagePath}`;
};

/**
 * Placeholder image with Hebrew "no image" text.
 */
export const getPlaceholderImageHe = (): string => PLACEHOLDER_IMAGE_HE;

/**
 * Handle image load error by swapping to placeholder.
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    e.currentTarget.src = PLACEHOLDER_IMAGE_HE;
};
