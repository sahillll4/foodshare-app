import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { MapPin, Package, Clock, Snowflake, Truck, User } from 'lucide-react-native';
import { AppStackParamList } from '../../navigation/types';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../api';
import type { CourierJob } from './JobBoardScreen';

type Props = NativeStackScreenProps<AppStackParamList, 'JobDetail'>;

export const JobDetailScreen = ({ route }: Props) => {
  const { jobId } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [job, setJob] = useState<CourierJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get(`/courier/jobs/${jobId}`);
        setJob(response.data.job);
      } catch (error) {
        console.error('Failed to fetch job:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJob();
  }, [jobId]);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await api.post(`/courier/jobs/${jobId}/accept`);
      Alert.alert(
        '✅ Job Accepted!',
        'Head to the donor location to pick up the food.',
        [{
          text: "Let's Go!",
          onPress: () => navigation.replace('ActiveJob', { jobId }),
        }]
      );
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'This job was just taken by another courier.';
      Alert.alert('Job Unavailable', msg);
      navigation.goBack();
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (!job) {
    return <View style={styles.centered}><Text style={typography.body}>Job not found.</Text></View>;
  }

  const minsLeft = Math.max(0, Math.floor((new Date(job.listing.pickupEnd).getTime() - Date.now()) / 60000));
  const isUrgent = minsLeft < 30;

  return (
    <ScrollView style={styles.container}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Truck size={36} color={colors.surface} />
        </View>
        <Text style={styles.heroTitle}>{job.listing.title}</Text>
        <Text style={styles.heroSub}>{job.listing.quantityNum} {job.listing.quantityText} • {job.listing.foodType.toUpperCase()}</Text>
        {isUrgent && (
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentText}>⚡ URGENT — {minsLeft}m left</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        {/* Info Cards */}
        <InfoRow icon={<MapPin size={18} color={colors.primary} />} label="Pickup Location" value={job.listing.addressText} />
        <InfoRow icon={<Clock size={18} color={colors.primary} />} label="Pickup Deadline" value={new Date(job.listing.pickupEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
        <InfoRow icon={<User size={18} color={colors.primary} />} label="Donor" value={job.donor.name ?? 'Anonymous Donor'} />
        {job.receiver && (
          <InfoRow icon={<User size={18} color={colors.primary} />} label="Receiver" value={job.receiver.name ?? 'Anonymous Receiver'} />
        )}
        {job.listing.requiresColdChain && (
          <View style={styles.coldWarning}>
            <Snowflake size={20} color={colors.primary} />
            <Text style={styles.coldWarningText}>
              ❄️ Cold chain required — food must stay refrigerated during transport.
            </Text>
          </View>
        )}

        {/* What you need to do */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Mission</Text>
          <Step num={1} text={`Pick up food from donor at: ${job.listing.addressText}`} />
          <Step num={2} text={`Deliver to the receiver's location`} />
          <Step num={3} text="Mark as delivered — earn impact points!" />
        </View>

        {/* Accept */}
        {job.status === 'open' && (
          <TouchableOpacity
            style={[styles.acceptButton, isAccepting && styles.disabled]}
            onPress={handleAccept}
            disabled={isAccepting}
          >
            {isAccepting
              ? <ActivityIndicator color={colors.surface} />
              : <Text style={styles.acceptText}>Accept This Job</Text>
            }
          </TouchableOpacity>
        )}

        {job.status !== 'open' && (
          <View style={styles.unavailableBox}>
            <Text style={styles.unavailableText}>This job is no longer available.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIcon}>{icon}</View>
    <View style={styles.infoText}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const Step = ({ num, text }: { num: number; text: string }) => (
  <View style={styles.step}>
    <View style={styles.stepCircle}><Text style={styles.stepNum}>{num}</Text></View>
    <Text style={styles.stepText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: {
    backgroundColor: colors.primary,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    alignItems: 'center',
    gap: spacing.s,
  },
  heroIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.s,
  },
  heroTitle: { ...typography.heading, color: colors.surface, textAlign: 'center' },
  heroSub: { ...typography.body, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  urgentBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.m, paddingVertical: spacing.xs,
    borderRadius: 20, marginTop: spacing.s,
  },
  urgentText: { color: colors.surface, fontWeight: '700', fontSize: 13 },
  content: { padding: spacing.l },
  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: colors.surface, borderRadius: 12,
    padding: spacing.m, marginBottom: spacing.m,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    gap: spacing.m,
  },
  infoIcon: { width: 32, alignItems: 'center', marginTop: 2 },
  infoText: { flex: 1 },
  infoLabel: { ...typography.caption, color: colors.textSecondary },
  infoValue: { ...typography.subhead, fontSize: 15, marginTop: 2 },
  coldWarning: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.m,
    backgroundColor: colors.primary + '15', borderRadius: 12,
    padding: spacing.m, marginBottom: spacing.m,
  },
  coldWarningText: { ...typography.body, color: colors.primary, flex: 1 },
  section: { marginBottom: spacing.l },
  sectionTitle: { ...typography.subhead, marginBottom: spacing.m },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.m, marginBottom: spacing.m },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  stepNum: { color: colors.surface, fontWeight: '700', fontSize: 13 },
  stepText: { ...typography.body, flex: 1, paddingTop: 4 },
  acceptButton: {
    backgroundColor: colors.success, borderRadius: 14,
    paddingVertical: spacing.l, alignItems: 'center', marginBottom: spacing.l,
  },
  disabled: { opacity: 0.6 },
  acceptText: { color: colors.surface, fontSize: 18, fontWeight: '700' },
  unavailableBox: {
    backgroundColor: colors.border, borderRadius: 12,
    padding: spacing.m, alignItems: 'center', marginBottom: spacing.l,
  },
  unavailableText: { color: colors.textSecondary, fontWeight: '600' },
});
