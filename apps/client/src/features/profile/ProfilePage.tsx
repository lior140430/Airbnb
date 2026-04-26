import { Avatar } from '@/components/ui/Avatar/Avatar';
import { AvatarUpload } from '@/components/ui/AvatarUpload/AvatarUpload';
import { Button } from '@/components/ui/Button/Button';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { TextField } from '@/components/ui/TextField/TextField';
import { useAuth } from '@/context/AuthContext';
import { PropertyCard } from '@/features/properties/components/PropertyCard/PropertyCard';
import { getMyProperties, type Property } from '@/features/properties/property.service';
import api from '@/services/api';
import { getUserDisplayName, getUserInitial } from '@/utils/user';
import { Building2, CheckCircle, Home, MessageSquareText, Pencil, Save, Star, User, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type Tab = 'profile' | 'properties' | 'reviews';

export const ProfilePage: React.FC = () => {
    const { user, login, token } = useAuth();
    const navigate = useNavigate();

    // Active tab
    const [activeTab, setActiveTab] = useState<Tab>('profile');

    // Edit mode
    const [isEditing, setIsEditing] = useState(false);

    // Form state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [saveError, setSaveError] = useState('');

    // Listings state
    const [properties, setProperties] = useState<Property[]>([]);
    const [isLoadingListings, setIsLoadingListings] = useState(true);

    // Sync form when user changes
    useEffect(() => {
        if (user) {
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
        }
    }, [user]);

    // Fetch user listings
    const loadListings = useCallback(async () => {
        setIsLoadingListings(true);
        try {
            const data = await getMyProperties(1, 100);
            setProperties(data);
        } catch (err) {
            console.error('Failed to load listings', err);
        } finally {
            setIsLoadingListings(false);
        }
    }, []);

    useEffect(() => {
        if (user) loadListings();
    }, [user, loadListings]);

    // Save profile
    const handleSave = async () => {
        if (!user || !token) return;

        setSaveStatus('saving');
        setSaveError('');

        try {
            let response;

            if (avatarFile) {
                const formData = new FormData();
                if (firstName !== user.firstName) formData.append('firstName', firstName);
                if (lastName !== user.lastName) formData.append('lastName', lastName);
                formData.append('picture', avatarFile);
                response = await api.patch('/auth/profile', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                const updatePayload: Record<string, string> = {};
                if (firstName !== user.firstName) updatePayload.firstName = firstName;
                if (lastName !== user.lastName) updatePayload.lastName = lastName;
                response = await api.patch('/auth/profile', updatePayload);
            }
            const updatedUser = response.data;

            login(token, {
                _id: updatedUser._id,
                email: updatedUser.email,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                picture: updatedUser.picture,
            });

            setAvatarFile(null);
            setSaveStatus('saved');
            setIsEditing(false);
            setTimeout(() => setSaveStatus('idle'), 2500);
        } catch (err: any) {
            console.error('Error updating profile', err);
            setSaveError(err?.response?.data?.message || 'שמירת השינויים נכשלה.');
            setSaveStatus('error');
        }
    };

    const handleCancelEdit = () => {
        if (user) {
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
        }
        setAvatarFile(null);
        setIsEditing(false);
        setSaveError('');
        setSaveStatus('idle');
    };

    // Guard — must be logged in
    if (!user) {
        return (
            <div className="pp-auth-wall">
                <h2>יש להתחבר כדי לצפות בפרופיל</h2>
            </div>
        );
    }

    const displayName = getUserDisplayName(user);
    const initial = getUserInitial(user);

    // Collect reviews the user left (from their own properties' comments with matching username)
    // For now we'll show a placeholder — in production we'd have a dedicated endpoint
    const userReviews: { propertyTitle: string; text: string; rating: number; date: string }[] = [];

    return (
        <div className="pp">
            {/* ══════════ Right sidebar nav (RTL) ══════════ */}
            <aside className="pp-sidebar">
                <h1 className="pp-sidebar-title">פרופיל</h1>

                <nav className="pp-nav">
                    <button
                        className={`pp-nav-item ${activeTab === 'profile' ? 'pp-nav-item--active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <User size={20} />
                        <span>כמה מילים עליי</span>
                    </button>
                    <button
                        className={`pp-nav-item ${activeTab === 'properties' ? 'pp-nav-item--active' : ''}`}
                        onClick={() => setActiveTab('properties')}
                    >
                        <Building2 size={20} />
                        <span>הנכסים שלי</span>
                    </button>
                    <button
                        className={`pp-nav-item ${activeTab === 'reviews' ? 'pp-nav-item--active' : ''}`}
                        onClick={() => setActiveTab('reviews')}
                    >
                        <MessageSquareText size={20} />
                        <span>הביקורות שלי</span>
                    </button>
                </nav>
            </aside>

            {/* ══════════ Main content ══════════ */}
            <main className="pp-main">
                {/* ───── Profile Tab ───── */}
                {activeTab === 'profile' && (
                    <div className="pp-profile">
                        {/* Section header */}
                        <div className="pp-section-header">
                            <h2 className="pp-section-title">כמה מילים עליי</h2>
                            {!isEditing && (
                                <button className="pp-edit-btn" onClick={() => setIsEditing(true)}>
                                    עריכה
                                </button>
                            )}
                        </div>

                        {/* Profile hero card */}
                        <div className="pp-hero-card">
                            <div className="pp-hero-avatar">
                                {isEditing ? (
                                    <AvatarUpload
                                        src={user.picture}
                                        alt={displayName}
                                        size={120}
                                        onFileSelect={setAvatarFile}
                                    />
                                ) : (
                                    <Avatar
                                        src={user.picture}
                                        fallback={initial}
                                        size="xlarge"
                                    />
                                )}
                                {avatarFile && isEditing && (
                                    <span className="pp-avatar-badge">תמונה חדשה</span>
                                )}
                            </div>
                            <h3 className="pp-hero-name">{displayName}</h3>
                            <p className="pp-hero-role">אורח/ת</p>
                        </div>

                        {/* Edit form (expanded when editing) */}
                        {isEditing ? (
                            <div className="pp-edit-form">
                                <div className="pp-edit-form-fields">
                                    <TextField
                                        label="שם פרטי"
                                        value={firstName}
                                        onChange={(e) => { setFirstName(e.target.value); setSaveStatus('idle'); }}
                                        placeholder="לדוגמה: ליאור"
                                    />
                                    <TextField
                                        label="שם משפחה"
                                        value={lastName}
                                        onChange={(e) => { setLastName(e.target.value); setSaveStatus('idle'); }}
                                        placeholder="לדוגמה: כהן"
                                    />
                                    <TextField
                                        label="אימייל"
                                        value={user.email}
                                        disabled
                                    />
                                </div>

                                {saveError && <p className="pp-form-error">{saveError}</p>}

                                <div className="pp-edit-actions">
                                    <Button onClick={handleSave} loading={saveStatus === 'saving'}>
                                        <Save size={16} /> שמור שינויים
                                    </Button>
                                    <Button variant="outline" onClick={handleCancelEdit}>
                                        <X size={16} /> ביטול
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            /* Profile completion prompt */
                            <div className="pp-complete-card">
                                <h4 className="pp-complete-title">כדאי להשלים את מילוי הפרופיל שלכם</h4>
                                <p className="pp-complete-desc">
                                    הפרופיל מהווה חלק חשוב בכל הזמנה. כדאי ליצור פרופיל כדי לאפשר למארחים ולאורחים אחרים להכיר אתכם.
                                </p>
                                <Button onClick={() => setIsEditing(true)}>
                                    <Pencil size={14} /> קדימה, מתחילים
                                </Button>
                            </div>
                        )}

                        {saveStatus === 'saved' && !isEditing && (
                            <div className="pp-saved-toast">
                                <CheckCircle size={18} /> הפרופיל עודכן בהצלחה
                            </div>
                        )}

                    </div>
                )}

                {/* ───── Properties Tab ───── */}
                {activeTab === 'properties' && (
                    <div className="pp-properties">
                        <div className="pp-section-header">
                            <h2 className="pp-section-title">הנכסים שלי</h2>
                            <span className="pp-section-count">
                                {!isLoadingListings && `${properties.length} נכסים`}
                            </span>
                        </div>

                        {isLoadingListings ? (
                            <Spinner size={32} message="טוען את הנכסים שלך…" fullPage />
                        ) : properties.length > 0 ? (
                            <div className="pp-properties-grid">
                                {properties.map((prop) => (
                                    <PropertyCard key={prop._id} property={prop} />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={<Home size={56} strokeWidth={1} />}
                                title="עדיין אין נכסים"
                                description={<>שתפו את המקום שלכם עם מטיילים מרחבי העולם.<br />הנכסים שלכם יופיעו כאן.</>}
                                actionLabel="פרסמו את הנכס הראשון"
                                onAction={() => navigate('/')}
                            />
                        )}
                    </div>
                )}

                {/* ───── Reviews Tab ───── */}
                {activeTab === 'reviews' && (
                    <div className="pp-reviews">
                        <div className="pp-section-header">
                            <h2 className="pp-section-title">ביקורות שכתבתי</h2>
                        </div>

                        {userReviews.length > 0 ? (
                            <div className="pp-review-list">
                                {userReviews.map((review, i) => (
                                    <div key={i} className="pp-review-item">
                                        <div className="pp-review-item-top">
                                            <strong>{review.propertyTitle}</strong>
                                            <span className="pp-review-date">{review.date}</span>
                                        </div>
                                        <div className="pp-review-stars">
                                            {Array.from({ length: 5 }).map((_, s) => (
                                                <Star key={s} size={14} fill={s < review.rating ? '#222' : 'none'} color="#222" />
                                            ))}
                                        </div>
                                        <p className="pp-review-text">{review.text}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={<MessageSquareText size={56} strokeWidth={1} />}
                                title="עוד לא כתבתם ביקורות"
                                description="הביקורות שתכתבו על נכסים ששהיתם בהם יופיעו כאן."
                            />
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};
