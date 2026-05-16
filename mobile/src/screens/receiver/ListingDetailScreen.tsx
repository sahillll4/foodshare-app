import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert
} from 'react-native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { MapPin, Clock, Package, Star, Snowflake, MessageCircle } from 'lucide-react-native';
import { AppStackParamList } from '../../navigation/types';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../api';
import { useAuthStore } from '../../store/authStore';
import type { Listing } from './ReceiverMapScreen';

type Props = NativeStackScreenProps<AppStackParamList, 'ListingDetail'>;

export const ListingDetailScreen = ({ route }: Props) => {
  const { listingId } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const user = useAuthStore((s) => s.user);

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await api.get(`/listings/${listingId}`);
        setListing(response.data.listing);
      } catch (error) {
        console.error('Failed to fetch listing:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchListing();
  }, [listingId]);

  // Countdown timer
  useEffect(() => {
    if (!listing) return;
    const tick = () => {
      const end = new Date(listing.pickupEnd).getTime();
      const diff = Math.max(0, end - Date.now());
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m ${secs}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [listing]);

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      const response = await api.post(`/listings/${listingId}/claim`);
      Alert.alert(
        '🎉 Food Claimed!',
        `You have 30 minutes to pick it up. Hurry!`,
        [{
          text: 'View Active Claim',
          onPress: () => navigation.navigate('ActiveClaim', {
            claimId: response.data.claim.id,
            listingId,
          }),
        }]
      );
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'This listing was just claimed by someone else. Try another!';
      Alert.alert('Oops! Too slow 😅', msg);
    } finally {
      setIsClaiming(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.centered}>
        <Text style={typography.body}>Listing not found.</Text>
      </View>
    );
  }

  const isExpired = new Date(listing.pickupEnd) < new Date();
  const isUrgent = (new Date(listing.pickupEnd).getTime() - Date.now()) < 30 * 60 * 1000;
  const isDonor = user?.id === listing.donor.id;
  const canClaim = listing.status === 'live' && !isExpired && !isDonor;

  return (
    <ScrollView style={styles.container}>
      {/* Photo */}
      {listing.photoUrl ? (
        <Image source={{ uri: listing.photoUrl }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Package size={48} color={colors.border} />
        </View>
      )}

      <View style={styles.content}>
        {/* Title & urgency */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{listing.title}</Text>
          {listing.requiresColdChain && (
            <View style={styles.coldBadge}>
              <Snowflake size={14} color={colors.primary} />
              <Text style={styles.coldText}>Cold</Text>
            </View>
          )}
        </View>

        {/* Countdown */}
        <View style={[styles.timerBox, isUrgent && styles.timerBoxUrgent]}>
          <Clock size={18} color={isUrgent ? colors.error : colors.primary} />
          <Text style={[styles.timerText, isUrgent && styles.timerTextUrgent]}>
            {isExpired ? 'Expired' : `Pickup ends in ${timeLeft}`}
          </Text>
        </View>

        {/* Food info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Food Info</Text>
          <View style={styles.row}>
            <Package size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              {listing.quantityNum} {listing.quantityText} • {listing.foodType.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Location</Text>
          <View style={styles.row}>
            <MapPin size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{listing.addressText}</Text>
          </View>
        </View>

        {/* Donor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shared by</Text>
          <View style={styles.donorRow}>
            <View style={styles.donorAvatar}>
              <Text style={styles.donorAvatarText}>
                {listing.donor.name?.charAt(0)?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View>
              <Text style={styles.donorName}>{listing.donor.name ?? 'Anonymous Donor'}</Text>
              <View style={styles.row}>
                <Star size={14} color={colors.accent} />
                <Text style={styles.donorRating}>
                  {listing.donor.ratingAvg > 0 ? listing.donor.ratingAvg.toFixed(1) : 'New'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() => navigation.navigate('Chat', { listingId, title: listing.title })}
            >
              <MessageCircle size={18} color={colors.primary} />
              <Text style={styles.chatText}>Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Claim button */}
        {canClaim && (
          <TouchableOpacity
            style={[styles.claimButton, isClaiming && styles.claimButtonDisabled]}
            onPress={handleClaim}
            disabled={isClaiming}
          >
            {isClaiming
              ? <ActivityIndicator color={colors.surface} />
              : <Text style={styles.claimButtonText}>Claim This Food</Text>
            }
          </TouchableOpacity>
        )}

        {listing.status === 'claimed' && (
          <View style={styles.claimedBox}>
            <Text style={styles.claimedText}>This food has already been claimed.</Text>
          </View>
        )}

        {isDonor && (
          <View style={styles.claimedBox}>
            <Text style={styles.claimedText}>This is your own listing.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photo: { width: '100%', height: 240, backgroundColor: colors.border },
  photoPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  content: { padding: spacing.l },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.m },
  title: { ...typography.heading, flex: 1, marginRight: spacing.m },
  coldBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  coldText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  timerBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary + '10', borderRadius: 10, padding: spacing.m, marginBottom: spacing.l, gap: spacing.s },
  timerBoxUrgent: { backgroundColor: colors.error + '10' },
  timerText: { ...typography.subhead, color: colors.primary },
  timerTextUrgent: { color: colors.error },
  section: { marginBottom: spacing.l },
  sectionTitle: { ...typography.subhead, marginBottom: spacing.s },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.s },
  infoText: { ...typography.body, color: colors.textSecondary, flex: 1 },
  donorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.m },
  donorAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  donorAvatarText: { color: colors.surface, fontWeight: '700', fontSize: 18 },
  donorName: { ...typography.subhead, fontSize: 15 },
  donorRating: { ...typography.caption, color: colors.textSecondary, marginLeft: 2 },
  chatButton: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderColor: colors.primary, borderRadius: 8, paddingHorizontal: spacing.m, paddingVertical: spacing.s },
  chatText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  claimButton: { backgroundColor: colors.primary, paddingVertical: spacing.l, borderRadius: 12, alignItems: 'center', marginTop: spacing.l },
  claimButtonDisabled: { opacity: 0.7 },
  claimButtonText: { color: colors.surface, fontSize: 18, fontWeight: '700' },
  claimedBox: { backgroundColor: colors.border, padding: spacing.m, borderRadius: 10, marginTop: spacing.l, alignItems: 'center' },
  claimedText: { color: colors.textSecondary, fontWeight: '600' },
});
