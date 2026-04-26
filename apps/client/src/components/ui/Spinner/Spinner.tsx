import { Loader2 } from 'lucide-react';
import React from 'react';
import './Spinner.css';

interface SpinnerProps {
    /** Icon size in pixels */
    size?: number;
    /** Optional message below the spinner */
    message?: string;
    /** Whether to center in a full container (adds padding) */
    fullPage?: boolean;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 32, message, fullPage = false }) => {
    return (
        <div className={`spinner-container ${fullPage ? 'spinner-full' : ''}`}>
            <Loader2 size={size} className="spinner-icon" />
            {message && <span className="spinner-message">{message}</span>}
        </div>
    );
};
