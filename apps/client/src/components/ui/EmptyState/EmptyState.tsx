import React from 'react';
import { Button } from '../Button/Button';
import './EmptyState.css';

interface EmptyStateProps {
    /** Icon to render inside a circle */
    icon: React.ReactNode;
    /** Main heading */
    title: string;
    /** Description text (supports JSX for line breaks) */
    description?: React.ReactNode;
    /** Optional action button label */
    actionLabel?: string;
    /** Optional action button click handler */
    onAction?: () => void;
    /** Button variant */
    actionVariant?: 'primary' | 'outline';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    actionVariant = 'outline',
}) => {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">{icon}</div>
            <h3 className="empty-state-title">{title}</h3>
            {description && <p className="empty-state-desc">{description}</p>}
            {actionLabel && onAction && (
                <Button variant={actionVariant} onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};
