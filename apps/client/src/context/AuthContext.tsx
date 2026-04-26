import api from '@/services/api';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
}

export type { User };

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (token: string, userData: User) => void;
    logout: () => void;
    loading: boolean;
    isAuthDialogOpen: boolean;
    openAuthDialog: () => void;
    closeAuthDialog: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

    useEffect(() => {
        const storedToken = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
        setLoading(false);
    }, []);

    const login = (newToken: string, userData: User) => {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('accessToken', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
    };

    const openAuthDialog = () => setIsAuthDialogOpen(true);
    const closeAuthDialog = () => setIsAuthDialogOpen(false);

    return (
        <AuthContext.Provider value={{
            user, token, isAuthenticated: !!user, login, logout, loading,
            isAuthDialogOpen, openAuthDialog, closeAuthDialog
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
