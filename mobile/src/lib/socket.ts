import { io, Socket } from 'socket.io-client';
import { API_URL } from '../api';
import { useAuthStore } from '../store/authStore';

// Strip /api from API_URL to get the base server URL
const SOCKET_URL = API_URL.replace('/api', '');

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket'],
    });

    socket.on('connect', () => console.log('[Socket] Connected:', socket?.id));
    socket.on('disconnect', () => console.log('[Socket] Disconnected'));
    socket.on('connect_error', (err) => console.error('[Socket] Error:', err.message));
  }
  return socket;
};

export const connectSocket = () => {
  const sock = getSocket();
  if (!sock.connected) {
    sock.connect();
  }

  // Join the user's personal notification room
  const userId = useAuthStore.getState().user?.id;
  if (userId) {
    sock.emit('join:user', { userId });
  }
  return sock;
};

export const disconnectSocket = () => {
  socket?.disconnect();
};

export const joinListingRoom = (listingId: string) => {
  getSocket().emit('join:listing', { listingId });
};

export const leaveListingRoom = (listingId: string) => {
  getSocket().emit('leave:listing', { listingId });
};
