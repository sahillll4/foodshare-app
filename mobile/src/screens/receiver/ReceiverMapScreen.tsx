import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Filter } from 'lucide-react-native';
import { AppStackParamList } from '../../navigation/types';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../api';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

export interface Listing {
  id: string;
  title: string;
  foodType: 'veg' | 'non-veg' | 'both';
  quantityNum: number;
  quantityText: string;
  status: 'live' | 'claimed' | 'picked_up' | 'delivered' | 'cancelled';
  pickupStart: string;
  pickupEnd: string;
  photoUrl: string | null;
  latitude: number;
  longitude: number;
  addressText: string;
  requiresColdChain: boolean;
  donor: {
    id: string;
    name: string | null;
    ratingAvg: number;
  };
}

const FOOD_TYPE_COLORS = {
  veg: colors.success,
  'non-veg': '#DC2626',
  both: colors.primary,
};

export const ReceiverMapScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [region, setRegion] = useState({
    latitude: 18.5204,
    longitude: 73.8567,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const fetchNearbyFood = useCallback(async (lat: number, lng: number) => {
    try {
      setIsLoading(true);
      const response = await api.get(`/listings?lat=${lat}&lng=${lng}&radius=10000`);
      setListings(response.data.listings ?? []);
    } catch (error) {
      console.error('Failed to fetch nearby food:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNearbyFood(region.latitude, region.longitude);
  }, []);

  return (
    <View style={styles.container}>
      {/* Floating Search/Filter Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchText}>
            {isLoading ? 'Finding food nearby...' : `${listings.length} listings found`}
          </Text>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        onRegionChangeComplete={(newRegion) => {
          setRegion(newRegion);
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {listings.map((listing) => (
          <Marker
            key={listing.id}
            coordinate={{
              latitude: listing.latitude,
              longitude: listing.longitude,
            }}
            title={listing.title}
            description={`${listing.quantityNum} ${listing.quantityText} • ${listing.foodType.toUpperCase()}`}
            pinColor={FOOD_TYPE_COLORS[listing.foodType]}
            onCalloutPress={() => {
              navigation.navigate('ListingDetail', { listingId: listing.id });
            }}
          />
        ))}
      </MapView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  searchBarContainer: {
    position: 'absolute',
    top: 60,
    left: spacing.m,
    right: spacing.m,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 30,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  searchText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  filterButton: {
    padding: spacing.xs,
  },
  loadingOverlay: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    gap: spacing.s,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
