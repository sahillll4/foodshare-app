import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Send } from 'lucide-react-native';
import { AppStackParamList } from '../../navigation/types';
import { colors, typography, spacing, radius, shadows } from '../../theme';
import { api } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { connectSocket, joinListingRoom, leaveListingRoom, getSocket } from '../../lib/socket';

type Props = NativeStackScreenProps<AppStackParamList, 'Chat'>;

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

export const ChatScreen = ({ route }: Props) => {
  const { listingId } = route.params;
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Load history
  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get(`/messages/${listingId}`);
        setMessages((response.data.messages ?? []).reverse());
      } catch (error) {
        console.error('[Chat] Failed to load history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [listingId]);

  // Socket
  useEffect(() => {
    const sock = connectSocket();
    joinListingRoom(listingId);

    const handleNewMessage = (payload: {
      _id?: string;
      content: string;
      senderId: string;
      senderName: string;
      listingId: string;
      createdAt?: string;
    }) => {
      if (payload.senderId === user?.id) return;

      const incoming: ChatMessage = {
        id: payload._id ?? Math.random().toString(),
        content: payload.content,
        createdAt: payload.createdAt ?? new Date().toISOString(),
        sender: { id: payload.senderId, name: payload.senderName, avatarUrl: null },
      };
      setMessages((prev) => [incoming, ...prev]);
    };

    sock.on('message:new', handleNewMessage);

    return () => {
      sock.off('message:new', handleNewMessage);
      leaveListingRoom(listingId);
    };
  }, [listingId, user?.id]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !user || isSending) return;

    setInputText('');
    setIsSending(true);

    // Optimistic append
    const optimistic: ChatMessage = {
      id: Math.random().toString(),
      content: text,
      createdAt: new Date().toISOString(),
      sender: { id: user.id, name: user.name, avatarUrl: null },
    };
    setMessages((prev) => [optimistic, ...prev]);

    try {
      await api.post(`/messages/${listingId}`, { content: text, receiverId: 'broadcast' });
      getSocket().emit('message:send', {
        listingId,
        content: text,
        senderId: user.id,
        senderName: user.name ?? 'User',
        receiverId: 'broadcast',
        _id: optimistic.id,
        createdAt: optimistic.createdAt,
      });
    } catch (error) {
      console.error('[Chat] Failed to send:', error);
    } finally {
      setIsSending(false);
    }
  }, [inputText, listingId, user, isSending]);

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isMe = item.sender.id === user?.id;
    const initials = (item.sender.name ?? 'U').charAt(0).toUpperCase();
    const timeStr = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        {!isMe && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          {!isMe && (
            <Text style={styles.senderName}>{item.sender.name ?? 'Anonymous'}</Text>
          )}
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.content}</Text>
          <Text style={[styles.timeText, isMe && styles.timeTextMe]}>{timeStr}</Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptySub}>Start the conversation with the donor or receiver.</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          inverted
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={500}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!inputText.trim() || isSending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
          activeOpacity={0.8}
        >
          {isSending
            ? <ActivityIndicator size="small" color="#FFF" />
            : <Send size={20} color="#FFF" />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: spacing.m, paddingVertical: spacing.s },

  // Empty state
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.m },
  emptyTitle: { ...typography.subhead, marginBottom: spacing.xs },
  emptySub: { ...typography.bodyMd, textAlign: 'center' },

  // Message rows
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: spacing.xs,
    gap: spacing.s,
  },
  messageRowMe: { flexDirection: 'row-reverse' },

  // Avatar
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary + '25',
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.primary },

  // Bubbles
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  bubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm,
  },
  bubbleThem: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  senderName: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  bubbleText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 21,
  },
  bubbleTextMe: { color: '#FFFFFF' },
  timeText: {
    ...typography.caption,
    marginTop: 4,
    textAlign: 'right',
    color: colors.textSecondary,
  },
  timeTextMe: { color: 'rgba(255,255,255,0.65)' },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.m,
    paddingBottom: spacing.l,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.s,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.sm,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    ...shadows.glow,
  },
  sendBtnDisabled: { backgroundColor: colors.borderStrong, shadowOpacity: 0 },
});
