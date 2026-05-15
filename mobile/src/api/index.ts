import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// In development, you might want to switch this based on emulator/device
// 10.0.2.2 is the special IP alias to your host loopback interface for Android Emulator
// For iOS Simulator, localhost works.
// For physical devices, you need your computer's local IP address.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api';

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
