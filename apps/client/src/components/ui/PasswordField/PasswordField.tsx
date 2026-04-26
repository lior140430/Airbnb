import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { TextField } from '../TextField/TextField';

interface PasswordFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    error?: string;
}

/**
 * A TextField with a built-in show/hide password toggle.
 */
export const PasswordField: React.FC<PasswordFieldProps> = ({ ...props }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <TextField
            {...props}
            type={showPassword ? 'text' : 'password'}
            rightElement={
                <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                    tabIndex={-1}
                    aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            }
        />
    );
};
