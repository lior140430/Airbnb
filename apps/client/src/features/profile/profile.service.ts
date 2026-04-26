import api from '@/services/api';

export const getUser = async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
};

export const updateUser = async (id: string, data: any) => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
};
