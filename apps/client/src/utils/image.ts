import { PROPERTY_API_URL, AUTH_API_URL } from '@/services/api';

// Inline SVG placeholder — no external service dependency, works offline
const PLACEHOLDER_SVG = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
      <rect width="800" height="600" fill="#f3f4f6"/>
      <g fill="none" stroke="#d1d5db" stroke-width="18" stroke-linecap="round" stroke-linejoin="round">
        <path d="M400 185 L265 300 L265 445 L355 445 L355 345 L445 345 L445 445 L535 445 L535 300 Z" fill="#e5e7eb" stroke="#d1d5db"/>
        <path d="M235 315 L400 160 L565 315"/>
        <rect x="455" y="195" width="40" height="72" rx="4" fill="#e5e7eb"/>
      </g>
    </svg>`
)}`;

/**
 * Resolves an image path to a full URL.
 * - Returns inline SVG placeholder if no path provided
 * - Returns as-is if already a full URL
 * - Prepends the property API base URL otherwise
 */
export const getImageUrl = (imagePath?: string): string => {
    if (!imagePath) return PLACEHOLDER_SVG;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.includes('uploads/avatars')) return `${AUTH_API_URL}/${imagePath}`;
    return `${PROPERTY_API_URL}/${imagePath}`;
};

/**
 * @deprecated use getImageUrl() instead
 */
export const getPlaceholderImageHe = (): string => PLACEHOLDER_SVG;

/**
 * Handle image load error by swapping to the inline SVG placeholder.
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    e.currentTarget.src = PLACEHOLDER_SVG;
    e.currentTarget.onerror = null; // prevent infinite loop
};
