import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { Leaf, Award, Star, MapPin, Share2, LogOut, ChevronRight } from 'lucide-react-native';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '@react-navigation/native';

interface ImpactStats {
  id: string;
  primaryRole: string;
  ratingAvg: number;
  ratingCount: number;
  impactMeals: number;
  impactPoints: number;
  co2SavedKg: number;
  listingsPosted: number;
  listingsDelivered: number;
  claimsCollected: number;
  jobsDelivered: number;
}

export const ProfileScreen = () => {
  const { user, logout } = useAuthStore();
  const navigation = useNavigation();
  const [stats, setStats] = useState<ImpactStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/ratings/users/${user.id}/impact`);
      setStats(response.data);
    } catch (error) {
      console.error('[Profile] Failed to load impact stats', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (!stats) {
    return (
      <View style={styles.centered}>
        <Text style={typography.body}>Could not load profile.</Text>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={logout}>
          <Text style={{ color: colors.error, fontWeight: 'bold' }}>Log Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Choose stats to highlight based on role
  const isDonor = stats.primaryRole === 'donor';
  const isReceiver = stats.primaryRole === 'receiver';
  const isCourier = stats.primaryRole === 'courier';

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header Profile Info */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitials}>{user?.name?.substring(0, 2).toUpperCase() ?? 'U'}</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? 'User'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{stats.primaryRole.toUpperCase()}</Text>
        </View>

        {/* Rating Stars */}
        {stats.ratingCount > 0 && (
          <View style={styles.ratingRow}>
            <Star size={16} color="#FBBF24" fill="#FBBF24" />
            <Text style={styles.ratingScore}>{stats.ratingAvg.toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({stats.ratingCount} reviews)</Text>
          </View>
        )}
      </View>

      {/* Global Impact Card (Visible to all) */}
      <View style={styles.impactCard}>
        <View style={styles.impactCardTop}>
          <Leaf size={24} color={colors.primary} />
          <Text style={styles.impactCardTitle}>My Lifetime Impact</Text>
        </View>
        <View style={styles.impactGrid}>
          <View style={styles.impactBox}>
            <Text style={styles.impactVal}>{stats.impactMeals}</Text>
            <Text style={styles.impactLabel}>Meals Saved</Text>
          </View>
          <View style={styles.impactBox}>
            <Text style={styles.impactVal}>{stats.co2SavedKg} <Text style={{fontSize: 14}}>kg</Text></Text>
            <Text style={styles.impactLabel}>CO₂ Prevented</Text>
          </View>
        </View>
      </View>

      {/* Role-Specific Stats */}
      <Text style={styles.sectionTitle}>Activity Overview</Text>
      
      <View style={styles.statsContainer}>
        <TouchableOpacity 
          style={styles.impactBtn}
          onPress={() => navigation.navigate('ImpactDashboard' as never)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.m }}>
            <Award size={20} color={colors.primary} />
            <Text style={{ ...typography.subhead }}>Open Impact Dashboard</Text>
          </View>
          <ChevronRight size={20} color={colors.borderStrong} />
        </TouchableOpacity>
        {isDonor && (
          <>
            <StatRow label="Listings Posted" value={stats.listingsPosted.toString()} />
            <StatRow label="Successfully Donated" value={stats.listingsDelivered.toString()} />
          </>
        )}
        {isReceiver && (
          <>
            <StatRow label="Food Claims Made" value={stats.claimsCollected.toString()} />
            <StatRow label="Organizations Served" value="1" />
          </>
        )}
        {isCourier && (
          <>
            <StatRow label="Impact Points Earned" value={stats.impactPoints.toString()} />
            <StatRow label="Deliveries Completed" value={stats.jobsDelivered.toString()} />
          </>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionBtn}>
          <Share2 size={20} color={colors.primary} />
          <Text style={styles.actionBtnText}>Share My Impact</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionBtn, { marginTop: spacing.m }]} onPress={logout}>
          <LogOut size={20} color={colors.error} />
          <Text style={[styles.actionBtnText, { color: colors.error }]}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const StatRow = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
  <View style={styles.statRow}>
    <View style={styles.statLabelRow}>
      {icon}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.m,
  },
  avatarInitials: { ...typography.heading, fontSize: 32, color: colors.primary },
  name: { ...typography.heading, fontSize: 24, marginBottom: 4 },
  roleBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: spacing.m,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: spacing.m,
  },
  roleText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingScore: { fontWeight: '700', fontSize: 16 },
  ratingCount: { color: colors.textSecondary, fontSize: 14 },
  impactCard: {
    margin: spacing.l,
    backgroundColor: colors.primary + '10',
    borderRadius: 16,
    padding: spacing.l,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  impactCardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.s, marginBottom: spacing.m },
  impactCardTitle: { ...typography.subhead, color: colors.primary },
  impactGrid: { flexDirection: 'row', gap: spacing.m },
  impactBox: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 12,
    padding: spacing.m, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  impactVal: { ...typography.heading, fontSize: 28, color: colors.primary, marginBottom: 4 },
  impactLabel: { ...typography.caption, color: colors.textSecondary },
  sectionTitle: { ...typography.subhead, marginHorizontal: spacing.l, marginBottom: spacing.s },
  statsContainer: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.l,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.m, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s },
  statLabel: { ...typography.body, color: colors.textPrimary },
  statValue: { ...typography.subhead, fontSize: 16 },
  actionsContainer: { padding: spacing.l, marginTop: spacing.l },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.s,
    backgroundColor: colors.surface, paddingVertical: spacing.l, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  actionBtnText: { ...typography.subhead, color: colors.primary },
  impactBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.m, borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.primary + '10'
  }
});
