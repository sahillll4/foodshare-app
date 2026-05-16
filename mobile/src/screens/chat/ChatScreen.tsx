import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import { GiftedChat, IMessage, Bubble, Send, InputToolbar } from 'react-native-gifted-chat';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Send as SendIcon } from 'lucide-react-native';
import { AppStackParamList } from '../../navigation/types';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { connectSocket, joinListingRoom, leaveListingRoom, getSocket } from '../../lib/socket';

type Props = NativeStackScreenProps<AppStackParamList, 'Chat'>;

interface RawMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

const toGiftedMessage = (raw: RawMessage): IMessage => ({
  _id: raw.id,
  text: raw.content,
  createdAt: new Date(raw.createdAt),
  user: {
    _id: raw.sender.id,
    name: raw.sender.name ?? 'Anonymous',
    avatar: raw.sender.avatarUrl ?? undefined,
  },
});

export const ChatScreen = ({ route }: Props) => {
  const { listingId } = route.params;
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load message history
  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get(`/messages/${listingId}`);
        const history: RawMessage[] = response.data.messages ?? [];
        setMessages(history.map(toGiftedMessage).reverse()); // GiftedChat expects newest first
      } catch (error) {
        console.error('[Chat] Failed to load history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [listingId]);

  // Connect socket and join room
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
      // Don't add our own messages twice (we append optimistically on send)
      if (payload.senderId === user?.id) return;

      const incoming: IMessage = {
        _id: payload._id ?? Math.random().toString(),
        text: payload.content,
        createdAt: payload.createdAt ? new Date(payload.createdAt) : new Date(),
        user: { _id: payload.senderId, name: payload.senderName },
      };
      setMessages((prev) => GiftedChat.append(prev, [incoming]));
    };

    sock.on('message:new', handleNewMessage);

    return () => {
      sock.off('message:new', handleNewMessage);
      leaveListingRoom(listingId);
    };
  }, [listingId, user?.id]);

  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    const msg = newMessages[0];
    if (!msg || !user) return;

    // Optimistic append
    setMessages((prev) => GiftedChat.append(prev, newMessages));

    try {
      // Persist to DB
      await api.post(`/messages/${listingId}`, {
        content: msg.text,
        receiverId: 'broadcast', // Server handles delivery to all room participants
      });

      // Broadcast via socket
      getSocket().emit('message:send', {
        listingId,
        content: msg.text,
        senderId: user.id,
        senderName: user.name ?? 'User',
        receiverId: 'broadcast',
        _id: msg._id,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Chat] Failed to send message:', error);
    }
  }, [listingId, user]);

  if (isLoading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (!user) return null;

  return (
    <View style={styles.container}>
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{ _id: user.id, name: user.name ?? 'You' }}
        renderBubble={(props) => (
          <Bubble
            {...props}
            wrapperStyle={{
              right: { backgroundColor: colors.primary },
              left: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
            }}
            textStyle={{
              right: { color: colors.surface },
              left: { color: colors.textPrimary },
            }}
          />
        )}
        renderSend={(props) => (
          <Send {...props} containerStyle={styles.sendContainer}>
            <View style={styles.sendButton}>
              <SendIcon size={20} color={colors.surface} />
            </View>
          </Send>
        )}
        renderInputToolbar={(props) => (
          <InputToolbar
            {...props}
            containerStyle={styles.inputToolbar}
            primaryStyle={styles.inputPrimary}
          />
        )}
        listProps={{ keyboardDismissMode: 'interactive' }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messagesContainer: { backgroundColor: colors.background, paddingBottom: 8 },
  sendContainer: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.s },
  sendButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  inputToolbar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
  },
  inputPrimary: {
    alignItems: 'center',
  },
});
