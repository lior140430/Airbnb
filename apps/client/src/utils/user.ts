interface UserLike {
    firstName?: string;
    lastName?: string;
    email?: string;
}

/**
 * Get a display name from a user object.
 * Falls back to email if no name fields are set.
 */
export const getUserDisplayName = (user: UserLike): string => {
    return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || '';
};

/**
 * Get the initial character for an avatar fallback.
 * Tries firstName first, then email, then '?'.
 */
export const getUserInitial = (user: UserLike): string => {
    return (user.firstName?.[0] || user.email?.[0] || '?').toUpperCase();
};
