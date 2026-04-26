import { Camera } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import './AvatarUpload.css';

interface AvatarUploadProps {
    src?: string;
    alt?: string;
    size?: number;
    onFileSelect: (file: File) => void;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
    src,
    alt = 'Avatar',
    size = 150,
    onFileSelect,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    // Revoke previous blob URL to avoid memory leaks
    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const handleContainerClick = () => {
        fileInputRef.current?.click();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (preview) URL.revokeObjectURL(preview);
            setPreview(URL.createObjectURL(file));
            onFileSelect(file);
        }
    };

    const displaySrc = preview || src;
    const initials = alt.charAt(0).toUpperCase();

    return (
        <div
            className="avatar-upload-container"
            style={{ width: size, height: size }}
            onClick={handleContainerClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label="שינוי תמונת פרופיל"
        >
            {displaySrc ? (
                <img src={displaySrc} alt={alt} className="avatar-image" />
            ) : (
                <div className="avatar-placeholder">
                    <span className="avatar-initials">{initials}</span>
                </div>
            )}
            <div className="avatar-overlay">
                <Camera size={22} strokeWidth={2.5} />
                <span className="avatar-edit-text">עריכה</span>
            </div>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
            />
        </div>
    );
};
