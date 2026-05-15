import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Filter, MapPin } from 'lucide-react-native';
import { ReceiverTabParamList } from '../../navigation/types';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../api';
import { Listing } from '../donor/DonorHomeScreen'; // sharing type for now

type NavigationProp = NativeStackNavigationProp<ReceiverTabParamList, 'ReceiverMap'>;

export const ReceiverMapScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Default to Pune for MVP
  const [region, setRegion] = useState({
    latitude: 18.5204,
    longitude: 73.8567,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const fetchNearbyFood = async (lat: number, lng: number) => {
    try {
      setIsLoading(true);
      // Hardcoding radius 10000 meters (10km) for now
      const response = await api.get(`/listings?lat=${lat}&lng=${lng}&radius=10000`);
      setListings(response.data.listings);
    } catch (error) {
      console.error('Failed to fetch nearby food:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbyFood(region.latitude, region.longitude);
  }, []);

  // Web fallback UI because react-native-maps requires a Google Maps API key on the web
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webFallbackContainer}>
        <MapPin size={48} color={colors.primary} />
        <Text style={styles.webFallbackTitle}>Map View (Mobile Only)</Text>
        <Text style={styles.webFallbackText}>
          The interactive map requires native iOS/Android to render properly without a Google Maps Web API key.
        </Text>
        <Text style={styles.webFallbackSubtitle}>
          Nearby Food (List View Fallback):
        </Text>
        <View style={styles.webList}>
          {listings.map(item => (
            <View key={item.id} style={styles.webListItem}>
              <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
              <Text>{item.quantityText} • {item.foodType.toUpperCase()}</Text>
            </View>
          ))}
          {listings.length === 0 && !isLoading && (
            <Text style={{ color: colors.textSecondary }}>No food nearby</Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search / Filter Bar Overlay */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchText}>Searching nearby...</Text>
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
          // In a real app, debounce this fetch
          fetchNearbyFood(newRegion.latitude, newRegion.longitude);
        }}
        showsUserLocation
      >
        {listings.map((listing) => (
          <Marker
            key={listing.id}
            // Mocking coordinates based on Pune center for now since we haven't exposed lat/lng in the API type yet
            // In a real scenario, listing would have .latitude and .longitude
            coordinate={{ 
              latitude: 18.5204 + (Math.random() - 0.5) * 0.02, 
              longitude: 73.8567 + (Math.random() - 0.5) * 0.02 
            }}
            title={listing.title}
            description={`${listing.quantityText} • ${listing.foodType}`}
            pinColor={listing.foodType === 'veg' ? colors.success : colors.error}
            onCalloutPress={() => {
              // Navigate to listing detail
              console.log('Claim food:', listing.id);
            }}
          />
        ))}
      </MapView>

      {/* Recenter / Load indicator */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
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
    top: 60, // Safe area approx
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
    shadowOpacity: 0.1,
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
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  // Web Fallback Styles
  webFallbackContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  webFallbackTitle: {
    ...typography.heading,
    marginTop: spacing.m,
    textAlign: 'center',
  },
  webFallbackText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.m,
    marginBottom: spacing.xxl,
  },
  webFallbackSubtitle: {
    ...typography.subhead,
    alignSelf: 'flex-start',
    marginBottom: spacing.m,
  },
  webList: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  webListItem: {
    paddingVertical: spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
