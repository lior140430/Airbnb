import { Button } from '@/components/ui/Button/Button';
import { Dialog } from '@/components/ui/Dialog/Dialog';
import { IconButton } from '@/components/ui/IconButton/IconButton';
import { PasswordField } from '@/components/ui/PasswordField/PasswordField';
import { TextField } from '@/components/ui/TextField/TextField';
import { useAuth } from '@/context/AuthContext';
import { login as apiLogin, signup as apiSignup, checkEmail } from '@/features/auth/auth.service';
import { useFormState } from '@/hooks/useFormState';
import { AUTH_API_URL } from '@/services/api';
import { motion, type Variants } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';
import React, { useState } from 'react';
import './AuthDialog.css';

const AnimatedLogo = () => {
    const iconVariants: Variants = {
        hidden: { pathLength: 0, fill: "rgba(255, 90, 95, 0)" },
        visible: {
            pathLength: 1,
            fill: "rgba(255, 90, 95, 1)",
            transition: {
                default: { duration: 1.5, ease: "easeInOut" },
                fill: { duration: 0.3, delay: 1 }
            }
        }
    };

    return (
        <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            width="50"
            height="50"
            style={{ display: 'block', margin: '0 auto' }}
        >
            <motion.path
                d="M60.9 45.487l-.966-2.305-1.475-3.27-.062-.062a661.83 661.83 0 0 0-14.15-28.957l-.198-.384-1.524-3.073a18.4 18.4 0 0 0-2.305-3.52A10.35 10.35 0 0 0 32.027 0a10.76 10.76 0 0 0-8.203 3.84 22.1 22.1 0 0 0-2.305 3.52l-1.735 3.395c-4.956 9.615-9.74 19.342-14.163 28.957l-.062.124c-.384 1.053-.892 2.13-1.413 3.284-.322.702-.644 1.47-.966 2.305a14.4 14.4 0 0 0-.768 6.914 13.63 13.63 0 0 0 8.327 10.631 13.16 13.16 0 0 0 5.192 1.028 14.57 14.57 0 0 0 1.66-.124 16.93 16.93 0 0 0 6.406-2.18 32.44 32.44 0 0 0 7.943-6.666 33.62 33.62 0 0 0 7.943 6.666 16.92 16.92 0 0 0 6.406 2.18c.55.073 1.105.114 1.66.124 1.783.018 3.55-.332 5.192-1.028a13.63 13.63 0 0 0 8.327-10.631 12.11 12.11 0 0 0-.582-6.852zM32.026 48.82c-3.457-4.362-5.7-8.45-6.468-11.92-.314-1.277-.38-2.6-.198-3.903.127-.965.48-1.886 1.028-2.7a6.79 6.79 0 0 1 5.638-2.825c2.236-.086 4.362.974 5.638 2.813a6.17 6.17 0 0 1 1.028 2.69 10.3 10.3 0 0 1-.198 3.903c-.768 3.395-3 7.435-6.468 11.92zm25.562 3c-.5 3.337-2.7 6.166-5.836 7.435a9.7 9.7 0 0 1-4.857.706 12.6 12.6 0 0 1-4.87-1.66 29.91 29.91 0 0 1-7.298-6.195c4.225-5.192 6.8-9.913 7.757-14.163a16.11 16.11 0 0 0 .322-5.452c-.238-1.567-.832-3.06-1.735-4.362-2.062-2.942-5.453-4.666-9.045-4.597-3.572-.046-6.942 1.65-9.033 4.547-.903 1.303-1.497 2.794-1.735 4.362a13.31 13.31 0 0 0 .322 5.452c.966 4.225 3.593 9.033 7.757 14.225a28.79 28.79 0 0 1-7.298 6.195 12.6 12.6 0 0 1-4.882 1.71 10.26 10.26 0 0 1-4.87-.644C9.16 58.12 6.94 55.292 6.45 51.954a10.61 10.61 0 0 1 .582-4.956c.198-.644.508-1.24.83-2.044.446-1.028.966-2.12 1.475-3.2l.062-.124c4.424-9.54 9.157-19.28 14.1-28.772l.186-.458 1.536-2.95a14.05 14.05 0 0 1 1.846-2.838 6.73 6.73 0 0 1 10.247 0 13.87 13.87 0 0 1 1.747 2.813l1.536 2.95.186.384c4.87 9.553 9.628 19.28 14.04 28.834v.062c.508 1.028.966 2.18 1.475 3.2.322.768.644 1.413.83 2.044a10.81 10.81 0 0 1 .446 4.956z"
                variants={iconVariants}
                initial="hidden"
                animate="visible"
                stroke="#ff5a5f"
                strokeWidth="1"
                fillRule="evenodd" // Important for correct rendering
            />
        </motion.svg>
    );
};

// Custom Google Icon as it's not in Lucide
const GoogleIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'>
        <path d="M32.582 370.734C15.127 336.291 5.12 297.425 5.12 256c0-41.426 10.007-80.291 27.462-114.735C74.705 57.484 161.047 0 261.12 0c69.12 0 126.836 25.367 171.287 66.793l-73.31 73.309c-26.763-25.135-60.276-38.168-97.977-38.168-66.56 0-123.113 44.917-143.36 105.426-5.12 15.36-8.146 31.65-8.146 48.64 0 16.989 3.026 33.28 8.146 48.64l-.303.232h.303c20.247 60.51 76.8 105.426 143.36 105.426 34.443 0 63.534-9.31 86.341-24.67 27.23-18.152 45.382-45.148 51.433-77.032H261.12v-99.142h241.105c3.025 16.757 4.654 34.211 4.654 52.364 0 77.963-27.927 143.592-76.334 188.276-42.356 39.098-100.305 61.905-169.425 61.905-100.073 0-186.415-57.483-228.538-141.032v-.233z" />
    </svg>
);

const FacebookIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="-5 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(-385.000000, -7399.000000)" fill="#000000">
            <g transform="translate(56.000000, 160.000000)">
                <path d="M335.821282,7259 L335.821282,7250 L338.553693,7250 L339,7246 L335.821282,7246 L335.821282,7244.052 C335.821282,7243.022 335.847593,7242 337.286884,7242 L338.744689,7242 L338.744689,7239.14 C338.744689,7239.097 337.492497,7239 336.225687,7239 C333.580004,7239 331.923407,7240.657 331.923407,7243.7 L331.923407,7246 L329,7246 L329,7250 L331.923407,7250 L331.923407,7259 L335.821282,7259 Z" />
            </g>
        </g>
    </svg>
);
interface AuthDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const AuthDialog: React.FC<AuthDialogProps> = ({ open, onOpenChange }) => {
    const { login } = useAuth();
    const [step, setStep] = useState<'initial' | 'password' | 'signup' | 'social-prompt'>('initial');
    const [socialProvider, setSocialProvider] = useState<'google' | 'facebook' | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form States
    const { values: formData, handleChange: handleInputChange, resetForm, setValues: setFormData } = useFormState({
        email: '',
        password: '',
        firstName: '',
        lastName: ''
    });

    const handleInputChangeWithClear = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleInputChange(e);
        setError(null);
    };

    const handleSocialLogin = (provider: 'google' | 'facebook') => {
        // Save current path to return after OAuth
        localStorage.setItem('auth_return_to', window.location.pathname);
        // Redirect to backend auth endpoint
        window.location.href = `${AUTH_API_URL}/auth/${provider}`;
    };

    const handleContinue = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (step === 'initial') {
            if (!formData.email) return;

            setLoading(true);
            try {
                const result = await checkEmail(formData.email);
                if (result.exists) {
                    if (result.hasPassword) {
                        setStep('password');
                    } else if (result.googleLinked) {
                        setStep('social-prompt');
                        setSocialProvider('google');
                    } else if (result.facebookLinked) {
                        setStep('social-prompt');
                        setSocialProvider('facebook');
                    } else {
                        // Fallback if password is missing but no provider linked (rare edge case)
                        setStep('password');
                    }
                } else {
                    setStep('signup');
                    setError('נראה שאתה חדש כאן! מלא את הפרטים להרשמה.');
                }
            } catch (err) {
                setError('שגיאה בבדיקת המייל. נסה שוב.');
            } finally {
                setLoading(false);
            }
        } else if (step === 'password') {
            handleSubmit();
        } else if (step === 'signup') {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            if (step === 'password') {
                const response = await apiLogin({ email: formData.email, password: formData.password });
                login(response.accessToken, response.user);
                onOpenChange(false);
            } else if (step === 'signup') {
                const response = await apiSignup({
                    email: formData.email,
                    password: formData.password,
                    firstName: formData.firstName,
                    lastName: formData.lastName
                });
                login(response.accessToken, response.user);
                onOpenChange(false);
            }
        } catch (err: any) {
            if (err.response?.status === 401 || err.response?.status === 400 || err.response?.status === 403) {
                if (step === 'password') {
                    setError('הסיסמה שהזנת שגויה. אנא נסה שוב.');
                } else {
                    setError('אירעה שגיאה בנתונים שהוזנו.');
                }
            } else if (err.message?.includes('not found') || err.message?.includes('User does not exist')) {
                setStep('signup');
                setError('נראה שאתה חדש כאן! מלא את הפרטים להרשמה.');
            } else {
                setError('שגיאה בהתחברות. נסה שוב או בדוק את הסיסמה.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen) {
            setStep('initial');
            resetForm();
            setError(null);
            setSocialProvider(null);
        }
        onOpenChange(isOpen);
    };

    const handleBack = () => {
        setStep('initial');
        setError(null);
    };

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Content className='dialog-content' style={{ width: '568px', maxWidth: '90%', maxHeight: '90vh', padding: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'white', borderRadius: '12px' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px', borderBottom: '1px solid #ebebeb', height: '64px', boxSizing: 'border-box' }}>
                    <div style={{ width: '32px', display: 'flex', justifyContent: 'flex-start' }}>
                        {step !== 'initial' && step !== 'social-prompt' && (
                            <IconButton variant="ghost" size="small" onClick={handleBack} style={{ padding: 0, minWidth: '32px', height: '32px', borderRadius: '50%' }}>
                                <ChevronRight size={16} />
                            </IconButton>
                        )}
                    </div>



                    <div style={{ width: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                        <IconButton variant="ghost" size="small" onClick={() => handleOpenChange(false)} style={{ padding: 0, minWidth: '32px', height: '32px', borderRadius: '50%' }}>
                            <X size={16} />
                        </IconButton>
                    </div>
                </div>

                <div style={{ padding: '24px', overflowY: 'auto' }}>

                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                        <AnimatedLogo />
                    </div>


                    <h3 className='dialog-welcome-text' style={{ textAlign: 'start', fontSize: '22px', fontWeight: 600, marginBottom: '24px' }}>
                        ברוכים הבאים ל-Yad2
                    </h3>

                    <form onSubmit={handleContinue} className='auth-form' style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        {step === 'initial' && (
                            <TextField
                                name='email'
                                placeholder='מספר טלפון או כתובת אימייל'
                                type='email'
                                value={formData.email}
                                onChange={handleInputChangeWithClear}
                                required
                                className="minimal-input"
                            />
                        )}

                        {step === 'password' && (
                            <div>
                                <PasswordField
                                    name='password'
                                    placeholder='סיסמה'
                                    value={formData.password}
                                    onChange={handleInputChangeWithClear}
                                    required
                                    className="minimal-input"
                                />
                                <div style={{ marginTop: '8px' }}>
                                    <span style={{ fontSize: '12px', color: '#222', textDecoration: 'underline', cursor: 'pointer', fontWeight: 500 }}>
                                        שכחת את הסיסמה?
                                    </span>
                                </div>
                            </div>
                        )}

                        {step === 'signup' && (
                            <>
                                <TextField
                                    name='firstName'
                                    placeholder='שם פרטי'
                                    value={formData.firstName}
                                    onChange={handleInputChangeWithClear}
                                    required
                                    className="minimal-input"
                                />
                                <TextField
                                    name='lastName'
                                    placeholder='שם משפחה'
                                    value={formData.lastName}
                                    onChange={handleInputChangeWithClear}
                                    required
                                    className="minimal-input"
                                />
                                <PasswordField
                                    name='password'
                                    placeholder='סיסמה'
                                    value={formData.password}
                                    onChange={handleInputChangeWithClear}
                                    required
                                    className="minimal-input"
                                />
                            </>
                        )}

                        {step === 'social-prompt' && (
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ marginBottom: '16px', fontSize: '14px', lineHeight: '1.5' }}>
                                    נראה שנרשמת בעזרת {socialProvider === 'google' ? 'Google' : 'Facebook'}.<br />
                                    אנא התחבר באמצעות הכפתור למטה.
                                </p>
                                <Button
                                    type='button'
                                    variant='social'
                                    fullWidth
                                    onClick={() => handleSocialLogin(socialProvider!)}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', border: '1px solid #333' }}
                                >
                                    {socialProvider === 'google' ? <GoogleIcon size={20} /> : <FacebookIcon size={20} />}
                                    המשך עם {socialProvider === 'google' ? 'Google' : 'Facebook'}
                                </Button>

                                <div style={{ marginTop: '16px' }}>
                                    <span
                                        onClick={() => { setStep('initial'); setFormData({ ...formData, email: '' }); }}
                                        style={{ fontSize: '12px', color: '#717171', textDecoration: 'underline', cursor: 'pointer' }}
                                    >
                                        השתמש בחשבון אחר
                                    </span>
                                </div>
                            </div>
                        )}

                        {error && <div className="error-message" style={{ color: 'red', fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>{error}</div>}

                        {step !== 'social-prompt' && (
                            <Button type='submit' loading={loading} fullWidth>
                                המשך
                            </Button>
                        )}
                    </form>

                    {/* Social Login Separator */}
                    {step === 'initial' && (
                        <>
                            <div className="separator" style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
                                <div style={{ flex: 1, height: '1px', background: '#dddddd' }}></div>
                                <span style={{ padding: '0 16px', fontSize: '12px', color: '#717171' }}>או</span>
                                <div style={{ flex: 1, height: '1px', background: '#dddddd' }}></div>
                            </div>

                            {/* Social Buttons */}
                            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                                <IconButton variant="outline" size="large" onClick={() => handleSocialLogin('google')}>
                                    <GoogleIcon size={24} />
                                </IconButton>
                                <IconButton variant="outline" size="large" onClick={() => handleSocialLogin('facebook')}>
                                    <FacebookIcon size={24} />
                                </IconButton>
                            </div>
                        </>
                    )}

                </div>
            </Dialog.Content>
        </Dialog.Root>
    );
};