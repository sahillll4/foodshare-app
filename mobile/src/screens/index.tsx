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

// Courier (Phase 4 - placeholders)
export const JobBoardScreen = () => <View style={s.c}><Text>Courier Job Board (Phase 4)</Text></View>;
export const ActiveJobScreen = () => <View style={s.c}><Text>Courier Active Job (Phase 4)</Text></View>;

// Shared
export const ProfileScreen = () => <View style={s.c}><Text>Profile (coming soon)</Text></View>;
export const ChatScreen = () => <View style={s.c}><Text>Chat (Phase 5)</Text></View>;

const s = StyleSheet.create({ c: { flex: 1, justifyContent: 'center', alignItems: 'center' } });
