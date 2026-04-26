import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { TextField } from '@/components/ui/TextField/TextField';
import { useAuth } from '@/context/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { useFormState } from '@/hooks/useFormState';
import { PropertyCard } from '@/features/properties/components/PropertyCard/PropertyCard';
import { getUserProperties, type Property } from '@/features/properties/property.service';
import { getImageUrl } from '@/utils/image';
import { getUserInitial } from '@/utils/user';
import { useChatContext } from '@/context/ChatContext';
import { Edit2, MessageCircle, Save, X } from 'lucide-react';
import React, { useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getUser, updateUser } from './profile.service';
import './ProfileScreen.css';

interface UserProfile {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    picture?: string;
}

export const ProfileScreen: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user: currentUser, login } = useAuth();
    const { openChatWithUser } = useChatContext();
    const [isEditing, setIsEditing] = React.useState(false);

    const isOwnProfile = currentUser && (id === currentUser._id || !id);
    const profileId = id || currentUser?._id;

    const fetchProfile = useCallback(() => {
        if (!profileId) return Promise.reject('No profile ID');
        return getUser(profileId) as Promise<UserProfile>;
    }, [profileId]);

    const fetchProperties = useCallback(() => {
        if (!profileId) return Promise.reject('No profile ID');
        return getUserProperties(profileId);
    }, [profileId]);

    const { data: profile, loading, execute, setData } = useAsync<UserProfile>(fetchProfile);
    const { data: properties, loading: loadingProperties, execute: executeProperties } = useAsync<Property[]>(fetchProperties);

    const { values: editForm, handleChange, setValues: setEditForm } = useFormState({
        firstName: '',
        lastName: '',
        picture: '',
    });

    useEffect(() => {
        if (profileId) {
            execute();
            executeProperties();
        }
    }, [profileId, execute, executeProperties]);

    useEffect(() => {
        if (profile) {
            setEditForm({
                firstName: profile.firstName,
                lastName: profile.lastName,
                picture: profile.picture || '',
            });
        }
    }, [profile, setEditForm]);

    const handleSave = async () => {
        if (!profile) return;
        try {
            const updated = await updateUser(profile._id, editForm);
            setData({ ...profile, ...updated });
            setIsEditing(false);
            if (currentUser && currentUser._id === profile._id) {
                const token = localStorage.getItem('accessToken');
                if (token) login(token, updated);
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
        }
    };

    if (loading || !profile) {
        return <Spinner size={32} message="טוען..." fullPage />;
    }

    const initial = getUserInitial(profile);

    return (
        <div className="profile-screen-container">
            <div className="profile-card">
                <div className="profile-header-section">
                    <div className="profile-avatar-container">
                        <Avatar
                            src={isEditing ? editForm.picture : getImageUrl(profile.picture)}
                            fallback={initial}
                            size="xlarge"
                            className="profile-avatar"
                        />
                        {isEditing && (
                            <div className="avatar-edit-overlay">
                                <TextField
                                    name="picture"
                                    placeholder="קישור לתמונה"
                                    value={editForm.picture}
                                    onChange={handleChange}
                                />
                            </div>
                        )}
                    </div>

                    <div className="profile-info-section">
                        {!isEditing ? (
                            <>
                                <h1>{profile.firstName} {profile.lastName}</h1>
                                <p className="profile-email">{profile.email}</p>
                            </>
                        ) : (
                            <div className="edit-form">
                                <TextField
                                    name="firstName"
                                    placeholder="שם פרטי"
                                    value={editForm.firstName}
                                    onChange={handleChange}
                                />
                                <TextField
                                    name="lastName"
                                    placeholder="שם משפחה"
                                    value={editForm.lastName}
                                    onChange={handleChange}
                                />
                            </div>
                        )}
                    </div>

                    {isOwnProfile && (
                        <div className="profile-actions-top">
                            {!isEditing ? (
                                <button className="icon-action-btn" onClick={() => setIsEditing(true)}>
                                    <Edit2 size={20} />
                                </button>
                            ) : (
                                <div className="edit-actions">
                                    <button className="icon-action-btn save" onClick={handleSave}>
                                        <Save size={20} />
                                    </button>
                                    <button className="icon-action-btn cancel" onClick={() => setIsEditing(false)}>
                                        <X size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {!isOwnProfile && profileId && (
                <div className="profile-message-section">
                    <button
                        className="profile-send-message-btn"
                        onClick={() => {
                            openChatWithUser(profileId);
                        }}
                    >
                        <MessageCircle size={18} />
                        שלח הודעה
                    </button>
                </div>
            )}

            <div className="profile-posts-section">
                <h2>{isOwnProfile ? 'הנכסים שלי' : `הנכסים של ${profile.firstName}`}</h2>
                {loadingProperties ? (
                    <Spinner size={24} message="טוען נכסים..." />
                ) : (
                    <div className="posts-grid">
                        {properties && properties.length > 0 ? (
                            properties.map((property) => (
                                <PropertyCard key={property._id} property={property} />
                            ))
                        ) : (
                            <p className="profile-no-properties">אין נכסים להצגה</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
