import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const LoginScreen = () => <View style={styles.container}><Text>Login Screen</Text></View>;
export const OtpVerifyScreen = () => <View style={styles.container}><Text>OTP Verify Screen</Text></View>;
export const ProfileSetupScreen = () => <View style={styles.container}><Text>Profile Setup Screen</Text></View>;

export const DonorHomeScreen = () => <View style={styles.container}><Text>Donor Home</Text></View>;
export const PostListingScreen = () => <View style={styles.container}><Text>Post Listing</Text></View>;

export const ReceiverMapScreen = () => <View style={styles.container}><Text>Receiver Map</Text></View>;
export const ReceiverHistoryScreen = () => <View style={styles.container}><Text>Receiver History</Text></View>;

export const JobBoardScreen = () => <View style={styles.container}><Text>Courier Job Board</Text></View>;
export const ActiveJobScreen = () => <View style={styles.container}><Text>Courier Active Job</Text></View>;

export const ProfileScreen = () => <View style={styles.container}><Text>Shared Profile Screen</Text></View>;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
