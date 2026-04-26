import { Button } from '@/components/ui/Button/Button';
import { Upload, X } from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';
import './ImageUpload.css';

interface ImageUploadProps {
    onImagesChange: (files: File[]) => void;
    maxFiles?: number;
    initialImages?: string[]; // Later for editing
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImagesChange, maxFiles = 5, initialImages = [] }) => {
    const [previewUrls, setPreviewUrls] = useState<string[]>(initialImages);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Limit check
        const availableSlots = maxFiles - selectedFiles.length;
        if (availableSlots <= 0) return;

        const filesToAdd = files.slice(0, availableSlots);
        const newUrls = filesToAdd.map(file => URL.createObjectURL(file));

        setPreviewUrls(prev => [...prev, ...newUrls]);

        const nextFiles = [...selectedFiles, ...filesToAdd];
        setSelectedFiles(nextFiles);
        onImagesChange(nextFiles);
    }, [maxFiles, selectedFiles, onImagesChange]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        if (files.length === 0) return;

        const availableSlots = maxFiles - selectedFiles.length;
        if (availableSlots <= 0) return;

        const filesToAdd = files.slice(0, availableSlots);
        const newUrls = filesToAdd.map(file => URL.createObjectURL(file));

        setPreviewUrls(prev => [...prev, ...newUrls]);

        const nextFiles = [...selectedFiles, ...filesToAdd];
        setSelectedFiles(nextFiles);
        onImagesChange(nextFiles);
    }, [maxFiles, selectedFiles, onImagesChange]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleRemove = (index: number) => {
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));

        const nextFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(nextFiles);
        onImagesChange(nextFiles);
    };

    const handleClick = () => {
        if (inputRef.current) {
            inputRef.current.value = ''; // Reset input so same file can be selected again
            inputRef.current.click();
        }
    };

    return (
        <div style={{ width: '100%' }}>
            <div
                className="image-upload-container"
                onClick={handleClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    ref={inputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                />
                <Upload size={48} className="image-upload-icon" strokeWidth={1} />
                <p style={{ fontWeight: 600, fontSize: '18px', marginBottom: '8px' }}>
                    גרור תמונות לכאן
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
                    או בחר מהמכשיר שלך
                </p>
                <Button variant="outline" type="button" onClick={(e) => { e.stopPropagation(); handleClick(); }}>
                    העלאת תמונות
                </Button>
            </div>

            {previewUrls.length > 0 && (
                <div className="image-preview-grid">
                    {previewUrls.map((url, index) => (
                        <div key={`${url}-${index}`} className="image-preview-item">
                            <img src={url} alt={`Preview ${index}`} className="image-preview-img" />
                            <div className="image-remove-btn" onClick={(e) => { e.stopPropagation(); handleRemove(index); }}>
                                <X size={12} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

