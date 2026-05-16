import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator
} from 'react-native';
import { CheckCircle, Truck, Star } from 'lucide-react-native';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../api';
import { useAuthStore } from '../../store/authStore';

interface CompletedJob {
  id: string;
  status: string;
  pointsAwarded: number;
  createdAt: string;
  listing: {
    title: string;
    quantityNum: number;
    quantityText: string;
  };
}

export const CourierHistoryScreen = () => {
  const user = useAuthStore((s) => s.user);
  const [jobs, setJobs] = useState<CompletedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [totalDeliveries, setTotalDeliveries] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await api.get('/courier/jobs/my');
        const data = response.data;
        setJobs(data.jobs ?? []);
        setTotalPoints(data.totalPoints ?? 0);
        setTotalDeliveries(data.totalDeliveries ?? 0);
      } catch (error) {
        console.error('Failed to fetch courier history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const getBadge = (deliveries: number) => {
    if (deliveries >= 100) return { label: 'Legend', color: '#7C3AED' };
    if (deliveries >= 50)  return { label: 'Champion', color: '#D97706' };
    if (deliveries >= 10)  return { label: 'Regular', color: colors.primary };
    if (deliveries >= 1)   return { label: 'Starter', color: colors.success };
    return null;
  };

  const badge = getBadge(totalDeliveries);
  const nextMilestone = totalDeliveries >= 100 ? null : [1, 10, 50, 100].find((m) => m > totalDeliveries);
  const progress = nextMilestone ? (totalDeliveries / nextMilestone) * 100 : 100;

  const renderItem = ({ item }: { item: CompletedJob }) => (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <CheckCircle size={22} color={colors.success} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.listing.title}</Text>
        <Text style={styles.cardMeta}>
          {item.listing.quantityNum} {item.listing.quantityText} • {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
      {item.pointsAwarded > 0 && (
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>+{item.pointsAwarded} pts</Text>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <FlatList
      style={styles.container}
      data={jobs}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View>
          {/* Stats Card */}
          <View style={styles.statsCard}>
            <Text style={styles.statsName}>{user?.name ?? 'Courier'}</Text>
            {badge && (
              <View style={[styles.badgePill, { backgroundColor: badge.color }]}>
                <Star size={14} color={colors.surface} />
                <Text style={styles.badgeLabel}>{badge.label}</Text>
              </View>
            )}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{totalDeliveries}</Text>
                <Text style={styles.statLabel}>Deliveries</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{totalPoints}</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  ~{Math.round(totalDeliveries * 2.5)} kg
                </Text>
                <Text style={styles.statLabel}>CO₂ Saved</Text>
              </View>
            </View>

            {/* Progress bar to next badge */}
            {nextMilestone && (
              <View style={styles.progressSection}>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressText}>{totalDeliveries} / {nextMilestone} deliveries to next badge</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
              </View>
            )}
          </View>

          <Text style={styles.sectionTitle}>Delivery History</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Truck size={48} color={colors.border} />
          <Text style={styles.emptyTitle}>No deliveries yet</Text>
          <Text style={styles.emptySub}>Check the Job Board to start making deliveries!</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: spacing.m, flexGrow: 1 },
  statsCard: {
    backgroundColor: colors.primary,
    borderRadius: 20, padding: spacing.xl,
    marginBottom: spacing.l, alignItems: 'center',
    gap: spacing.m,
  },
  statsName: { ...typography.heading, color: colors.surface, fontSize: 22 },
  badgePill: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.m, paddingVertical: spacing.xs,
    borderRadius: 20,
  },
  badgeLabel: { color: colors.surface, fontWeight: '700', fontSize: 13 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.m, width: '100%', justifyContent: 'center' },
  statItem: { alignItems: 'center', flex: 1 },
  statNumber: { ...typography.heading, color: colors.surface, fontSize: 26 },
  statLabel: { ...typography.caption, color: 'rgba(255,255,255,0.7)' },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.3)' },
  progressSection: { width: '100%', gap: spacing.xs },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { ...typography.caption, color: 'rgba(255,255,255,0.8)' },
  progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4 },
  progressFill: { height: 8, backgroundColor: colors.accent, borderRadius: 4 },
  sectionTitle: { ...typography.subhead, marginBottom: spacing.m, marginTop: spacing.s },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 12,
    padding: spacing.m, marginBottom: spacing.m,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    gap: spacing.m,
  },
  cardIcon: { width: 36, alignItems: 'center' },
  cardContent: { flex: 1 },
  cardTitle: { ...typography.subhead, fontSize: 15 },
  cardMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  pointsBadge: {
    backgroundColor: colors.success + '20', borderRadius: 8,
    paddingHorizontal: spacing.s, paddingVertical: spacing.xs,
  },
  pointsText: { color: colors.success, fontWeight: '700', fontSize: 12 },
  empty: { justifyContent: 'center', alignItems: 'center', paddingVertical: 60, gap: spacing.m },
  emptyTitle: { ...typography.subhead },
  emptySub: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
