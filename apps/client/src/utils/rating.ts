interface HasRating {
    rating: number;
}

/**
 * Compute the average rating from an array of items with a `rating` field.
 * Returns the formatted string (e.g. "4.3") or null if no items.
 */
export const getAverageRating = (items?: HasRating[]): string | null => {
    if (!items || items.length === 0) return null;
    const sum = items.reduce((acc, item) => acc + (item.rating || 0), 0);
    return (sum / items.length).toFixed(1);
};
