import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/lib/store/auth.store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      const refreshToken = useAuthStore.getState().refreshToken;
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { token } = response.data.data;
          useAuthStore.getState().setToken(token);
          
          // Retry original request
          if (error.config) {
            error.config.headers.Authorization = `Bearer ${token}`;
            return axios(error.config);
          }
        } catch (refreshError) {
          // Refresh failed, logout
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      } else {
        // No refresh token, logout
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);