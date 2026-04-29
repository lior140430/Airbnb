import AirbnbLogo from '@/assets/logo.svg';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useChatContext } from '@/context/ChatContext';
import { useProperty } from '@/context/PropertyContext';
import { SearchBar, type SearchFilters } from '@/features/properties/components/search/SearchBar';
import { getUserInitial } from '@/utils/user';
import { MessageCircle, User } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
    onLoginClick?: () => void;
    onProfileClick?: () => void;
    onHostClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLoginClick, onProfileClick, onHostClick }) => {
    const { user, isAuthenticated } = useAuth();
    const { toggleChat, unreadCount } = useChatContext();
    const { setSearchFilters } = useProperty();
    const navigate = useNavigate();

    const handleSearch = (filters: SearchFilters) => {
        setSearchFilters(filters);
        navigate('/');
    };

    return (
        <header className='header-container'>
            {/* Right Side: Logo */}
            <a href='/' className='header-logo'>
                <img src={AirbnbLogo} alt="Airbnb" height="50" style={{ display: 'block' }} />
            </a>

            {/* Center: Search */}
            <div className='header-center'>
                <SearchBar onSearch={handleSearch} />
            </div>

            {/* Left Side: Host, Globe, Profile */}
            <div className='header-left-section' style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                <button
                    className='host-button'
                    onClick={onHostClick}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '10px 16px',
                        borderRadius: '22px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--text-main)',
                        transition: 'background-color 0.2s',
                        marginRight: '8px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f7f7f7'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    אני רוצה לארח
                </button>


                {isAuthenticated && (
                    <button
                        className='header-chat-btn'
                        onClick={toggleChat}
                        style={{
                            position: 'relative',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f7f7f7'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <MessageCircle size={20} />
                        {unreadCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: 2,
                                right: 2,
                                background: 'var(--brand-joy, #FF385C)',
                                color: '#fff',
                                fontSize: '10px',
                                fontWeight: 700,
                                borderRadius: '50%',
                                width: 16,
                                height: 16,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                )}

                <div className='header-profile-menu' onClick={isAuthenticated ? onProfileClick : onLoginClick} style={{ borderRadius: '50%', border: '1px solid var(--border-color)', width: 32, height: 32 }}>
                    {user ? (
                        <Avatar src={user.picture} fallback={getUserInitial(user)} size="small" />
                    ) : (
                        <User size={18} fill='currentColor' />
                    )}
                </div>
            </div>

        </header>
    );
};