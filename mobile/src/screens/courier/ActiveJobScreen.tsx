import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Linking, ScrollView
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Navigation, CheckCircle, Package, MapPin, MessageCircle } from 'lucide-react-native';
import { AppStackParamList } from '../../navigation/types';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../api';

type Props = NativeStackScreenProps<AppStackParamList, 'ActiveJob'>;

type JobStatus = 'accepted' | 'picked_up' | 'delivered';

interface ActiveJobDetail {
  id: string;
  status: JobStatus;
  listing: {
    id: string;
    title: string;
    quantityNum: number;
    quantityText: string;
    addressText: string;
    latitude: number;
    longitude: number;
  };
  donor: { id: string; name: string | null; phone: string };
  receiver: { id: string; name: string | null; phone: string } | null;
  receiverAddress?: string;
  receiverLatitude?: number;
  receiverLongitude?: number;
}

export const ActiveJobScreen = ({ route }: Props) => {
  const { jobId } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [job, setJob] = useState<ActiveJobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchJob = async () => {
    try {
      const response = await api.get(`/courier/jobs/${jobId}`);
      setJob(response.data.job);
    } catch (error) {
      console.error('Failed to fetch active job:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchJob(); }, [jobId]);

  const openMaps = (lat: number, lng: number, label: string) => {
    const url = `https://maps.google.com/?q=${lat},${lng}&label=${encodeURIComponent(label)}`;
    Linking.openURL(url);
  };

  const handleMarkPickedUp = async () => {
    setIsUpdating(true);
    try {
      await api.patch(`/courier/jobs/${jobId}/picked-up`);
      await fetchJob(); // refresh status
      Alert.alert('✅ Food Picked Up!', 'Now head to the receiver to deliver.');
    } catch {
      Alert.alert('Error', 'Failed to update status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkDelivered = async () => {
    Alert.alert(
      'Confirm Delivery',
      'Only tap this once you have handed the food to the receiver.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Delivered',
          onPress: async () => {
            setIsUpdating(true);
            try {
              const response = await api.patch(`/courier/jobs/${jobId}/delivered`);
              const points = response.data.pointsAwarded ?? 0;
              Alert.alert(
                '🎉 Delivery Complete!',
                `You earned ${points} impact points! Great work.`,
                [{ text: 'Done', onPress: () => {
                  navigation.goBack();
                  setTimeout(() => {
                    if (!job) return;
                    navigation.navigate('RatingModal', {
                      listingId: job.listing.id,
                      ratedUserId: job.donor.id,
                      ratedUserName: job.donor.name ?? 'Donor',
                      roleTitle: 'Donor',
                    });
                  }, 500);
                }}]
              );
            } catch {
              Alert.alert('Error', 'Failed to mark as delivered.');
            } finally {
              setIsUpdating(false);
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (!job) {
    return <View style={styles.centered}><Text style={typography.body}>Job not found.</Text></View>;
  }

  const steps = [
    {
      id: 'accepted',
      label: 'Navigate to Donor',
      sub: job.donor.name ?? 'Donor',
      address: job.listing.addressText,
      lat: job.listing.latitude,
      lng: job.listing.longitude,
      done: job.status !== 'accepted',
      active: job.status === 'accepted',
    },
    {
      id: 'picked_up',
      label: 'Pick Up Food',
      sub: `${job.listing.quantityNum} ${job.listing.quantityText}`,
      address: job.listing.addressText,
      lat: job.listing.latitude,
      lng: job.listing.longitude,
      done: job.status === 'delivered',
      active: job.status === 'accepted',
    },
    {
      id: 'navigate_receiver',
      label: 'Navigate to Receiver',
      sub: job.receiver?.name ?? 'Receiver',
      address: job.receiverAddress ?? 'Receiver location',
      lat: job.receiverLatitude ?? job.listing.latitude,
      lng: job.receiverLongitude ?? job.listing.longitude,
      done: job.status === 'delivered',
      active: job.status === 'picked_up',
    },
    {
      id: 'delivered',
      label: 'Deliver Food',
      sub: 'Hand food to receiver',
      address: '',
      lat: 0,
      lng: 0,
      done: job.status === 'delivered',
      active: job.status === 'picked_up',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{job.listing.title}</Text>
        <Text style={styles.headerSub}>
          {job.status === 'accepted' && '📍 Head to donor'}
          {job.status === 'picked_up' && '🚚 Food picked up — head to receiver'}
          {job.status === 'delivered' && '✅ Delivered!'}
        </Text>
      </View>

      <View style={styles.stepsContainer}>
        {steps.map((step, i) => (
          <View key={step.id + i} style={styles.stepRow}>
            {/* Connector line */}
            <View style={styles.stepLeft}>
              <View style={[
                styles.stepDot,
                step.done && styles.stepDotDone,
                step.active && styles.stepDotActive,
              ]}>
                {step.done
                  ? <CheckCircle size={16} color={colors.surface} />
                  : <Text style={styles.stepDotNum}>{i + 1}</Text>
                }
              </View>
              {i < steps.length - 1 && (
                <View style={[styles.connector, step.done && styles.connectorDone]} />
              )}
            </View>

            <View style={[styles.stepCard, step.active && styles.stepCardActive]}>
              <Text style={[styles.stepLabel, step.done && styles.stepLabelDone]}>{step.label}</Text>
              <Text style={styles.stepSub}>{step.sub}</Text>
              {step.address ? <Text style={styles.stepAddress}>{step.address}</Text> : null}
              {step.active && step.lat !== 0 && (
                <TouchableOpacity
                  style={styles.navigateBtn}
                  onPress={() => openMaps(step.lat, step.lng, step.label)}
                >
                  <Navigation size={16} color={colors.surface} />
                  <Text style={styles.navigateBtnText}>Open in Maps</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Chat Buttons */}
      <View style={{ flexDirection: 'row', gap: spacing.m, paddingHorizontal: spacing.l, marginBottom: spacing.l }}>
        <TouchableOpacity 
          style={styles.chatButton}
          onPress={() => navigation.navigate('Chat', { listingId: job.listing.id, title: job.donor.name || 'Donor' })}
        >
          <MessageCircle size={20} color={colors.primary} />
          <Text style={styles.chatButtonText}>Chat with Donor</Text>
        </TouchableOpacity>
        {job.receiver && (
          <TouchableOpacity 
            style={styles.chatButton}
            onPress={() => navigation.navigate('Chat', { listingId: job.listing.id, title: job.receiver?.name || 'Receiver' })}
          >
            <MessageCircle size={20} color={colors.primary} />
            <Text style={styles.chatButtonText}>Chat with Receiver</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Primary CTA */}
      <View style={styles.ctaContainer}>
        {job.status === 'accepted' && (
          <TouchableOpacity
            style={[styles.ctaButton, styles.pickupButton, isUpdating && styles.disabled]}
            onPress={handleMarkPickedUp}
            disabled={isUpdating}
          >
            {isUpdating
              ? <ActivityIndicator color={colors.surface} />
              : <>
                  <Package size={22} color={colors.surface} />
                  <Text style={styles.ctaText}>I've Picked Up the Food</Text>
                </>
            }
          </TouchableOpacity>
        )}

        {job.status === 'picked_up' && (
          <TouchableOpacity
            style={[styles.ctaButton, styles.deliverButton, isUpdating && styles.disabled]}
            onPress={handleMarkDelivered}
            disabled={isUpdating}
          >
            {isUpdating
              ? <ActivityIndicator color={colors.surface} />
              : <>
                  <CheckCircle size={22} color={colors.surface} />
                  <Text style={styles.ctaText}>Confirm Delivery</Text>
                </>
            }
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    gap: spacing.xs,
  },
  headerTitle: { ...typography.heading, color: colors.surface },
  headerSub: { ...typography.body, color: 'rgba(255,255,255,0.8)' },
  stepsContainer: { padding: spacing.l },
  stepRow: { flexDirection: 'row', gap: spacing.m },
  stepLeft: { alignItems: 'center', width: 32 },
  stepDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  stepDotActive: { backgroundColor: colors.primary },
  stepDotDone: { backgroundColor: colors.success },
  stepDotNum: { color: colors.textSecondary, fontWeight: '700', fontSize: 13 },
  connector: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 4 },
  connectorDone: { backgroundColor: colors.success },
  stepCard: {
    flex: 1, backgroundColor: colors.surface,
    borderRadius: 12, padding: spacing.m, marginBottom: spacing.m,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  stepCardActive: { borderWidth: 1.5, borderColor: colors.primary },
  stepLabel: { ...typography.subhead, fontSize: 15 },
  stepLabelDone: { color: colors.textSecondary },
  stepSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  stepAddress: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  navigateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primary, borderRadius: 8,
    paddingHorizontal: spacing.m, paddingVertical: spacing.s,
    marginTop: spacing.s, alignSelf: 'flex-start',
  },
  navigateBtnText: { color: colors.surface, fontWeight: '600', fontSize: 13 },
  ctaContainer: { padding: spacing.l, paddingTop: 0 },
  ctaButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, paddingVertical: spacing.l, gap: spacing.s, marginBottom: spacing.l,
  },
  pickupButton: { backgroundColor: colors.accent },
  deliverButton: { backgroundColor: colors.success },
  disabled: { opacity: 0.6 },
  ctaText: { color: colors.surface, fontSize: 18, fontWeight: '700' },
  chatButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.primary,
    paddingVertical: spacing.m, gap: spacing.s,
  },
  chatButtonText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
