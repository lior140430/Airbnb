import React, { forwardRef } from 'react';
import './IconButton.css';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'ghost' | 'outline';
    size?: 'small' | 'medium' | 'large';
    children: React.ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ className = '', variant = 'ghost', size = 'medium', children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={`icon-btn variant-${variant} size-${size} ${className}`}
                {...props}
            >
                {children}
            </button>
        );
    }
);

IconButton.displayName = 'IconButton';
