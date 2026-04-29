import axios, { type AxiosInstance } from 'axios';

export const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3000';
export const PROPERTY_API_URL = import.meta.env.VITE_PROPERTY_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: AUTH_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function addAuthInterceptors(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      // Never retry the refresh endpoint itself — that would create an infinite loop
      const isRefreshCall = originalRequest?.url?.includes('/auth/refresh');
      if (error.response?.status === 401 && !originalRequest._retry && !isRefreshCall) {
        originalRequest._retry = true;
        try {
          const { data } = await api.post('/auth/refresh');
          if (data.accessToken) {
            localStorage.setItem('accessToken', data.accessToken);
            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          }
          return instance(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );
}

addAuthInterceptors(api);

export default api;
