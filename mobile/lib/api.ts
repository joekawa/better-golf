import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, '');

const extractHost = (value?: string | null) => {
  if (!value) return null;
  return value.split(':')[0] || null;
};

const getExpoHost = () => {
  const expoConfigHost = extractHost(Constants.expoConfig?.hostUri);
  if (expoConfigHost) return expoConfigHost;

  const fallbackHost = extractHost((Constants as any)?.manifest?.debuggerHost);
  if (fallbackHost) return fallbackHost;

  const expoGoHost = extractHost((Constants as any)?.expoGoConfig?.debuggerHost);
  if (expoGoHost) return expoGoHost;

  return null;
};

const resolveApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return normalizeBaseUrl(process.env.EXPO_PUBLIC_API_URL);
  }

  const expoHost = getExpoHost();
  if (expoHost) {
    return `http://${expoHost}/api`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2/api';
  }

  return 'http://localhost/api';
};

export const API_BASE_URL = resolveApiBaseUrl();

console.log('[API] Using base URL:', API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      console.error('[API] Network error', {
        baseURL: API_BASE_URL,
        requestUrl: originalRequest?.url,
        message: error.message,
      });
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        await AsyncStorage.setItem('access_token', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('[API] Token refresh failed', refreshError);
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('refresh_token');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
