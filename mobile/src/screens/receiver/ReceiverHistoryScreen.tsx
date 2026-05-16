import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react-native';
import { AppStackParamList } from '../../navigation/types';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../api';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

interface ClaimHistory {
  id: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  listing: {
    id: string;
    title: string;
    quantityNum: number;
    quantityText: string;
    foodType: string;
  };
}

export const ReceiverHistoryScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [claims, setClaims] = useState<ClaimHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await api.get('/claims/my');
        setClaims(response.data.claims ?? []);
      } catch (error) {
        console.error('Failed to fetch claim history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={20} color={colors.success} />;
      case 'cancelled': return <XCircle size={20} color={colors.error} />;
      default: return <Clock size={20} color={colors.accent} />;
    }
  };

  const renderItem = ({ item }: { item: ClaimHistory }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        if (item.status === 'active') {
          navigation.navigate('ActiveClaim', { claimId: item.id, listingId: item.listing.id });
        }
      }}
    >
      <View style={styles.iconCol}>
        {getStatusIcon(item.status)}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.foodTitle}>{item.listing.title}</Text>
        <Text style={styles.meta}>
          {item.listing.quantityNum} {item.listing.quantityText} • {item.listing.foodType.toUpperCase()}
        </Text>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
      </View>
      <View style={styles.statusCol}>
        <Text style={[styles.statusText, styles[item.status]]}>{item.status.toUpperCase()}</Text>
        {item.status === 'active' && <ChevronRight size={18} color={colors.textSecondary} />}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Claims</Text>
        <Text style={styles.headerSub}>{claims.length} total</Text>
      </View>
      <FlatList
        data={claims}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <CheckCircle size={48} color={colors.border} />
            <Text style={styles.emptyTitle}>No claims yet</Text>
            <Text style={styles.emptySub}>Find food on the map and claim it!</Text>
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
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: spacing.m,
  },
  iconCol: { width: 32, alignItems: 'center' },
  cardContent: { flex: 1 },
  foodTitle: { ...typography.subhead, fontSize: 15 },
  meta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  date: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  statusCol: { alignItems: 'flex-end', gap: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },
  active: { color: colors.accent },
  completed: { color: colors.success },
  cancelled: { color: colors.error },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80, gap: spacing.m },
  emptyTitle: { ...typography.subhead },
  emptySub: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
