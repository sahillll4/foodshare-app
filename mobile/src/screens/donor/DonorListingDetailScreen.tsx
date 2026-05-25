import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, StatusBar } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Clock, Package, MessageCircle, AlertTriangle } from 'lucide-react-native';
import { AppStackParamList } from '../../navigation/types';
import { colors, typography, spacing, radius, shadows, gradients, foodTypeConfig, statusConfig } from '../../theme';
import { api } from '../../api';

type Props = NativeStackScreenProps<AppStackParamList, 'DonorListingDetail'>;

interface DonorListingDetail {
  id: string;
  title: string;
  description: string | null;
  foodType: 'veg' | 'non_veg' | 'both';
  quantityNum: number;
  quantityText: string;
  photoUrl: string | null;
  status: string;
  addressText: string;
  pickupEnd: string;
  claims: {
    id: string;
    status: string;
    receiver: { id: string; name: string; phone: string };
    courierJob: {
      status: string;
      courier: { id: string; name: string; phone: string } | null;
    } | null;
  }[];
}

export const DonorListingDetailScreen = ({ route, navigation }: Props) => {
  const { listingId } = route.params;
  const [listing, setListing] = useState<DonorListingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await api.get(`/listings/${listingId}`);
        setListing(response.data.listing);
      } catch (error) {
        console.error('Failed to fetch donor listing detail:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [listingId]);

  if (isLoading || !listing) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const activeClaim = listing.claims.find(c => c.status !== 'cancelled');
  const foodType = foodTypeConfig[listing.foodType] || foodTypeConfig.veg;
  const statConfig = statusConfig[listing.status as keyof typeof statusConfig] || statusConfig.live;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        
        {/* Hero */}
        <View style={styles.heroContainer}>
          {listing.photoUrl ? (
            <Image source={{ uri: listing.photoUrl }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.placeholderHero]}>
              <Text style={{ fontSize: 64 }}>{foodType.emoji}</Text>
            </View>
          )}
          <LinearGradient colors={gradients.imageOverlay} style={styles.heroOverlay}>
            <View style={[styles.statusBadge, { backgroundColor: statConfig.color }]}>
              <Text style={styles.statusText}>{statConfig.label}</Text>
            </View>
            <Text style={styles.heroTitle}>{listing.title}</Text>
          </LinearGradient>
        </View>

        <View style={styles.body}>
          {/* Status Info */}
          {activeClaim && (
            <View style={styles.claimCard}>
              <Text style={styles.sectionTitle}>Claim Details</Text>
              <Text style={styles.bodyText}>Claimed by: {activeClaim.receiver.name}</Text>
              
              {activeClaim.courierJob ? (
                <View style={styles.courierBox}>
                  <Text style={styles.bodyText}>
                    Courier Status: <Text style={{ fontWeight: 'bold' }}>{activeClaim.courierJob.status}</Text>
                  </Text>
                  {activeClaim.courierJob.courier && (
                    <Text style={styles.bodyText}>Courier Name: {activeClaim.courierJob.courier.name}</Text>
                  )}
                </View>
              ) : (
                <Text style={styles.bodyText}>Pickup Method: Receiver self-pickup</Text>
              )}

              {/* Chat Button */}
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => navigation.navigate('Chat', { listingId, title: listing.title })}
              >
                <MessageCircle size={20} color={colors.surface} />
                <Text style={styles.chatButtonText}>Chat with Receiver</Text>
              </TouchableOpacity>
            </View>
          )}

          {!activeClaim && (
             <View style={styles.claimCard}>
               <Text style={styles.bodyText}>This food has not been claimed yet.</Text>
             </View>
          )}

          {/* Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailRow}>
              <Package size={20} color={colors.textSecondary} />
              <Text style={styles.detailText}>{listing.quantityNum} {listing.quantityText}</Text>
            </View>
            <View style={styles.detailRow}>
              <Clock size={20} color={colors.textSecondary} />
              <Text style={styles.detailText}>Expires at {new Date(listing.pickupEnd).toLocaleTimeString()}</Text>
            </View>
            <View style={styles.detailRow}>
              <MapPin size={20} color={colors.textSecondary} />
              <Text style={styles.detailText}>{listing.addressText}</Text>
            </View>
          </View>

          {listing.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.bodyText}>{listing.description}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  
  heroContainer: { height: 240, width: '100%', position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  placeholderHero: { backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.l, paddingTop: 40 },
  heroTitle: { ...typography.display, color: '#FFF' },
  
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.full, marginBottom: spacing.s },
  statusText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#FFF', textTransform: 'uppercase' },

  body: { padding: spacing.l },
  section: { marginBottom: spacing.l },
  sectionTitle: { ...typography.subhead, marginBottom: spacing.sm },
  bodyText: { ...typography.body, color: colors.textSecondary },
  
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  detailText: { ...typography.body, marginLeft: spacing.m },

  claimCard: { backgroundColor: colors.surface, padding: spacing.m, borderRadius: radius.md, marginBottom: spacing.l, ...shadows.sm },
  courierBox: { marginTop: spacing.sm, padding: spacing.sm, backgroundColor: colors.background, borderRadius: radius.sm },
  
  chatButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, padding: spacing.m, borderRadius: radius.md, marginTop: spacing.m },
  chatButtonText: { color: colors.surface, fontFamily: 'Inter_600SemiBold', marginLeft: spacing.s },
});
