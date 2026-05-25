import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Package, Clock, MapPin, Snowflake, ChevronRight, Truck, Zap, Bell } from 'lucide-react-native';
import { AppStackParamList } from '../../navigation/types';
import { colors, typography, spacing, radius, shadows, gradients, foodTypeConfig } from '../../theme';
import { api } from '../../api';
import { useAuthStore } from '../../store/authStore';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

export interface CourierJob {
  id: string;
  status: 'open' | 'accepted' | 'picked_up' | 'delivered' | 'cancelled';
  vehicleRequired: string | null;
  requiresColdChain: boolean;
  distanceMeters: number | null;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    foodType: 'veg' | 'non_veg' | 'both';
    quantityNum: number;
    quantityText: string;
    pickupEnd: string;
    addressText: string;
    requiresColdChain: boolean;
  };
  donor: { id: string; name: string | null };
  receiver: { id: string; name: string | null } | null;
}

export const JobBoardScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [jobs, setJobs] = useState<CourierJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const user = useAuthStore(state => state.user);
  
  // Timer for countdowns
  const [, setTick] = useState(0);

  // Default to Pune
  const LAT = 18.5204;
  const LNG = 73.8567;

  const fetchJobs = useCallback(async () => {
    try {
      const response = await api.get(`/courier/jobs?lat=${LAT}&lng=${LNG}&radius=15000`);
      setJobs(response.data.jobs ?? []);
    } catch (error) {
      console.error('Failed to fetch courier jobs:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [fetchJobs])
  );

  // Update countdowns every minute
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => { setIsRefreshing(true); fetchJobs(); };

  const getUrgencyConfig = (pickupEnd: string) => {
    const minsLeft = (new Date(pickupEnd).getTime() - Date.now()) / 60000;
    if (minsLeft < 30) return { color: colors.error, label: 'Urgent', pulse: true };
    if (minsLeft < 60) return { color: colors.warning, label: 'Soon', pulse: false };
    return { color: colors.success, label: 'Relaxed', pulse: false };
  };

  const formatDistance = (meters: number | null) => {
    if (!meters) return 'Nearby';
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
  };

  const renderItem = ({ item }: { item: CourierJob }) => {
    const urgency = getUrgencyConfig(item.listing.pickupEnd);
    const minsLeft = Math.max(0, Math.floor((new Date(item.listing.pickupEnd).getTime() - Date.now()) / 60000));
    const foodType = foodTypeConfig[item.listing.foodType] || foodTypeConfig.veg;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
      >
        <LinearGradient 
          colors={urgency.color === colors.error ? gradients.urgent : [urgency.color, urgency.color]} 
          style={styles.urgencyBar} 
        />
        
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.listing.title}</Text>
              <Text style={styles.donorName}>from {item.donor.name || 'Donor'}</Text>
            </View>
            <View style={[styles.timeBadge, { backgroundColor: urgency.color + '15' }]}>
              {urgency.pulse && <View style={[styles.pulseDot, { backgroundColor: urgency.color }]} />}
              <Text style={[styles.timeText, { color: urgency.color }]}>
                {minsLeft < 1 ? 'Now' : `${minsLeft}m`}
              </Text>
            </View>
          </View>

          <View style={styles.tagsRow}>
            <View style={[styles.tag, { backgroundColor: foodType.bg }]}>
              <Text style={styles.tagEmoji}>{foodType.emoji}</Text>
              <Text style={[styles.tagText, { color: foodType.color }]}>{foodType.label}</Text>
            </View>
            <View style={styles.tag}>
              <Package size={12} color={colors.textSecondary} />
              <Text style={styles.tagText}>{item.listing.quantityNum} {item.listing.quantityText}</Text>
            </View>
            {item.listing.requiresColdChain && (
              <View style={[styles.tag, styles.coldTag]}>
                <Snowflake size={12} color={colors.info} />
                <Text style={[styles.tagText, { color: colors.info }]}>Cold Chain</Text>
              </View>
            )}
          </View>

          <View style={styles.footerRow}>
            <View style={styles.addressContainer}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text style={styles.addressText} numberOfLines={1}>
                <Text style={{ fontWeight: '600' }}>{formatDistance(item.distanceMeters)}</Text> • {item.listing.addressText}
              </Text>
            </View>
            
            <View style={styles.rewardBadge}>
              <Zap size={12} color={colors.accent} fill={colors.accent} />
              <Text style={styles.rewardText}>+10 pt</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient colors={gradients.hero} style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerGreeting}>Ready to deliver? 🛵</Text>
            <Text style={styles.headerTitle}>Job Board</Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View>
            <Text style={styles.statLabel}>Available Nearby</Text>
            <Text style={styles.statValue}>{jobs.length}</Text>
          </View>
          <View>
            <Text style={styles.statLabel}>My Points</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} color={colors.accent} fill={colors.accent} style={{ marginRight: 4 }} />
              <Text style={styles.statValue}>{user?.impactPoints || 0}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconBg}>
              <Truck size={40} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySub}>There are no delivery jobs right now. Check back later when food is claimed.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  
  // Header
  header: {
    paddingTop: 60,
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    ...shadows.md,
  },
  headerTopRow: { marginBottom: spacing.l },
  headerGreeting: { ...typography.bodyMd, color: 'rgba(255,255,255,0.8)' },
  headerTitle: { ...typography.display, color: '#FFFFFF' },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.md,
    padding: spacing.m,
  },
  statLabel: { ...typography.label, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  statValue: { ...typography.heading, color: '#FFFFFF', textAlign: 'center', marginTop: 2 },

  // List
  list: { padding: spacing.m, flexGrow: 1 },
  
  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.m,
    overflow: 'hidden',
    ...shadows.md,
  },
  urgencyBar: { width: 6 },
  cardBody: { flex: 1, padding: spacing.m },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  cardTitle: { ...typography.subhead, marginBottom: 2 },
  donorName: { ...typography.caption },
  
  timeBadge: { 
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4, 
    borderRadius: radius.full 
  },
  pulseDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  timeText: { fontSize: 12, fontFamily: 'Inter_700Bold' },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s, marginBottom: spacing.m },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surfaceAlt, borderRadius: radius.sm,
    paddingHorizontal: spacing.s, paddingVertical: 4,
  },
  coldTag: { backgroundColor: colors.info + '15' },
  tagEmoji: { fontSize: 12 },
  tagText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.textSecondary },

  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  addressContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1, marginRight: spacing.m },
  addressText: { ...typography.caption, flex: 1 },
  
  rewardBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: colors.accent + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  rewardText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#B45309' },

  // Empty state
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80, paddingHorizontal: spacing.xl },
  emptyIconBg: { width: 80, height: 80, borderRadius: radius.full, backgroundColor: colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.l },
  emptyTitle: { ...typography.heading, marginBottom: spacing.xs },
  emptySub: { ...typography.bodyMd, textAlign: 'center' },
});
