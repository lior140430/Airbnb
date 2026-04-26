/**
 * Format a number as Israeli Shekel price string.
 * @example formatPrice(1500) → '₪1,500'
 */
export const formatPrice = (amount: number): string => {
    return `₪${amount.toLocaleString()}`;
};

/**
 * Format an ISO date string to a short Hebrew-friendly display.
 * @example formatDate('2026-03-01T00:00:00Z') → '01/03/2026'
 */
export const formatDate = (isoDate: string): string => {
    const d = new Date(isoDate);
    return d.toLocaleDateString('he-IL');
};

/**
 * Format an ISO date string to just the date portion (YYYY-MM-DD).
 */
export const formatDateShort = (isoDate: string): string => {
    return isoDate.substring(0, 10);
};
