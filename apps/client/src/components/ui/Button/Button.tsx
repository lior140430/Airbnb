import React from 'react';
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'social' | 'outline';
    loading?: boolean;
    fullWidth?: boolean;
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    loading = false,
    fullWidth = false,
    className = '',
    children,
    disabled,
    ...props
}) => {
    const baseClass = 'btn';
    const variantClass = `btn-${variant}`;
    const widthClass = fullWidth ? 'w-100' : '';

    return (
        <button
            className={`${baseClass} ${variantClass} ${widthClass} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? 'טוען...' : children}
        </button>
    );
};
