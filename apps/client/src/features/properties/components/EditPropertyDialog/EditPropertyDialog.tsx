import { Button } from '@/components/ui/Button/Button';
import { Dialog } from '@/components/ui/Dialog/Dialog';
import { TextField } from '@/components/ui/TextField/TextField';
import { getImageUrl } from '@/utils/image';
import { Bath, Bed, Car, Dumbbell, Minus, PawPrint, Plus, Sofa, Thermometer, Trees, Users, Utensils, WashingMachine, Waves, Wifi, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { updateProperty, type Property } from '../../property.service';
import './EditPropertyDialog.css';

interface EditPropertyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    property: Property;
    onSuccess?: (updated: Property) => void;
}

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

export const EditPropertyDialog: React.FC<EditPropertyDialogProps> = ({
    open,
    onOpenChange,
    property,
    onSuccess,
}) => {
    const [title, setTitle] = useState(property.title);
    const [description, setDescription] = useState(property.description);
    const [price, setPrice] = useState(String(property.price));
    const [specs, setSpecs] = useState({
        maxGuests: property.maxGuests ?? 2,
        bedrooms: property.bedrooms ?? 1,
        beds: property.beds ?? 1,
        bathrooms: property.bathrooms ?? 1,
    });
    const [amenities, setAmenities] = useState<string[]>(property.amenities ?? []);
    const [newImages, setNewImages] = useState<File[]>([]);
    const [removedImages, setRemovedImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset form when property changes
    useEffect(() => {
        if (open) {
            setTitle(property.title);
            setDescription(property.description);
            setPrice(String(property.price));
            setSpecs({
                maxGuests: property.maxGuests ?? 2,
                bedrooms: property.bedrooms ?? 1,
                beds: property.beds ?? 1,
                bathrooms: property.bathrooms ?? 1,
            });
            setAmenities(property.amenities ?? []);
            setNewImages([]);
            setRemovedImages([]);
            setError(null);
        }
    }, [open, property]);

    const toggleAmenity = (key: string) => {
        setAmenities((prev) =>
            prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
        );
    };

    const adjustSpec = (key: string, delta: number) => {
        const field = SPEC_FIELDS.find((f) => f.key === key)!;
        setSpecs((prev) => {
            const next = (prev[key as keyof typeof prev] as number) + delta;
            return { ...prev, [key]: Math.max(field.min, Math.min(field.max, next)) };
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setNewImages((prev) => [...prev, ...Array.from(e.target.files!)]);
        }
        e.target.value = '';
    };

    const removeNewImage = (idx: number) => {
        setNewImages((prev) => prev.filter((_, i) => i !== idx));
    };

    const toggleRemoveExistingImage = (img: string) => {
        setRemovedImages((prev) =>
            prev.includes(img) ? prev.filter((r) => r !== img) : [...prev, img]
        );
    };

    const handleSubmit = async () => {
        setError(null);
        if (!title.trim()) { setError('נא להזין כותרת'); return; }
        if (!description.trim()) { setError('נא להזין תיאור'); return; }
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice <= 0) { setError('נא להזין מחיר תקין'); return; }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('description', description.trim());
            formData.append('price', String(parsedPrice));
            formData.append('maxGuests', String(specs.maxGuests));
            formData.append('bedrooms', String(specs.bedrooms));
            formData.append('beds', String(specs.beds));
            formData.append('bathrooms', String(specs.bathrooms));
            amenities.forEach((a) => formData.append('amenities', a));

            // Images to keep = existing minus removed
            const keptImages = property.images.filter((img) => !removedImages.includes(img));
            keptImages.forEach((img) => formData.append('keepImages', img));

            // New image files
            newImages.forEach((file) => formData.append('images', file));

            const updated = await updateProperty(property._id, formData);
            onSuccess?.(updated);
            onOpenChange(false);
        } catch (err: any) {
            setError(err?.response?.data?.message || 'עדכון הנכס נכשל');
        } finally {
            setLoading(false);
        }
    };

    const existingImages = property.images.filter((img) => !removedImages.includes(img));

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Content className="epd-dialog-content">
            <div className="epd-container">
                <div className="epd-header">
                    <h2 className="epd-title">עריכת נכס</h2>
                    <button className="epd-close-btn" onClick={() => onOpenChange(false)}>
                        <X size={20} />
                    </button>
                </div>

                <div className="epd-body">
                    {/* Title & Description */}
                    <section className="epd-section">
                        <h3 className="epd-section-title">פרטי הנכס</h3>
                        <TextField
                            label="כותרת"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="לדוגמה: דירת גן נעימה בתל אביב"
                        />
                        <TextField
                            label="תיאור"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="ספרו על הנכס..."
                            multiline
                            rows={4}
                        />
                        <TextField
                            label="מחיר ללילה (₪)"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            type="number"
                            placeholder="0"
                        />
                    </section>

                    {/* Specs */}
                    <section className="epd-section">
                        <h3 className="epd-section-title">פרטים נוספים</h3>
                        <div className="epd-specs-grid">
                            {SPEC_FIELDS.map((field) => (
                                <div key={field.key} className="epd-spec-row">
                                    <span className="epd-spec-icon">{field.icon}</span>
                                    <span className="epd-spec-label">{field.label}</span>
                                    <div className="epd-spec-controls">
                                        <button className="epd-spec-btn" onClick={() => adjustSpec(field.key, -1)}>
                                            <Minus size={14} />
                                        </button>
                                        <span className="epd-spec-value">{specs[field.key as keyof typeof specs]}</span>
                                        <button className="epd-spec-btn" onClick={() => adjustSpec(field.key, 1)}>
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Amenities */}
                    <section className="epd-section">
                        <h3 className="epd-section-title">שירותים</h3>
                        <div className="epd-amenities-grid">
                            {AMENITY_OPTIONS.map((opt) => (
                                <button
                                    key={opt.key}
                                    className={`epd-amenity-btn ${amenities.includes(opt.key) ? 'epd-amenity-btn--active' : ''}`}
                                    onClick={() => toggleAmenity(opt.key)}
                                    type="button"
                                >
                                    {opt.icon}
                                    <span>{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Images */}
                    <section className="epd-section">
                        <h3 className="epd-section-title">תמונות</h3>

                        {/* Existing images */}
                        {existingImages.length > 0 && (
                            <div className="epd-images-grid">
                                {existingImages.map((img) => (
                                    <div key={img} className="epd-image-item">
                                        <img src={getImageUrl(img)} alt="" className="epd-image-thumb" />
                                        <button
                                            className="epd-image-remove"
                                            onClick={() => toggleRemoveExistingImage(img)}
                                            title="הסר תמונה"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* New images preview */}
                        {newImages.length > 0 && (
                            <div className="epd-images-grid epd-images-new">
                                {newImages.map((file, idx) => (
                                    <div key={idx} className="epd-image-item">
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt=""
                                            className="epd-image-thumb"
                                        />
                                        <button
                                            className="epd-image-remove"
                                            onClick={() => removeNewImage(idx)}
                                            title="הסר תמונה"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            className="epd-add-image-btn"
                            onClick={() => fileInputRef.current?.click()}
                            type="button"
                        >
                            + הוסף תמונות
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                    </section>

                    {error && <p className="epd-error">{error}</p>}
                </div>

                <div className="epd-footer">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        ביטול
                    </Button>
                    <Button onClick={handleSubmit} loading={loading}>
                        שמור שינויים
                    </Button>
                </div>
            </div>
            </Dialog.Content>
        </Dialog.Root>
    );
};
