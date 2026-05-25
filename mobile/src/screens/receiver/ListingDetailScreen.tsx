import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, StatusBar, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Clock, Package, Snowflake, AlertTriangle, ShieldCheck } from 'lucide-react-native';
import { AppStackParamList } from '../../navigation/types';
import { colors, typography, spacing, radius, shadows, gradients, foodTypeConfig } from '../../theme';
import { api } from '../../api';

type Props = NativeStackScreenProps<AppStackParamList, 'ListingDetail'>;
const { width } = Dimensions.get('window');

interface ListingDetail {
  id: string;
  title: string;
  description: string | null;
  foodType: 'veg' | 'non_veg' | 'both';
  quantityNum: number;
  quantityText: string;
  photoUrl: string | null;
  status: string;
  addressText: string;
  latitude: number;
  longitude: number;
  pickupStart: string;
  pickupEnd: string;
  allergenNotes: string | null;
  packagingNotes: string | null;
  requiresColdChain: boolean;
  donor: { id: string; name: string | null; ratingAvg: number };
}

export const ListingDetailScreen = ({ route, navigation }: Props) => {
  const { listingId } = route.params;
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await api.get(`/listings/${listingId}`);
        setListing(response.data.listing);
      } catch (error) {
        console.error('Failed to fetch listing detail:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [listingId]);

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      const response = await api.post(`/listings/${listingId}/claim`);
      navigation.replace('ActiveClaim', { claimId: response.data.claim.id, listingId });
    } catch (error: any) {
      console.error('Claim error:', error);
      alert(error.response?.data?.error || 'Failed to claim');
    } finally {
      setIsClaiming(false);
    }
  };

  if (isLoading || !listing) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const foodType = foodTypeConfig[listing.foodType] || foodTypeConfig.veg;
  const minsLeft = Math.max(0, Math.floor((new Date(listing.pickupEnd).getTime() - Date.now()) / 60000));
  const isAvailable = listing.status === 'live' && minsLeft > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        
        {/* Hero Image Section */}
        <View style={styles.heroContainer}>
          {listing.photoUrl ? (
            <Image source={{ uri: listing.photoUrl }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.placeholderHero]}>
              <Text style={{ fontSize: 64 }}>{foodType.emoji}</Text>
            </View>
          )}
          
          <LinearGradient colors={gradients.imageOverlay} style={styles.heroOverlay}>
            <View style={styles.heroChips}>
              <View style={[styles.chip, { backgroundColor: foodType.color }]}>
                <Text style={styles.chipText}>{foodType.label}</Text>
              </View>
              {listing.requiresColdChain && (
                <View style={[styles.chip, { backgroundColor: colors.info }]}>
                  <Snowflake size={12} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={styles.chipText}>Cold Chain</Text>
                </View>
              )}
            </View>
            <Text style={styles.heroTitle}>{listing.title}</Text>
            <Text style={styles.heroDonor}>Donated by {listing.donor.name || 'Anonymous'}</Text>
          </LinearGradient>
        </View>

        {/* Content Section */}
        <View style={styles.body}>
          
          {/* Info Cards Row */}
          <View style={styles.infoRow}>
            <View style={styles.infoCard}>
              <Package size={20} color={colors.primary} />
              <Text style={styles.infoCardVal}>{listing.quantityNum}</Text>
              <Text style={styles.infoCardLabel}>{listing.quantityText}</Text>
            </View>
            <View style={styles.infoCard}>
              <Clock size={20} color={colors.primary} />
              <Text style={styles.infoCardVal}>{minsLeft}</Text>
              <Text style={styles.infoCardLabel}>Mins left</Text>
            </View>
            <View style={styles.infoCard}>
              <ShieldCheck size={20} color={colors.primary} />
              <Text style={styles.infoCardVal}>{listing.donor.ratingAvg.toFixed(1)}</Text>
              <Text style={styles.infoCardLabel}>Rating</Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pickup Location</Text>
            <View style={styles.locationBox}>
              <MapPin size={20} color={colors.textSecondary} />
              <Text style={styles.locationText}>{listing.addressText}</Text>
            </View>
          </View>

          {/* Description */}
          {listing.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{listing.description}</Text>
            </View>
          )}

          {/* Alerts */}
          {(listing.allergenNotes || listing.packagingNotes) && (
            <View style={styles.alertBox}>
              <AlertTriangle size={20} color={colors.warning} />
              <View style={{ flex: 1, marginLeft: spacing.s }}>
                {listing.allergenNotes && (
                  <Text style={styles.alertText}><Text style={{ fontWeight: '700' }}>Allergens:</Text> {listing.allergenNotes}</Text>
                )}
                {listing.packagingNotes && (
                  <Text style={[styles.alertText, listing.allergenNotes ? { marginTop: 4 } : null]}>
                    <Text style={{ fontWeight: '700' }}>Packaging:</Text> {listing.packagingNotes}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Action */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.primaryBtn, (!isAvailable || isClaiming) && styles.btnDisabled]}
          onPress={handleClaim}
          disabled={!isAvailable || isClaiming}
          activeOpacity={0.85}
        >
          <LinearGradient 
            colors={isAvailable ? gradients.hero : [colors.borderStrong, colors.borderStrong]} 
            style={styles.primaryBtnGradient}
          >
            {isClaiming ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {isAvailable ? 'Claim Food Now' : 'No longer available'}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  
  // Hero
  heroContainer: { height: 280, width: '100%', position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  placeholderHero: { backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  heroOverlay: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    padding: spacing.l, paddingTop: 60,
  },
  heroChips: { flexDirection: 'row', gap: spacing.s, marginBottom: spacing.s },
  chip: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingHorizontal: 10, paddingVertical: 4, 
    borderRadius: radius.full 
  },
  chipText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#FFF', textTransform: 'uppercase' },
  heroTitle: { ...typography.display, color: '#FFF' },
  heroDonor: { ...typography.bodyMd, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  // Body
  body: { padding: spacing.l },
  
  // Stats row
  infoRow: { 
    flexDirection: 'row', gap: spacing.m, 
    marginTop: -40, marginBottom: spacing.l,
    zIndex: 2,
  },
  infoCard: { 
    flex: 1, backgroundColor: colors.surface, 
    borderRadius: radius.md, padding: spacing.m, 
    alignItems: 'center',
    ...shadows.md,
  },
  infoCardVal: { ...typography.subhead, marginTop: spacing.xs, marginBottom: 2 },
  infoCardLabel: { ...typography.caption },

  // Sections
  section: { marginBottom: spacing.l },
  sectionTitle: { ...typography.subhead, marginBottom: spacing.sm },
  locationBox: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: colors.surface, padding: spacing.m, 
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border 
  },
  locationText: { ...typography.body, flex: 1, marginLeft: spacing.s },
  descriptionText: { ...typography.body, color: colors.textSecondary, lineHeight: 24 },

  // Alert
  alertBox: { 
    flexDirection: 'row', backgroundColor: colors.warning + '15', 
    padding: spacing.m, borderRadius: radius.md, 
    borderWidth: 1, borderColor: colors.warning + '40',
  },
  alertText: { ...typography.bodyMd, color: '#92400E' },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface,
    padding: spacing.l, paddingBottom: spacing.xl,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  primaryBtn: { borderRadius: radius.md, overflow: 'hidden', ...shadows.glow },
  primaryBtnGradient: { paddingVertical: 16, alignItems: 'center' },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  btnDisabled: { opacity: 0.7, shadowOpacity: 0 },
});
