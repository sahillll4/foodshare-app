import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Image, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, MapPin, Clock, Info } from 'lucide-react-native';
import { DonorTabParamList } from '../../navigation/types';
import { colors, typography, spacing } from '../../theme';
import { api } from '../../api';

type NavigationProp = NativeStackNavigationProp<DonorTabParamList, 'PostListing'>;

export const PostListingScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [foodType, setFoodType] = useState<'veg' | 'non-veg' | 'both'>('veg');
  const [quantityNum, setQuantityNum] = useState('10');
  const [quantityText, setQuantityText] = useState('Meals');
  const [requiresColdChain, setRequiresColdChain] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Hardcoded location and time for MVP Phase 2 (will wire real pickers later)
  const latitude = '18.5204'; // Pune
  const longitude = '73.8567';
  const addressText = 'Shivajinagar, Pune';
  
  // Default to 2 hours from now
  const pickupStart = new Date().toISOString();
  const pickupEnd = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  const handlePickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // compress slightly
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title || !quantityNum || !quantityText) {
      Alert.alert('Missing Info', 'Please fill in the food title and quantity.');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('foodType', foodType);
      formData.append('quantityNum', quantityNum);
      formData.append('quantityText', quantityText);
      formData.append('requiresColdChain', requiresColdChain.toString());
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      formData.append('addressText', addressText);
      formData.append('pickupStart', pickupStart);
      formData.append('pickupEnd', pickupEnd);

      if (photoUri) {
        // React Native specific way to append files to FormData
        const filename = photoUri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        
        formData.append('photo', {
          uri: Platform.OS === 'ios' ? photoUri.replace('file://', '') : photoUri,
          name: filename,
          type,
        } as any);
      }

      await api.post('/listings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Food listed successfully!');
      navigation.navigate('DonorHome');
      
      // Reset form
      setTitle('');
      setDescription('');
      setPhotoUri(null);
      setQuantityNum('10');
      
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to post listing. We will save it offline (coming in Phase 6).');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Post Food</Text>
        <Text style={styles.headerSubtitle}>Takes less than 90 seconds.</Text>
      </View>

      <View style={styles.formContainer}>
        
        {/* Photo Upload */}
        <TouchableOpacity style={styles.photoUpload} onPress={handlePickImage}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Camera color={colors.primary} size={32} />
              <Text style={styles.photoText}>Tap to take a photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>What are you donating? *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Leftover Wedding Buffet"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Quantity Row */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.s }]}>
            <Text style={styles.label}>Quantity *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 10"
              keyboardType="numeric"
              value={quantityNum}
              onChangeText={setQuantityNum}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: spacing.s }]}>
            <Text style={styles.label}>Unit *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Meals"
              value={quantityText}
              onChangeText={setQuantityText}
            />
          </View>
        </View>

        {/* Food Type Selector */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Food Type *</Text>
          <View style={styles.toggleRow}>
            {(['veg', 'non-veg', 'both'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.toggleButton, foodType === type && styles.toggleButtonActive]}
                onPress={() => setFoodType(type)}
              >
                <Text style={[styles.toggleText, foodType === type && styles.toggleTextActive]}>
                  {type.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Cold Chain Toggle */}
        <View style={[styles.inputGroup, styles.switchRow]}>
          <View style={styles.switchTextContainer}>
            <Text style={styles.label}>Requires Cold Chain?</Text>
            <Text style={styles.caption}>Enable if food spoils quickly without AC/ice.</Text>
          </View>
          <Switch
            value={requiresColdChain}
            onValueChange={setRequiresColdChain}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any packaging notes or allergens?"
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Mock Data Alerts */}
        <View style={styles.mockInfoBox}>
          <Info size={20} color={colors.accent} />
          <Text style={styles.mockInfoText}>
            Location and Pickup Time are automatically set to your profile defaults for speed.
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>{isLoading ? 'Posting...' : 'Post Listing'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.l,
    paddingTop: spacing.xxl,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    ...typography.heading,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  formContainer: {
    padding: spacing.l,
  },
  photoUpload: {
    height: 160,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: spacing.l,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoText: {
    ...typography.subhead,
    color: colors.primary,
    marginTop: spacing.s,
  },
  inputGroup: {
    marginBottom: spacing.l,
  },
  label: {
    ...typography.subhead,
    fontSize: 14,
    marginBottom: spacing.s,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.m,
    fontSize: 16,
    color: colors.textPrimary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.s,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  toggleButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  toggleText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.primary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchTextContainer: {
    flex: 1,
    paddingRight: spacing.m,
  },
  caption: {
    ...typography.caption,
    marginTop: 2,
  },
  mockInfoBox: {
    flexDirection: 'row',
    backgroundColor: colors.accent + '20',
    padding: spacing.m,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  mockInfoText: {
    ...typography.caption,
    color: colors.textPrimary,
    flex: 1,
    marginLeft: spacing.s,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.m,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '600',
  },
});
