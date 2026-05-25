import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, StatusBar } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, MapPin, Package, ChevronRight, Plus, LogOut } from 'lucide-react-native';
import { DonorTabParamList } from '../../navigation/types';
import { colors, typography, spacing, gradients, radius, shadows, foodTypeConfig, statusConfig } from '../../theme';
import { api } from '../../api';
import { useAuthStore } from '../../store/authStore';

export interface Listing {
  id: string;
  title: string;
  foodType: 'veg' | 'non_veg' | 'both';
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
  const user = useAuthStore(state => state.user);

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

  const renderItem = ({ item }: { item: Listing }) => {
    const isExpired = new Date(item.pickupEnd) < new Date() && item.status === 'live';
    const displayStatus = isExpired ? 'expired' : item.status;
    const statConfig = statusConfig[displayStatus] || statusConfig.live;
    const typeConfig = foodTypeConfig[item.foodType] || foodTypeConfig.veg;

    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => console.log('Navigate to detail:', item.id)} // Replace with navigation later
      >
        {/* Left Color Indicator based on Food Type */}
        <View style={[styles.cardColorStrip, { backgroundColor: typeConfig.color }]} />

        {item.photoUrl ? (
          <Image source={{ uri: item.photoUrl }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.placeholderImage]}>
            <Text style={{ fontSize: 32 }}>{typeConfig.emoji}</Text>
          </View>
        )}
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statConfig.color + '20' }]}>
              <Text style={[styles.statusText, { color: statConfig.color }]}>
                {statConfig.label}
              </Text>
            </View>
          </View>

          <View style={styles.cardRow}>
            <Package size={14} color={colors.textSecondary} style={styles.icon} />
            <Text style={styles.cardSubtitle}>{item.quantityText} • <Text style={{ color: typeConfig.color, fontWeight: '600' }}>{typeConfig.label}</Text></Text>
          </View>

          <View style={styles.cardRow}>
            <Clock size={14} color={isExpired ? colors.error : colors.textSecondary} style={styles.icon} />
            <Text style={[styles.cardSubtitle, isExpired && { color: colors.error, fontWeight: '600' }]}>
              {new Date(item.pickupEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        <View style={styles.chevron}>
          <ChevronRight color={colors.borderStrong} size={20} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Hero Header */}
      <LinearGradient colors={gradients.hero} style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerGreeting}>Hello, {user?.name?.split(' ')[0] || 'Donor'} 👋</Text>
            <Text style={styles.headerTitle}>My Donations</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOut color="#FFFFFF" size={20} />
          </TouchableOpacity>
        </View>

        {/* Impact Stat */}
        <View style={styles.impactCard}>
          <View>
            <Text style={styles.impactLabel}>People Fed</Text>
            <Text style={styles.impactValue}>{user?.impactMeals || 0}</Text>
          </View>
          <View>
            <Text style={styles.impactLabel}>Impact Points</Text>
            <Text style={styles.impactValue}>{user?.impactPoints || 0}</Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <Text style={{ fontSize: 48 }}>🥗</Text>
              </View>
              <Text style={styles.emptyTitle}>Share a Meal Today</Text>
              <Text style={styles.emptySubtitle}>You haven't posted any food yet. Post your surplus food and help those in need.</Text>
            </View>
          ) : null
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('PostListing')}
      >
        <LinearGradient colors={gradients.warm} style={styles.fabGradient}>
          <Plus color="#FFFFFF" size={24} />
          <Text style={styles.fabText}>Post Food</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60, // For safe area
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    ...shadows.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  headerGreeting: {
    ...typography.bodyMd,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  headerTitle: {
    ...typography.display,
    color: '#FFFFFF',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  impactCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.md,
    padding: spacing.m,
  },
  impactLabel: {
    ...typography.label,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  impactValue: {
    ...typography.heading,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 2,
  },
  listContainer: {
    padding: spacing.m,
    paddingBottom: 100, // Space for FAB
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
    overflow: 'hidden',
  },
  cardColorStrip: {
    width: 4,
    height: '100%',
  },
  cardImage: {
    width: 80,
    height: '100%',
    minHeight: 100,
    backgroundColor: colors.surfaceAlt,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: radius.full,
  },
  statusText: {
    ...typography.label,
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
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIconBg: {
    width: 100, height: 100,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.l,
  },
  emptyTitle: {
    ...typography.heading,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.bodyMd,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.l,
    alignSelf: 'center',
    ...shadows.glowOrange,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    borderRadius: radius.full,
  },
  fabText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginLeft: spacing.xs,
  },
});
