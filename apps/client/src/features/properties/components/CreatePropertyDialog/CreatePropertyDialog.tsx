import { Button } from '@/components/ui/Button/Button';
import { Dialog } from '@/components/ui/Dialog/Dialog';
import { IconButton } from '@/components/ui/IconButton/IconButton';
import { ImageUpload } from '@/components/ui/ImageUpload/ImageUpload';
import { TextField } from '@/components/ui/TextField/TextField';
import { useFormState } from '@/hooks/useFormState';
import { Bath, Bed, Car, Dumbbell, Minus, PawPrint, Plus, Sofa, Thermometer, Trees, Users, Utensils, WashingMachine, Waves, Wifi, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
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

interface NominatimResult {
    display_name: string;
    lat: string;
    lon: string;
    address: {
        city?: string;
        town?: string;
        village?: string;
        road?: string;
        house_number?: string;
    };
}

export const CreatePropertyDialog: React.FC<CreatePropertyDialogProps> = ({ open, onOpenChange, onSuccess }) => {
    const [step, setStep] = useState<Step>('details');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { values: formData, handleChange, resetForm } = useFormState(INITIAL_FORM);

    const [specs, setSpecs] = useState({ maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1 });
    const [amenities, setAmenities] = useState<string[]>([]);
    const [images, setImages] = useState<File[]>([]);

    // Address autocomplete state
    const [addressQuery, setAddressQuery] = useState('');
    const [addressSuggestions, setAddressSuggestions] = useState<NominatimResult[]>([]);
    const [addressLoading, setAddressLoading] = useState(false);
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
    const addressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (open) {
            setStep('details');
            resetForm();
            setSpecs({ maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1 });
            setAmenities([]);
            setImages([]);
            setError(null);
            setAddressQuery('');
            setAddressSuggestions([]);
            setCoordinates(null);
        }
    }, [open]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        handleChange(e);
        setError(null);
    };

    const handleAddressInput = (value: string) => {
        setAddressQuery(value);
        setCoordinates(null);
        handleChange({ target: { name: 'city', value: '' } } as React.ChangeEvent<HTMLInputElement>);
        handleChange({ target: { name: 'street', value: '' } } as React.ChangeEvent<HTMLInputElement>);
        if (addressTimeoutRef.current) clearTimeout(addressTimeoutRef.current);
        if (value.length < 3) {
            setAddressSuggestions([]);
            return;
        }
        addressTimeoutRef.current = setTimeout(async () => {
            setAddressLoading(true);
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&addressdetails=1&limit=5&countrycodes=il`,
                    { headers: { 'Accept-Language': 'he' } }
                );
                const data: NominatimResult[] = await res.json();
                setAddressSuggestions(data);
            } catch {
                // silently fail — user can try again
            } finally {
                setAddressLoading(false);
            }
        }, 400);
    };

    const handleAddressSelect = (result: NominatimResult) => {
        const city = result.address.city || result.address.town || result.address.village || '';
        const road = result.address.road || '';
        const houseNum = result.address.house_number || '';
        const street = houseNum ? `${road} ${houseNum}`.trim() : road;
        handleChange({ target: { name: 'city', value: city } } as React.ChangeEvent<HTMLInputElement>);
        handleChange({ target: { name: 'street', value: street } } as React.ChangeEvent<HTMLInputElement>);
        setCoordinates({ lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
        setAddressQuery(result.display_name);
        setAddressSuggestions([]);
        setError(null);
    };

    const adjustSpec = (key: string, delta: number, min: number, max: number) => {
        setSpecs((s) => ({ ...s, [key]: Math.min(max, Math.max(min, s[key as keyof typeof s] + delta)) }));
    };

    const toggleAmenity = (key: string) => {
        setAmenities((prev) => prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]);
    };

    const validateStep1 = () => {
        if (!formData.title || !formData.description || !formData.price) {
            setError('נא למלא את כל השדות החובה');
            return false;
        }
        if (isNaN(Number(formData.price))) {
            setError('מחיר לא תקין');
            return false;
        }
        if (!coordinates) {
            setError('יש לבחור כתובת מהרשימה כדי לאמת את המיקום');
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
            if (coordinates) {
                data.append('coordinates[lat]', String(coordinates.lat));
                data.append('coordinates[lng]', String(coordinates.lng));
            }

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

                            {/* Address autocomplete */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                                <label style={{ fontSize: '14px', fontWeight: 600 }}>כתובת</label>
                                <TextField
                                    name="addressQuery"
                                    placeholder="חפש כתובת — לדוגמה: דיזנגוף 100 תל אביב"
                                    value={addressQuery}
                                    onChange={(e) => handleAddressInput(e.target.value)}
                                />
                                {addressLoading && (
                                    <small style={{ color: 'var(--text-muted)', fontSize: '12px' }}>מחפש...</small>
                                )}
                                {coordinates && (
                                    <small style={{ color: 'green', fontSize: '12px' }}>✓ כתובת אומתה</small>
                                )}
                                {addressSuggestions.length > 0 && (
                                    <ul className="address-suggestions">
                                        {addressSuggestions.map((s, i) => (
                                            <li key={i} onClick={() => handleAddressSelect(s)}>
                                                {s.display_name}
                                            </li>
                                        ))}
                                    </ul>
                                )}
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
                <div className="create-property-footer">
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
