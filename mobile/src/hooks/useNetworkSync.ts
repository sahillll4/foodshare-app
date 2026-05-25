import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useOfflineStore } from '../store/offlineStore';
import { api } from '../api';
import { Alert } from 'react-native';

export function useNetworkSync() {
  const { pendingListings, removePendingListing } = useOfflineStore();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable && pendingListings.length > 0 && !isSyncing) {
        syncPendingListings();
      }
    });

    return () => unsubscribe();
  }, [pendingListings, isSyncing]);

  const syncPendingListings = async () => {
    if (pendingListings.length === 0) return;
    setIsSyncing(true);

    let syncedCount = 0;
    for (const listing of pendingListings) {
      try {
        await api.post('/listings', {
          title: listing.title,
          description: listing.description,
          foodType: listing.foodType,
          quantityNum: listing.quantityNum,
          quantityText: listing.quantityText,
          requiresColdChain: listing.requiresColdChain,
          latitude: listing.latitude,
          longitude: listing.longitude,
          addressText: listing.addressText,
          pickupEnd: listing.pickupEnd,
          photoBase64: listing.photoBase64,
        });
        
        // Remove from queue upon success
        removePendingListing(listing.id);
        syncedCount++;
      } catch (error) {
        console.error('Failed to sync offline listing:', error);
        // Will remain in queue to retry next time
      }
    }

    setIsSyncing(false);
    if (syncedCount > 0) {
      Alert.alert('Offline Posts Synced', `Successfully uploaded ${syncedCount} queued listing(s).`);
    }
  };

  return { isSyncing };
}
