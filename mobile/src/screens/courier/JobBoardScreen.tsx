import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Package, Clock, MapPin, Snowflake, ChevronRight, Truck } from 'lucide-react-native';
import { AppStackParamList } from '../../navigation/types';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../api';

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
    foodType: string;
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

  // Default to Pune; in production this comes from device GPS
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

  useEffect(() => { fetchJobs(); }, []);

  const onRefresh = () => { setIsRefreshing(true); fetchJobs(); };

  const getUrgencyColor = (pickupEnd: string) => {
    const minsLeft = (new Date(pickupEnd).getTime() - Date.now()) / 60000;
    if (minsLeft < 30) return colors.error;
    if (minsLeft < 60) return colors.accent;
    return colors.success;
  };

  const formatDistance = (meters: number | null) => {
    if (!meters) return 'Nearby';
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
  };

  const renderItem = ({ item }: { item: CourierJob }) => {
    const urgencyColor = getUrgencyColor(item.listing.pickupEnd);
    const minsLeft = Math.max(0, Math.floor((new Date(item.listing.pickupEnd).getTime() - Date.now()) / 60000));

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
      >
        {/* Urgency bar */}
        <View style={[styles.urgencyBar, { backgroundColor: urgencyColor }]} />

        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.listing.title}</Text>
            <Text style={[styles.urgencyText, { color: urgencyColor }]}>
              {minsLeft < 1 ? 'Expiring!' : `${minsLeft}m left`}
            </Text>
          </View>

          <View style={styles.tagsRow}>
            <View style={styles.tag}>
              <Package size={13} color={colors.textSecondary} />
              <Text style={styles.tagText}>{item.listing.quantityNum} {item.listing.quantityText}</Text>
            </View>
            <View style={styles.tag}>
              <MapPin size={13} color={colors.textSecondary} />
              <Text style={styles.tagText}>{formatDistance(item.distanceMeters)}</Text>
            </View>
            {item.listing.requiresColdChain && (
              <View style={[styles.tag, styles.coldTag]}>
                <Snowflake size={13} color={colors.primary} />
                <Text style={[styles.tagText, { color: colors.primary }]}>Cold Chain</Text>
              </View>
            )}
          </View>

          <View style={styles.addressRow}>
            <MapPin size={14} color={colors.textSecondary} />
            <Text style={styles.addressText} numberOfLines={1}>{item.listing.addressText}</Text>
          </View>
        </View>

        <ChevronRight size={20} color={colors.textSecondary} style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Job Board</Text>
        <Text style={styles.headerSub}>
          {jobs.length > 0 ? `${jobs.length} jobs available nearby` : 'No open jobs right now'}
        </Text>
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Truck size={56} color={colors.border} />
            <Text style={styles.emptyTitle}>No jobs nearby</Text>
            <Text style={styles.emptySub}>Pull down to refresh. New jobs appear when receivers claim food.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    padding: spacing.l,
    paddingTop: spacing.xxl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { ...typography.heading },
  headerSub: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  list: { padding: spacing.m, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginBottom: spacing.m,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  urgencyBar: { width: 4 },
  cardBody: { flex: 1, padding: spacing.m },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.s },
  cardTitle: { ...typography.subhead, flex: 1, marginRight: spacing.s },
  urgencyText: { fontSize: 12, fontWeight: '700' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s, marginBottom: spacing.s },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F3F4F6', borderRadius: 6,
    paddingHorizontal: spacing.s, paddingVertical: 3,
  },
  coldTag: { backgroundColor: colors.primary + '15' },
  tagText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  addressText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  chevron: { alignSelf: 'center', marginRight: spacing.s },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80, gap: spacing.m, paddingHorizontal: spacing.xl },
  emptyTitle: { ...typography.subhead },
  emptySub: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
