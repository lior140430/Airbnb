import api from '@/services/api';

export const checkEmail = async (email: string) => {
    const response = await api.post('/auth/check-email', { email });
    return response.data;
};

export const login = async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
};

export const signup = async (userData: any) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
};

export const logout = async () => {
    return api.get('/auth/logout');
};