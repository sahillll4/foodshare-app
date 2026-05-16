import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { Bell, CheckCheck, MessageCircle, Package, Truck, Star } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/types';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../api';
import { connectSocket, getSocket } from '../../lib/socket';
import { useAuthStore } from '../../store/authStore';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

interface AppNotification {
  id: string;
  type: 'claim' | 'courier_accepted' | 'picked_up' | 'delivered' | 'message' | 'expiry' | 'general';
  title: string;
  body: string;
  read: boolean;
  data: Record<string, string>;
  sentAt: string;
}

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  claim: <Package size={22} color={colors.primary} />,
  courier_accepted: <Truck size={22} color={colors.primary} />,
  picked_up: <Truck size={22} color={colors.accent} />,
  delivered: <CheckCheck size={22} color={colors.success} />,
  message: <MessageCircle size={22} color={colors.primary} />,
  expiry: <Bell size={22} color={colors.error} />,
  general: <Bell size={22} color={colors.textSecondary} />,
};

export const NotificationsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useAuthStore((s) => s.user);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      const notifs: AppNotification[] = response.data.notifications ?? [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.read).length);
    } catch (error) {
      console.error('[Notifications] Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Listen for real-time notifications pushed to the user's personal room
    const sock = connectSocket();
    const handlePush = (notif: AppNotification) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((c) => c + 1);
    };
    sock.on('notification:new', handlePush);
    return () => { sock.off('notification:new', handlePush); };
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('[Notifications] Mark read error:', error);
    }
  };

  const handleNotificationPress = async (notif: AppNotification) => {
    // Mark single notification read
    if (!notif.read) {
      try {
        await api.patch(`/notifications/${notif.id}/read`);
        setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n));
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (_) {}
    }

    // Deep link to the relevant screen
    if (notif.data?.listingId) {
      if (notif.type === 'message') {
        navigation.navigate('Chat', { listingId: notif.data.listingId, title: notif.data.title ?? 'Chat' });
      } else if (notif.data?.claimId) {
        navigation.navigate('ActiveClaim', { claimId: notif.data.claimId, listingId: notif.data.listingId });
      } else if (notif.data?.jobId) {
        navigation.navigate('ActiveJob', { jobId: notif.data.jobId });
      } else {
        navigation.navigate('ListingDetail', { listingId: notif.data.listingId });
      }
    }
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const renderItem = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity
      style={[styles.card, !item.read && styles.cardUnread]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.iconCol}>
        {NOTIF_ICONS[item.type] ?? NOTIF_ICONS.general}
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, !item.read && styles.boldTitle]}>{item.title}</Text>
        <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.cardTime}>{timeAgo(item.sentAt)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
            <CheckCheck size={18} color={colors.primary} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Bell size={48} color={colors.border} />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySub}>You'll be notified of claims, pickups, and messages here.</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { ...typography.heading },
  headerSub: { ...typography.caption, color: colors.primary, marginTop: 2 },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  markAllText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  list: { padding: spacing.m, flexGrow: 1 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: colors.surface, borderRadius: 12,
    padding: spacing.m, marginBottom: spacing.m,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    gap: spacing.m,
  },
  cardUnread: { backgroundColor: colors.primary + '08', borderLeftWidth: 3, borderLeftColor: colors.primary },
  iconCol: { width: 36, alignItems: 'center', paddingTop: 2 },
  cardContent: { flex: 1 },
  cardTitle: { ...typography.subhead, fontSize: 15 },
  boldTitle: { fontWeight: '700' },
  cardBody: { ...typography.body, fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  cardTime: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  unreadDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.primary, marginTop: 6,
  },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80, gap: spacing.m, paddingHorizontal: spacing.xl },
  emptyTitle: { ...typography.subhead },
  emptySub: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
