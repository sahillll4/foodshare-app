import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type UserRole = 'donor' | 'receiver' | 'courier';

export interface User {
  id: string;
  phone: string;
  name: string | null;
  primaryRole: UserRole;
  roles: UserRole[];
  verified: boolean;
  avatarUrl: string | null;
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

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,

  setAuth: async (token: string, user: User) => {
    try {
      await SecureStore.setItemAsync('jwt_token', token);
      await SecureStore.setItemAsync('user_data', JSON.stringify(user));
      set({ token, user });
    } catch (error) {
      console.error('Failed to securely store auth data', error);
    }
  },

  updateUser: async (updatedFields: Partial<User>) => {
    set((state) => {
      if (!state.user) return state;
      const newUser = { ...state.user, ...updatedFields };
      // Fire and forget secure store update
      SecureStore.setItemAsync('user_data', JSON.stringify(newUser)).catch(e => console.error(e));
      return { user: newUser };
    });
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync('jwt_token');
      await SecureStore.deleteItemAsync('user_data');
      set({ token: null, user: null });
    } catch (error) {
      console.error('Failed to remove auth data', error);
    }
  },

  loadStoredAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('jwt_token');
      const userDataStr = await SecureStore.getItemAsync('user_data');
      
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
