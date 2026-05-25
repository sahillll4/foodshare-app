import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Leaf, Package, Heart, Zap, Award } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows, gradients } from '../../theme';
import { api } from '../../api';
import { useAuthStore } from '../../store/authStore';

interface ImpactStats {
  impactMeals: number;
  impactPoints: number;
  ratingAvg: number;
  listingsPosted: number;
  listingsDelivered: number;
  claimsCollected: number;
  jobsDelivered: number;
  co2SavedKg: number;
}

export const ImpactDashboardScreen = () => {
  const user = useAuthStore(state => state.user);
  const [stats, setStats] = useState<ImpactStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchImpact = async () => {
      try {
        if (!user) return;
        const response = await api.get(`/ratings/users/${user.id}/impact`);
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch impact stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchImpact();
  }, [user]);

  if (isLoading || !stats) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient colors={gradients.hero} style={styles.header}>
        <Text style={styles.headerTitle}>Your Global Impact</Text>
        <Text style={styles.headerSub}>Every meal shared makes a difference.</Text>
      </LinearGradient>

      {/* Main Metric */}
      <View style={styles.mainMetricCard}>
        <View style={styles.metricRow}>
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Meals Shared</Text>
            <Text style={styles.metricHuge}>{stats.impactMeals}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>CO₂ Saved (kg)</Text>
            <Text style={[styles.metricHuge, { color: colors.success }]}>{stats.co2SavedKg}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Detailed Stats</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <View style={[styles.iconBg, { backgroundColor: colors.accent + '20' }]}>
            <Zap size={24} color={colors.accent} />
          </View>
          <Text style={styles.statValue}>{stats.impactPoints}</Text>
          <Text style={styles.statLabel}>Courier Points</Text>
        </View>

        <View style={styles.statBox}>
          <View style={[styles.iconBg, { backgroundColor: colors.primary + '20' }]}>
            <Heart size={24} color={colors.primary} />
          </View>
          <Text style={styles.statValue}>{stats.listingsPosted}</Text>
          <Text style={styles.statLabel}>Food Donated</Text>
        </View>

        <View style={styles.statBox}>
          <View style={[styles.iconBg, { backgroundColor: colors.success + '20' }]}>
            <Package size={24} color={colors.success} />
          </View>
          <Text style={styles.statValue}>{stats.claimsCollected}</Text>
          <Text style={styles.statLabel}>Food Claimed</Text>
        </View>

        <View style={styles.statBox}>
          <View style={[styles.iconBg, { backgroundColor: colors.info + '20' }]}>
            <Award size={24} color={colors.info} />
          </View>
          <Text style={styles.statValue}>{stats.ratingAvg.toFixed(1)} ⭐</Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
      </View>
      
      <View style={styles.ecoCard}>
        <Leaf size={24} color={colors.success} style={{ marginBottom: spacing.sm }} />
        <Text style={styles.ecoTitle}>Did you know?</Text>
        <Text style={styles.ecoBody}>
          By rescuing {stats.impactMeals} meals, you have saved the equivalent of {stats.co2SavedKg}kg of CO2 emissions. That's like planting {Math.round(stats.co2SavedKg / 21)} trees!
        </Text>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: spacing.xl },
  
  header: {
    paddingTop: 60, paddingBottom: 60,
    paddingHorizontal: spacing.l,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerTitle: { ...typography.display, color: '#FFFFFF', textAlign: 'center' },
  headerSub: { ...typography.bodyMd, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: spacing.sm },

  mainMetricCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.l,
    marginHorizontal: spacing.m,
    marginTop: -40,
    ...shadows.lg,
  },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricCol: { flex: 1, alignItems: 'center' },
  metricDivider: { width: 1, height: 40, backgroundColor: colors.border },
  metricLabel: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs },
  metricHuge: { fontSize: 36, fontFamily: 'Inter_700Bold', color: colors.primary },

  sectionTitle: { ...typography.heading, marginHorizontal: spacing.m, marginTop: spacing.xl, marginBottom: spacing.m },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.sm },
  statBox: {
    width: '50%', padding: spacing.sm,
    alignItems: 'center',
  },
  iconBg: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.s },
  statValue: { ...typography.subhead },
  statLabel: { ...typography.caption, color: colors.textSecondary },

  ecoCard: {
    margin: spacing.m,
    marginTop: spacing.xl,
    backgroundColor: colors.success + '10',
    padding: spacing.l,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  ecoTitle: { ...typography.subhead, color: colors.success, marginBottom: spacing.xs },
  ecoBody: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
});
