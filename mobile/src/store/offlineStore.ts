import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OfflineListing {
  id: string; // Temporary local ID
  title: string;
  description: string;
  foodType: string;
  quantityNum: number;
  quantityText: string;
  requiresColdChain: boolean;
  latitude: number;
  longitude: number;
  addressText: string;
  pickupEnd: string;
  photoBase64?: string; // We store base64 since local file URIs might expire
}

interface OfflineState {
  pendingListings: OfflineListing[];
  addPendingListing: (listing: OfflineListing) => void;
  removePendingListing: (id: string) => void;
  clearPendingListings: () => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set) => ({
      pendingListings: [],
      addPendingListing: (listing) =>
        set((state) => ({ pendingListings: [...state.pendingListings, listing] })),
      removePendingListing: (id) =>
        set((state) => ({
          pendingListings: state.pendingListings.filter((l) => l.id !== id),
        })),
      clearPendingListings: () => set({ pendingListings: [] }),
    }),
    {
      name: 'foodshare-offline-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
