import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Auth
export { LoginScreen } from './LoginScreen';
export const OtpVerifyScreen = () => <View style={s.c}><Text>OTP Verify (coming soon)</Text></View>;
export const ProfileSetupScreen = () => <View style={s.c}><Text>Profile Setup (coming soon)</Text></View>;

// Donor
export { DonorHomeScreen } from './donor/DonorHomeScreen';
export { PostListingScreen } from './donor/PostListingScreen';

// Receiver
export { ReceiverMapScreen } from './receiver/ReceiverMapScreen';
export { ReceiverHistoryScreen } from './receiver/ReceiverHistoryScreen';
export { ListingDetailScreen } from './receiver/ListingDetailScreen';
export { ActiveClaimScreen } from './receiver/ActiveClaimScreen';

// Courier
export { JobBoardScreen } from './courier/JobBoardScreen';
export { JobDetailScreen } from './courier/JobDetailScreen';
export { ActiveJobScreen } from './courier/ActiveJobScreen';
export { CourierHistoryScreen } from './courier/CourierHistoryScreen';

// Shared
export const ProfileScreen = () => <View style={s.c}><Text>Profile (coming soon)</Text></View>;
export { ChatScreen } from './chat/ChatScreen';
export { NotificationsScreen } from './notifications/NotificationsScreen';

const s = StyleSheet.create({ c: { flex: 1, justifyContent: 'center', alignItems: 'center' } });
