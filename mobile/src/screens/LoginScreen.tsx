import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { AuthStackParamList } from '../navigation/types';
import { colors, typography, spacing } from '../theme';
import { useAuthStore } from '../store/authStore';
import { api } from '../api';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      Alert.alert('Invalid', 'Please enter a valid phone number');
      return;
    }
    
    // Normally we'd call Firebase here. For now, just navigate to OTP screen.
    // navigation.navigate('OtpVerify', { phone, verificationId: 'mock-id' });
    Alert.alert('Firebase Auth Required', 'Firebase is not yet configured. Please use the Dev Bypass button to test the app.');
  };

  const handleDevBypass = async (role: string) => {
    setIsLoading(true);
    try {
      // Calls the /dev-login endpoint we just added to the backend
      const response = await api.post('/auth/dev-login', { phone: role === 'donor' ? '+1234567890' : '+0987654321', role });
      await setAuth(response.data.token, response.data.user);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Dev login failed. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to FoodShare</Text>
        <Text style={styles.subtitle}>Enter your phone number to continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Phone Number (e.g. 9876543210)"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          maxLength={15}
        />

        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSendOtp}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>{isLoading ? 'Please wait...' : 'Send OTP'}</Text>
        </TouchableOpacity>

        {__DEV__ && (
          <View style={styles.devContainer}>
            <Text style={styles.devLabel}>🛠 DEV TESTING</Text>
            <View style={styles.devRow}>
              <TouchableOpacity 
                style={[styles.button, styles.devButton]}
                onPress={() => handleDevBypass('donor')}
                disabled={isLoading}
              >
                <Text style={styles.devButtonText}>Login Donor</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.devButton]}
                onPress={() => handleDevBypass('receiver')}
                disabled={isLoading}
              >
                <Text style={styles.devButtonText}>Login Receiver</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.l,
    justifyContent: 'center',
  },
  title: {
    ...typography.heading,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.m,
    fontSize: 16,
    marginBottom: spacing.l,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.m,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  devContainer: {
    marginTop: spacing.xxl,
    alignItems: 'center',
  },
  devLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.s,
    fontWeight: '700',
  },
  devRow: {
    flexDirection: 'row',
    gap: spacing.m,
    width: '100%',
  },
  devButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  devButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
