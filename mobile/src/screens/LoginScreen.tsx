import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ScrollView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { colors, typography, spacing, radius, shadows, gradients } from '../theme';
import { useAuthStore } from '../store/authStore';
import { api } from '../api';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;
const { height } = Dimensions.get('window');

export const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit phone number');
      return;
    }
    Alert.alert(
      'Firebase Auth Required',
      'Firebase is not yet configured. Use the dev bypass below to test the app.',
      [{ text: 'OK' }]
    );
  };

  const handleDevBypass = async (role: string) => {
    setIsLoading(true);
    setLoadingRole(role);
    const phoneMap: Record<string, string> = {
      donor:    '+9112345000001',
      receiver: '+9112345000002',
      courier:  '+9112345000003',
    };
    try {
      const response = await api.post('/auth/dev-login', { phone: phoneMap[role], role });
      await setAuth(response.data.token, response.data.user);
    } catch {
      Alert.alert('Connection Error', 'Dev login failed. Make sure the backend is running on port 3000.');
    } finally {
      setIsLoading(false);
      setLoadingRole(null);
    }
  };

  const devRoles = [
    { role: 'donor',    emoji: '🍽️', label: 'Donor',    color: colors.primary },
    { role: 'receiver', emoji: '🤝', label: 'Receiver',  color: colors.secondary },
    { role: 'courier',  emoji: '🚗', label: 'Courier',   color: colors.info },
  ];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Gradient hero */}
      <LinearGradient colors={gradients.hero} style={styles.hero}>
        <View style={styles.heroContent}>
          <View style={styles.logoRing}>
            <Text style={styles.logoEmoji}>🍽️</Text>
          </View>
          <Text style={styles.appName}>FoodShare</Text>
          <Text style={styles.tagline}>Feed someone. Waste less. Today.</Text>
        </View>

        {/* Decorative circles */}
        <View style={[styles.decCircle, { top: -40, right: -40, width: 160, height: 160, opacity: 0.12 }]} />
        <View style={[styles.decCircle, { bottom: 20, left: -60, width: 200, height: 200, opacity: 0.08 }]} />
      </LinearGradient>

      {/* Card */}
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>Enter your mobile number to continue</Text>

          {/* Phone input */}
          <View style={styles.inputRow}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="98765 43210"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={10}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
            onPress={handleSendOtp}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <LinearGradient colors={gradients.hero} style={styles.primaryBtnGradient}>
              <Text style={styles.primaryBtnText}>Send OTP →</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>

        {/* Dev bypass */}
        {__DEV__ && (
          <View style={styles.devSection}>
            <View style={styles.devDivider}>
              <View style={styles.devLine} />
              <Text style={styles.devDividerText}>🛠  DEV TESTING</Text>
              <View style={styles.devLine} />
            </View>
            <Text style={styles.devHint}>Tap a role to skip Firebase auth</Text>
            <View style={styles.devPills}>
              {devRoles.map(({ role, emoji, label, color }) => (
                <TouchableOpacity
                  key={role}
                  style={[styles.devPill, { borderColor: color }, loadingRole === role && { backgroundColor: color + '20' }]}
                  onPress={() => handleDevBypass(role)}
                  disabled={isLoading}
                  activeOpacity={0.75}
                >
                  <Text style={styles.devPillEmoji}>{emoji}</Text>
                  <Text style={[styles.devPillText, { color }]}>
                    {loadingRole === role ? '...' : label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Hero
  hero: {
    height: height * 0.38,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  heroContent: { padding: spacing.l, paddingBottom: spacing.xl, alignItems: 'center' },
  logoRing: {
    width: 80, height: 80, borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.m,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
  },
  logoEmoji: { fontSize: 38 },
  appName: { fontSize: 30, fontFamily: 'Inter_700Bold', color: '#FFFFFF', letterSpacing: -0.5 },
  tagline: { fontSize: 14, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.8)', marginTop: spacing.xs },
  decCircle: { position: 'absolute', borderRadius: radius.full, backgroundColor: '#FFFFFF' },

  // Scroll
  scrollContent: { paddingBottom: spacing.xxl },

  // Card
  card: {
    margin: spacing.l,
    marginTop: -spacing.l,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.l,
    ...shadows.lg,
  },
  cardTitle: { ...typography.heading, marginBottom: spacing.xs },
  cardSubtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.l },

  // Input
  inputRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.m,
  },
  countryCode: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surface,
  },
  countryCodeText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  input: {
    flex: 1,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: colors.textPrimary,
    letterSpacing: 1,
  },

  // Primary button
  primaryBtn: { borderRadius: radius.md, overflow: 'hidden', ...shadows.glow, marginBottom: spacing.m },
  primaryBtnGradient: { paddingVertical: spacing.m + 2, alignItems: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  btnDisabled: { opacity: 0.6 },
  terms: { ...typography.caption, textAlign: 'center', color: colors.textSecondary, lineHeight: 18 },

  // Dev section
  devSection: { marginHorizontal: spacing.l, marginTop: spacing.m },
  devDivider: { flexDirection: 'row', alignItems: 'center', gap: spacing.s, marginBottom: spacing.s },
  devLine: { flex: 1, height: 1, backgroundColor: colors.border },
  devDividerText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary },
  devHint: { ...typography.caption, textAlign: 'center', marginBottom: spacing.m, color: colors.textSecondary },
  devPills: { flexDirection: 'row', gap: spacing.s, justifyContent: 'center' },
  devPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.xs, paddingVertical: spacing.sm, paddingHorizontal: spacing.s,
    borderRadius: radius.md, borderWidth: 1.5,
    backgroundColor: colors.surface, ...shadows.sm,
  },
  devPillEmoji: { fontSize: 16 },
  devPillText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});
