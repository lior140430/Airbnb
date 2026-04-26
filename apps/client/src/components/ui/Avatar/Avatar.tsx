import * as AvatarPrimitive from '@radix-ui/react-avatar';
import React from 'react';
import './Avatar.css';

interface AvatarProps {
    src?: string;
    alt?: string;
    fallback: string;
    size?: 'small' | 'medium' | 'large' | 'xlarge';
    className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, fallback, size = 'medium', className = '' }) => {
    return (
        <AvatarPrimitive.Root className={`AvatarRoot ${size} ${className}`}>
            <AvatarPrimitive.Image
                className="AvatarImage"
                src={src}
                alt={alt}
            />
            <AvatarPrimitive.Fallback className="AvatarFallback" delayMs={0}>
                {fallback ? fallback.toUpperCase() : ''}
            </AvatarPrimitive.Fallback>
        </AvatarPrimitive.Root>
    );
};
