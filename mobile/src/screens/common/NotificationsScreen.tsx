import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Bell, CheckCircle, Package, MessageCircle } from 'lucide-react-native';
import { AppStackParamList } from '../../navigation/types';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../api';

type Props = NativeStackScreenProps<AppStackParamList, 'Notifications'>;

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  sentAt: string;
  data: any;
}

export const NotificationsScreen = ({ navigation }: Props) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Mark all as read when opening screen
    api.patch('/notifications/read-all').catch(console.error);
  }, []);

  const handlePress = (notif: Notification) => {
    // If it has screen data, navigate
    if (notif.data?.screen) {
      const { screen, ...params } = notif.data;
      navigation.navigate(screen as keyof AppStackParamList, params);
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'claimed': return <CheckCircle size={24} color={colors.success} />;
      case 'courier_accepted': return <Package size={24} color={colors.accent} />;
      case 'picked_up': return <Package size={24} color={colors.accent} />;
      case 'delivered': return <CheckCircle size={24} color={colors.success} />;
      case 'message': return <MessageCircle size={24} color={colors.primary} />;
      default: return <Bell size={24} color={colors.primary} />;
    }
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell size={48} color={colors.borderStrong} />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySub}>When there is an update on your food, it will appear here.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.notifCard, !item.read && styles.notifUnread]}
            onPress={() => handlePress(item)}
            disabled={!item.data?.screen}
          >
            <View style={styles.iconContainer}>
              {renderIcon(item.type)}
            </View>
            <View style={styles.contentContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.time}>{new Date(item.sentAt).toLocaleString()}</Text>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: spacing.m },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.m,
    borderRadius: 12,
    marginBottom: spacing.s,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  notifUnread: {
    backgroundColor: colors.primary + '0A',
  },
  iconContainer: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.m,
  },
  contentContainer: { flex: 1 },
  title: { ...typography.subhead, marginBottom: 2 },
  body: { ...typography.body, color: colors.textSecondary },
  time: { ...typography.caption, color: colors.borderStrong, marginTop: 4 },
  unreadDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.primary,
    alignSelf: 'center',
    marginLeft: spacing.s,
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: 'center',
  },
  emptyTitle: { ...typography.heading, marginTop: spacing.l, marginBottom: spacing.xs },
  emptySub: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.xl },
});
