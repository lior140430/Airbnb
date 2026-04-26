import { Button } from '@/components/ui/Button/Button';
import { Dialog } from '@/components/ui/Dialog/Dialog';
import { IconButton } from '@/components/ui/IconButton/IconButton';
import { ImageUpload } from '@/components/ui/ImageUpload/ImageUpload';
import { TextField } from '@/components/ui/TextField/TextField';
import { useFormState } from '@/hooks/useFormState';
import { Bath, Bed, Car, Dumbbell, Minus, PawPrint, Plus, Sofa, Thermometer, Trees, Users, Utensils, WashingMachine, Waves, Wifi, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createProperty } from '../../property.service';
import './CreatePropertyDialog.css';

interface CreatePropertyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const STEPS = ['details', 'specs', 'photos'] as const;
type Step = typeof STEPS[number];

const INITIAL_FORM = { title: '', description: '', price: '', city: '', street: '' };

const AMENITY_OPTIONS = [
    { key: 'wifi', label: 'Wi-Fi', icon: <Wifi size={16} /> },
    { key: 'kitchen', label: 'מטבח', icon: <Utensils size={16} /> },
    { key: 'washer', label: 'מכונת כביסה', icon: <WashingMachine size={16} /> },
    { key: 'airConditioning', label: 'מיזוג אוויר', icon: <Thermometer size={16} /> },
    { key: 'tv', label: 'טלוויזיה', icon: <Sofa size={16} /> },
    { key: 'parking', label: 'חנייה', icon: <Car size={16} /> },
    { key: 'pool', label: 'בריכה', icon: <Waves size={16} /> },
    { key: 'petFriendly', label: 'ידידותי לחיות', icon: <PawPrint size={16} /> },
    { key: 'gym', label: 'חדר כושר', icon: <Dumbbell size={16} /> },
    { key: 'balcony', label: 'מרפסת', icon: <Trees size={16} /> },
];

interface SpecField { label: string; icon: React.ReactNode; key: string; min: number; max: number }
const SPEC_FIELDS: SpecField[] = [
    { key: 'maxGuests', label: 'אורחים', icon: <Users size={18} />, min: 1, max: 16 },
    { key: 'bedrooms', label: 'חדרי שינה', icon: <Bed size={18} />, min: 0, max: 20 },
    { key: 'beds', label: 'מיטות', icon: <Bed size={18} />, min: 1, max: 20 },
    { key: 'bathrooms', label: 'חדרי אמבטיה', icon: <Bath size={18} />, min: 1, max: 10 },
];

export const CreatePropertyDialog: React.FC<CreatePropertyDialogProps> = ({ open, onOpenChange, onSuccess }) => {
    const [step, setStep] = useState<Step>('details');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { values: formData, handleChange, resetForm } = useFormState(INITIAL_FORM);

    const [specs, setSpecs] = useState({ maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1 });
    const [amenities, setAmenities] = useState<string[]>([]);
    const [images, setImages] = useState<File[]>([]);

    useEffect(() => {
        if (open) {
            setStep('details');
            resetForm();
            setSpecs({ maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1 });
            setAmenities([]);
            setImages([]);
            setError(null);
        }
    }, [open]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        handleChange(e);
        setError(null);
    };

    const adjustSpec = (key: string, delta: number, min: number, max: number) => {
        setSpecs((s) => ({ ...s, [key]: Math.min(max, Math.max(min, s[key as keyof typeof s] + delta)) }));
    };

    const toggleAmenity = (key: string) => {
        setAmenities((prev) => prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]);
    };

    const validateStep1 = () => {
        if (!formData.title || !formData.description || !formData.price || !formData.city || !formData.street) {
            setError('נא למלא את כל השדות החובה');
            return false;
        }
        if (isNaN(Number(formData.price))) {
            setError('מחיר לא תקין');
            return false;
        }
        return true;
    };

    const handleNext = () => {
        setError(null);
        if (step === 'details') {
            if (validateStep1()) setStep('specs');
        } else if (step === 'specs') {
            setStep('photos');
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        setError(null);
        if (step === 'photos') setStep('specs');
        else if (step === 'specs') setStep('details');
    };

    const handleSubmit = async () => {
        if (images.length === 0) {
            setError('נא להעלות לפחות תמונה אחת');
            return;
        }
        setLoading(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('price', formData.price);
            data.append('location[city]', formData.city);
            data.append('location[street]', formData.street);
            data.append('maxGuests', String(specs.maxGuests));
            data.append('bedrooms', String(specs.bedrooms));
            data.append('beds', String(specs.beds));
            data.append('bathrooms', String(specs.bathrooms));
            amenities.forEach((a) => data.append('amenities', a));
            images.forEach((file) => data.append('images', file));

            await createProperty(data);
            resetForm();
            setImages([]);
            setStep('details');
            onOpenChange(false);
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error(err);
            setError('שגיאה ביצירת הנכס. נסה שוב.');
        } finally {
            setLoading(false);
        }
    };

    const stepIndex = STEPS.indexOf(step);
    const progress = ((stepIndex + 1) / STEPS.length) * 100;

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Content className="create-property-content" style={{ padding: 0, overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, fontSize: '16px' }}>פרסום נכס חדש</div>
                    <IconButton variant="ghost" size="small" onClick={() => onOpenChange(false)}>
                        <X size={18} />
                    </IconButton>
                </div>

                {/* Progress Bar */}
                <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                </div>

                {/* Body */}
                <div className="create-property-body">
                    {error && (
                        <div style={{ color: 'red', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    {/* ── Step 1: Details ── */}
                    {step === 'details' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <TextField
                                name="title"
                                label="כותרת הנכס"
                                placeholder="דירת 3 חדרים במרכז תל אביב"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '14px', fontWeight: 600 }}>תיאור</label>
                                <textarea
                                    name="description"
                                    className="minimal-input"
                                    rows={4}
                                    placeholder="תיאור קצר ומזמין על הנכס..."
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', fontFamily: 'inherit', resize: 'vertical' }}
                                />
                            </div>
                            <TextField
                                name="price"
                                label="מחיר ללילה (₪)"
                                type="number"
                                placeholder="0"
                                value={formData.price}
                                onChange={handleInputChange}
                                required
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <TextField
                                    name="city"
                                    label="עיר"
                                    placeholder="תל אביב"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    required
                                />
                                <TextField
                                    name="street"
                                    label="רחוב"
                                    placeholder="דיזנגוף 100"
                                    value={formData.street}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* ── Step 2: Specs & Amenities ── */}
                    {step === 'specs' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                            <div>
                                <div className="cpd-section-title">פרטי הנכס</div>
                                <div className="cpd-spec-list">
                                    {SPEC_FIELDS.map(({ key, label, icon, min, max }) => (
                                        <div key={key} className="cpd-spec-row">
                                            <div className="cpd-spec-label">
                                                {icon}
                                                <span>{label}</span>
                                            </div>
                                            <div className="cpd-counter">
                                                <button
                                                    className="cpd-counter-btn"
                                                    disabled={specs[key as keyof typeof specs] <= min}
                                                    onClick={() => adjustSpec(key, -1, min, max)}
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="cpd-counter-val">{specs[key as keyof typeof specs]}</span>
                                                <button
                                                    className="cpd-counter-btn"
                                                    disabled={specs[key as keyof typeof specs] >= max}
                                                    onClick={() => adjustSpec(key, 1, min, max)}
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="cpd-section-title">שירותים ומתקנים</div>
                                <div className="cpd-amenity-hint">בחר את כל מה שיש בנכס</div>
                                <div className="cpd-amenity-grid">
                                    {AMENITY_OPTIONS.map(({ key, label, icon }) => (
                                        <button
                                            key={key}
                                            className={`cpd-amenity-badge ${amenities.includes(key) ? 'selected' : ''}`}
                                            onClick={() => toggleAmenity(key)}
                                            type="button"
                                        >
                                            {icon}
                                            <span>{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 3: Photos ── */}
                    {step === 'photos' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>העלאת תמונות</div>
                            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                העלה לפחות תמונה אחת כדי להציג את הנכס בצורה הטובה ביותר.
                            </div>
                            <ImageUpload onImagesChange={setImages} maxFiles={5} />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {step !== 'details' ? (
                        <Button variant="primary" onClick={handleBack} disabled={loading}>חזרה</Button>
                    ) : (
                        <div />
                    )}
                    <Button onClick={handleNext} loading={loading}>
                        {step === 'photos' ? 'פרסם נכס' : 'המשך'}
                    </Button>
                </div>

            </Dialog.Content>
        </Dialog.Root>
    );
};

