import axios from 'axios';
import { useAuthStore } from '../store/authStore';

import { Platform } from 'react-native';

// In development:
// - Web or iOS Simulator: localhost works
// - Android Emulator: 10.0.2.2 is required to reach the host machine
// - Physical device: You need your actual Wi-Fi IP address
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000/api';
  return 'http://localhost:3000/api';
};

export const API_URL = getBaseUrl();

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Optionally handle global 401s here (e.g., auto logout if token expired)
    if (error.response?.status === 401) {
      console.warn('Unauthorized request — token might be expired');
      // useAuthStore.getState().logout(); // uncomment if we want aggressive logout
    }
    return Promise.reject(error);
  }
);
