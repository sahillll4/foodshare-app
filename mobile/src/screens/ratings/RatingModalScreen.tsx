import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Star, X } from 'lucide-react-native';
import { AppStackParamList } from '../../navigation/types';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../api';

type Props = NativeStackScreenProps<AppStackParamList, 'RatingModal'>;

export const RatingModalScreen = ({ route }: Props) => {
  const { listingId, ratedUserId, ratedUserName, roleTitle } = route.params;
  const navigation = useNavigation();

  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (score === 0) {
      Alert.alert('Hold on', 'Please select a star rating.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/ratings', {
        listingId,
        ratedId: ratedUserId,
        score,
        comment,
      });
      Alert.alert('Thank You', 'Your feedback helps keep the community safe!', [
        { text: 'Done', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('[RatingModal] Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating. You may have already rated this user.');
      navigation.goBack();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Rate Your Experience</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          How was your interaction with {ratedUserName} ({roleTitle})?
        </Text>

        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity key={s} onPress={() => setScore(s)}>
              <Star
                size={40}
                color={s <= score ? '#FBBF24' : colors.border}
                fill={s <= score ? '#FBBF24' : 'transparent'}
                style={styles.starIcon}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Leave a comment (optional)..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
          value={comment}
          onChangeText={setComment}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitBtn, (score === 0 || isSubmitting) && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={score === 0 || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.submitText}>Submit Rating</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end', // Slide up from bottom
  },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: spacing.xxl * 2, // Account for safe area
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  title: { ...typography.heading },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.l },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.m,
    marginBottom: spacing.l,
  },
  starIcon: { marginHorizontal: 4 },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.m,
    ...typography.body,
    height: 100,
    marginBottom: spacing.xl,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: spacing.l,
    alignItems: 'center',
  },
  disabledBtn: { opacity: 0.5 },
  submitText: { color: colors.surface, fontWeight: '700', fontSize: 16 },
});
