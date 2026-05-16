import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Linking
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Navigation, MessageCircle, CheckCircle, Clock, MapPin } from 'lucide-react-native';
import { AppStackParamList } from '../../navigation/types';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../api';

type Props = NativeStackScreenProps<AppStackParamList, 'ActiveClaim'>;

interface ClaimDetail {
  id: string;
  status: 'active' | 'completed' | 'cancelled';
  expiresAt: string;
  listing: {
    id: string;
    title: string;
    addressText: string;
    latitude: number;
    longitude: number;
    donor: {
      id: string;
      name: string | null;
      phone: string;
    };
  };
}

export const ActiveClaimScreen = ({ route }: Props) => {
  const { claimId, listingId } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [claim, setClaim] = useState<ClaimDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollecting, setIsCollecting] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const fetchClaim = async () => {
      try {
        const response = await api.get(`/claims/${claimId}`);
        setClaim(response.data.claim);
      } catch (error) {
        console.error('Failed to fetch claim:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClaim();
  }, [claimId]);

  // Countdown timer to expires_at
  useEffect(() => {
    if (!claim) return;
    const tick = () => {
      const end = new Date(claim.expiresAt).getTime();
      const diff = end - Date.now();
      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('Expired');
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [claim]);

  const handleNavigate = () => {
    if (!claim) return;
    const { latitude, longitude, addressText } = claim.listing;
    const url = `https://maps.google.com/?q=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const handleCollected = async () => {
    Alert.alert(
      'Mark as Collected?',
      'Only do this after you have physically received the food.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: "Yes, I've got it!",
          onPress: async () => {
            setIsCollecting(true);
            try {
              await api.patch(`/claims/${claimId}/collected`);
              Alert.alert(
                '✅ Collected!',
                'Thank you! You made a difference today.',
                [{ text: 'Done', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to mark as collected. Please try again.');
            } finally {
              setIsCollecting(false);
            }
          }
        }
      ]
    );
  };

  const handleCancelClaim = async () => {
    Alert.alert(
      'Cancel Claim?',
      'This will release the food for others to claim.',
      [
        { text: 'Keep Claim', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/listings/${listingId}/claim`);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel claim.');
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!claim) {
    return (
      <View style={styles.centered}>
        <Text style={typography.body}>Claim not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <Text style={styles.foodTitle}>{claim.listing.title}</Text>
        <View style={styles.timerRow}>
          <Clock size={18} color={isExpired ? colors.error : colors.primary} />
          <Text style={[styles.timerText, isExpired && styles.timerExpired]}>
            {isExpired ? 'Claim Expired' : `Expires in ${timeLeft}`}
          </Text>
        </View>
      </View>

      {/* Step Instructions */}
      <View style={styles.stepsCard}>
        <Text style={styles.stepsTitle}>What to do now</Text>

        <View style={styles.step}>
          <View style={[styles.stepCircle, styles.stepActive]}>
            <Text style={styles.stepNum}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepText}>Go to the pickup location</Text>
            <Text style={styles.stepSub}>{claim.listing.addressText}</Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={styles.stepCircle}>
            <Text style={styles.stepNum}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepText}>Collect the food from the donor</Text>
            <Text style={styles.stepSub}>Donor: {claim.listing.donor.name ?? 'Anonymous'}</Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={styles.stepCircle}>
            <Text style={styles.stepNum}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepText}>Tap "I've Collected It" below</Text>
            <Text style={styles.stepSub}>Confirm once you have the food in hand</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.navButton} onPress={handleNavigate}>
          <Navigation size={20} color={colors.surface} />
          <Text style={styles.navButtonText}>Navigate</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => navigation.navigate('Chat', { listingId, title: claim.listing.title })}
        >
          <MessageCircle size={20} color={colors.primary} />
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.collectButton, (isCollecting || isExpired) && styles.collectButtonDisabled]}
        onPress={handleCollected}
        disabled={isCollecting || isExpired}
      >
        {isCollecting
          ? <ActivityIndicator color={colors.surface} />
          : <>
              <CheckCircle size={22} color={colors.surface} />
              <Text style={styles.collectButtonText}>I've Collected the Food</Text>
            </>
        }
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={handleCancelClaim}>
        <Text style={styles.cancelText}>Cancel Claim</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.l },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.l,
    marginBottom: spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  foodTitle: { ...typography.heading, marginBottom: spacing.s },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s },
  timerText: { ...typography.subhead, color: colors.primary },
  timerExpired: { color: colors.error },
  stepsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.l,
    marginBottom: spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  stepsTitle: { ...typography.subhead, marginBottom: spacing.l },
  step: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.m, gap: spacing.m },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  stepActive: { backgroundColor: colors.primary },
  stepNum: { color: colors.surface, fontWeight: '700', fontSize: 14 },
  stepContent: { flex: 1 },
  stepText: { ...typography.body, fontWeight: '600' },
  stepSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.m, marginBottom: spacing.m },
  navButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: spacing.m, gap: spacing.s,
  },
  navButtonText: { color: colors.surface, fontWeight: '700', fontSize: 16 },
  chatButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.primary,
    paddingVertical: spacing.m, gap: spacing.s,
  },
  chatButtonText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  collectButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.success, borderRadius: 12,
    paddingVertical: spacing.l, gap: spacing.s, marginBottom: spacing.m,
  },
  collectButtonDisabled: { opacity: 0.5 },
  collectButtonText: { color: colors.surface, fontSize: 18, fontWeight: '700' },
  cancelButton: { alignItems: 'center', paddingVertical: spacing.m },
  cancelText: { color: colors.error, fontWeight: '600', fontSize: 14 },
});
