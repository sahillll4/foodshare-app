import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Clock, MapPin, Package, ChevronRight } from 'lucide-react-native';
import { DonorTabParamList } from '../../navigation/types';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../api';
import { useAuthStore } from '../../store/authStore';

// Normally this would be shared, but defining locally for now
export interface Listing {
  id: string;
  title: string;
  foodType: 'veg' | 'non-veg' | 'both';
  quantityText: string;
  status: 'live' | 'claimed' | 'picked_up' | 'delivered' | 'cancelled';
  pickupEnd: string;
  photoUrl: string | null;
  createdAt: string;
}

type NavigationProp = NativeStackNavigationProp<DonorTabParamList, 'DonorHome'>;

export const DonorHomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchListings = async () => {
    try {
      const response = await api.get('/listings/my');
      setListings(response.data.listings);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchListings();
  };

  const handleLogout = async () => {
    await useAuthStore.getState().logout();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return colors.success;
      case 'claimed': return colors.accent;
      case 'picked_up': return colors.primary;
      case 'delivered': return colors.textSecondary;
      case 'cancelled': return colors.error;
      default: return colors.border;
    }
  };

  const renderItem = ({ item }: { item: Listing }) => {
    const isExpired = new Date(item.pickupEnd) < new Date() && item.status === 'live';
    const displayStatus = isExpired ? 'expired' : item.status;

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => console.log('Navigate to detail:', item.id)}
      >
        {item.photoUrl ? (
          <Image source={{ uri: item.photoUrl }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.placeholderImage]}>
            <Package color={colors.textSecondary} size={32} />
          </View>
        )}
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(displayStatus) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(displayStatus) }]}>
                {displayStatus.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.cardRow}>
            <Package size={16} color={colors.textSecondary} style={styles.icon} />
            <Text style={styles.cardSubtitle}>{item.quantityText} • {item.foodType.toUpperCase()}</Text>
          </View>

          <View style={styles.cardRow}>
            <Clock size={16} color={isExpired ? colors.error : colors.textSecondary} style={styles.icon} />
            <Text style={[styles.cardSubtitle, isExpired && { color: colors.error }]}>
              {new Date(item.pickupEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        <View style={styles.chevron}>
          <ChevronRight color={colors.textSecondary} size={20} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>My Donations</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Thank you for sharing food today!</Text>
      </View>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Package size={64} color={colors.border} />
              <Text style={styles.emptyTitle}>No active listings</Text>
              <Text style={styles.emptySubtitle}>You haven't posted any food yet.</Text>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => navigation.navigate('PostListing')}
              >
                <Text style={styles.primaryButtonText}>Post Food Now</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.l,
    paddingTop: spacing.xxl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.s,
    backgroundColor: colors.error + '10',
    borderRadius: 8,
  },
  logoutText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '700',
  },
  headerTitle: {
    ...typography.heading,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  listContainer: {
    padding: spacing.m,
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardImage: {
    width: 80,
    height: 100,
    backgroundColor: colors.border,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  cardContent: {
    flex: 1,
    padding: spacing.m,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  cardTitle: {
    ...typography.subhead,
    flex: 1,
    marginRight: spacing.s,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  icon: {
    marginRight: spacing.xs,
  },
  cardSubtitle: {
    ...typography.caption,
  },
  chevron: {
    padding: spacing.m,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyTitle: {
    ...typography.subhead,
    marginTop: spacing.m,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
  },
  primaryButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});
