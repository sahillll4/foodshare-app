import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type UserRole = 'donor' | 'receiver' | 'courier';

export interface User {
  id: string;
  phone: string;
  name: string | null;
  primaryRole: UserRole;
  roles: UserRole[];
  verified: boolean;
  avatarUrl: string | null;
  impactPoints?: number;
  impactMeals?: number;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  setAuth: (token: string, user: User) => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

// Fallback to AsyncStorage on Web since SecureStore throws an error
const setStorageItem = async (key: string, value: string) => {
  if (Platform.OS === 'web') return AsyncStorage.setItem(key, value);
  return SecureStore.setItemAsync(key, value);
};

const getStorageItem = async (key: string) => {
  if (Platform.OS === 'web') return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
};

const deleteStorageItem = async (key: string) => {
  if (Platform.OS === 'web') return AsyncStorage.removeItem(key);
  return SecureStore.deleteItemAsync(key);
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,

  setAuth: async (token: string, user: User) => {
    // ALWAYS update state immediately so the UI reacts, even if storage fails
    set({ token, user });
    try {
      await setStorageItem('jwt_token', token);
      await setStorageItem('user_data', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to securely store auth data', error);
    }
  },

  updateUser: async (updatedFields: Partial<User>) => {
    set((state) => {
      if (!state.user) return state;
      const newUser = { ...state.user, ...updatedFields };
      setStorageItem('user_data', JSON.stringify(newUser)).catch(e => console.error(e));
      return { user: newUser };
    });
  },

  logout: async () => {
    set({ token: null, user: null });
    try {
      await deleteStorageItem('jwt_token');
      await deleteStorageItem('user_data');
    } catch (error) {
      console.error('Failed to remove auth data', error);
    }
  },

  loadStoredAuth: async () => {
    try {
      const token = await getStorageItem('jwt_token');
      const userDataStr = await getStorageItem('user_data');
      
      if (token && userDataStr) {
        set({ token, user: JSON.parse(userDataStr), isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load stored auth data', error);
      set({ isLoading: false });
    }
  },
}));
