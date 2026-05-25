import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Filter, Search, MapPin, Bell } from 'lucide-react-native';
import { AppStackParamList } from '../../navigation/types';
import { colors, typography, spacing, radius, shadows, foodTypeConfig } from '../../theme';
import { api } from '../../api';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

export interface Listing {
  id: string;
  title: string;
  foodType: 'veg' | 'non_veg' | 'both';
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

export const ReceiverMapScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter States
  const [activeFilter, setActiveFilter] = useState<'all' | 'veg' | 'cold'>('all');

  // Default Pune
  const [region, setRegion] = useState({
    latitude: 18.5204,
    longitude: 73.8567,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  });

  const fetchNearbyFood = useCallback(async (lat: number, lng: number, filterMode: 'all' | 'veg' | 'cold') => {
    try {
      setIsLoading(true);
      let query = `/listings?lat=${lat}&lng=${lng}&radius=15000`;
      
      if (filterMode === 'veg') query += `&food_type=veg`;
      if (filterMode === 'cold') query += `&cold_chain=true`;

      const response = await api.get(query);
      setListings(response.data.listings ?? []);
    } catch (error) {
      console.error('Failed to fetch nearby food:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNearbyFood(region.latitude, region.longitude, activeFilter);
    }, [fetchNearbyFood, activeFilter]) // Refetch when filter changes
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Floating Search/Filter Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <Text style={styles.searchText}>
            {isLoading ? 'Finding food nearby...' : `${listings.length} places with food`}
          </Text>
          <View style={styles.divider} />
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.iconButton}>
            <Bell color={colors.primary} size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
            <Filter size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Quick Filters */}
        <View style={styles.quickFilters}>
          <TouchableOpacity 
            style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={activeFilter === 'all' ? styles.filterChipTextActive : styles.filterChipText}>All Food</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, activeFilter === 'veg' && styles.filterChipActive]}
            onPress={() => setActiveFilter('veg')}
          >
            <Text style={activeFilter === 'veg' ? styles.filterChipTextActive : styles.filterChipText}>Veg Only 🥗</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, activeFilter === 'cold' && styles.filterChipActive]}
            onPress={() => setActiveFilter('cold')}
          >
            <Text style={activeFilter === 'cold' ? styles.filterChipTextActive : styles.filterChipText}>Cold Chain ❄️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        onRegionChangeComplete={(newRegion) => {
          // In a real app we might want a "Search this area" button instead of auto-fetching
          setRegion(newRegion);
        }}
        showsUserLocation
        showsMyLocationButton={false} // We will add a custom one if needed
        mapPadding={{ top: 120, right: 0, bottom: 0, left: 0 }}
      >
        {listings.map((listing) => {
          const foodType = foodTypeConfig[listing.foodType] || foodTypeConfig.veg;
          return (
            <Marker
              key={listing.id}
              coordinate={{
                latitude: listing.latitude,
                longitude: listing.longitude,
              }}
              tracksViewChanges={false} // Performance optimization
            >
              <View style={[styles.markerContainer, { backgroundColor: foodType.color }]}>
                <Text style={styles.markerEmoji}>{foodType.emoji}</Text>
              </View>
              <View style={[styles.markerTriangle, { borderTopColor: foodType.color }]} />

              <Callout 
                tooltip
                onPress={() => navigation.navigate('ListingDetail', { listingId: listing.id })}
              >
                <View style={styles.calloutCard}>
                  <Text style={styles.calloutTitle} numberOfLines={1}>{listing.title}</Text>
                  <Text style={styles.calloutSub}>
                    {listing.quantityNum} {listing.quantityText} • {foodType.label}
                  </Text>
                  <Text style={styles.calloutAction}>Tap to claim →</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
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
    top: 50,
    left: spacing.m,
    right: spacing.m,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.l,
    paddingVertical: 14,
    alignItems: 'center',
    ...shadows.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchText: {
    ...typography.bodyMd,
    flex: 1,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  iconButton: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  filterButton: {
    padding: spacing.xs,
  },
  quickFilters: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.s,
  },
  filterChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: radius.full,
    ...shadows.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  
  // Custom Marker
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...shadows.sm,
  },
  markerEmoji: {
    fontSize: 16,
  },
  markerTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 0,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    alignSelf: 'center',
    marginTop: -1,
  },
  
  // Callout
  calloutCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.m,
    width: 200,
    ...shadows.md,
    marginBottom: spacing.xs,
  },
  calloutTitle: {
    ...typography.subhead,
    marginBottom: 4,
  },
  calloutSub: {
    ...typography.caption,
    marginBottom: spacing.s,
  },
  calloutAction: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: colors.primary,
  },

  // Loading
  loadingOverlay: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    ...shadows.md,
    gap: spacing.s,
  },
  loadingText: {
    ...typography.bodyMd,
    fontFamily: 'Inter_500Medium',
  },
});
