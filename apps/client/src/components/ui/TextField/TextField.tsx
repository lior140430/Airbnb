import React from 'react';
import './TextField.css';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    rightElement?: React.ReactNode;
    multiline?: boolean;
    rows?: number;
}

export const TextField: React.FC<TextFieldProps> = ({ label, error, className, rightElement, multiline, rows, ...props }) => {
    return (
        <div className={`text-field-container ${className || ''}`}>
            {label && <label className="text-field-label">{label}</label>}
            <div className="text-field-input-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                {multiline ? (
                    <textarea
                        className="text-field-input"
                        rows={rows}
                        {...(props as any)}
                    />
                ) : (
                    <input
                        className="text-field-input"
                        {...props}
                        style={{ ...props.style, paddingRight: rightElement ? '40px' : undefined }}
                    />
                )}
                {rightElement && (
                    <div className="text-field-right-element" style={{ position: 'absolute', right: '12px', display: 'flex', alignItems: 'center' }}>
                        {rightElement}
                    </div>
                )}
            </div>
            {error && <span className="text-field-error">{error}</span>}
        </div>
    );
};
