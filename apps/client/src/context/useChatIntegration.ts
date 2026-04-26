import { useCallback } from 'react';
import { useChatContext } from './ChatContext';

/**
 * Hook to integrate chat functionality with other pages
 * Provides helper methods to open chat with a specific user
 */
export const useChatIntegration = () => {
    const { openChatWithUser } = useChatContext();

    const startConversation = useCallback(
        (userId: string, userName?: string) => {
            openChatWithUser(userId);
        },
        [openChatWithUser],
    );

    return {
        startConversation,
    };
};
