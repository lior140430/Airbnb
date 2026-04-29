import { Header } from '@/components/layout/Header';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ChatProvider } from '@/context/ChatContext';
import { PropertyProvider, useProperty } from '@/context/PropertyContext';
import { AuthDialog } from '@/features/auth/AuthDialog';
import { ChatDrawer } from '@/features/chat/ChatDrawer';
import { HomeScreen } from '@/features/home/HomeScreen';
import { ProfileDialog } from '@/features/profile/ProfileDialog';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { ProfileScreen } from '@/features/profile/ProfileScreen';
import { getUser } from '@/features/profile/profile.service';
import { CreatePropertyDialog } from '@/features/properties/components/CreatePropertyDialog/CreatePropertyDialog';
import { PropertyPage } from '@/features/properties/components/PropertyPage/PropertyPage';
import { PropertyReviewsPage } from '@/features/properties/components/PropertyReviewsPage/PropertyReviewsPage';
import api from '@/services/api';
import '@/styles/theme.css';
import { useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes, useNavigate } from 'react-router-dom';

function OAuthCallback() {
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('accessToken');
        const userId = params.get('userId');

        if (accessToken && userId) {
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            localStorage.setItem('accessToken', accessToken);
            getUser(userId)
                .then((userData) => {
                    login(accessToken, userData);
                    const returnTo = localStorage.getItem('auth_return_to');
                    localStorage.removeItem('auth_return_to');
                    navigate(returnTo || '/', { replace: true });
                })
                .catch(() => {
                    navigate('/', { replace: true });
                });
        } else {
            navigate('/', { replace: true });
        }
    }, [login, navigate]);

    return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0', fontFamily: 'Assistant' }}>מתחבר...</div>;
}

function RootHandler() {
    const { login, isAuthenticated, loading, isAuthDialogOpen, openAuthDialog, closeAuthDialog } = useAuth();
    const { triggerRefresh, isHostDialogOpen, openHostDialog, closeHostDialog } = useProperty();
    const navigate = useNavigate();
    const [isCheckingParams, setIsCheckingParams] = useState(true);
    const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const params = new URLSearchParams(window.location.search);
            const accessToken = params.get('accessToken');
            const userId = params.get('userId');

            if (accessToken && userId) {
                try {
                    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                    const userData = await getUser(userId);
                    login(accessToken, userData);

                    const returnTo = localStorage.getItem('auth_return_to');
                    if (returnTo) {
                        localStorage.removeItem('auth_return_to');
                        navigate(returnTo, { replace: true });
                    } else {
                        window.history.replaceState({}, document.title, window.location.pathname);
                    }
                } catch (error) {
                    console.error('Error fetching user details:', error);
                }
            }
            setIsCheckingParams(false);
        };

        checkAuth();
    }, [login, navigate]);

    const handleProfileClick = () => {
        if (!isAuthenticated) {
            openAuthDialog();
        } else {
            setIsProfileDialogOpen(true);
        }
    };

    const handleHostClick = () => {
        if (!isAuthenticated) {
            openAuthDialog();
        } else {
            openHostDialog();
        }
    };

    const handlePropertyCreated = () => {
        triggerRefresh();
        closeHostDialog();
    };

    if (loading || isCheckingParams) return <div>טוען...</div>;

    return (
        <div className='app-container'>
            <Header
                onLoginClick={handleProfileClick}
                onProfileClick={handleProfileClick}
                onHostClick={handleHostClick}
            />

            <AuthDialog
                open={isAuthDialogOpen}
                onOpenChange={(open) => open ? openAuthDialog() : closeAuthDialog()}
            />

            <ProfileDialog
                open={isProfileDialogOpen}
                onOpenChange={setIsProfileDialogOpen}
            />

            <CreatePropertyDialog
                open={isHostDialogOpen}
                onOpenChange={(open) => open ? openHostDialog() : closeHostDialog()}
                onSuccess={handlePropertyCreated}
            />

            <ChatDrawer />

            <Routes>
                <Route path='/' element={<HomeScreen />} />
                <Route path='/property/:id' element={<PropertyPage />} />
                <Route path='/property/:id/reviews' element={<PropertyReviewsPage />} />
                <Route path='/profile' element={<ProfilePage />} />
                <Route path='/profile/:id' element={<ProfileScreen />} />
                <Route path='/auth/callback' element={<OAuthCallback />} />
                <Route path='*' element={<Navigate to='/' />} />
            </Routes>
        </div>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <ChatProvider>
                    <PropertyProvider>
                        <RootHandler />
                    </PropertyProvider>
                </ChatProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
