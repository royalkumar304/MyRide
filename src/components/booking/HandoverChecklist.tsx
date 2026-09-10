import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { borderRadius, typography } from '../../constants/theme';
import Input from '../common/Input';
import Button from '../common/Button';
import { InspectionData } from '../../types';

export interface HandoverChecklistProps {
  title: string;
  isEndRide?: boolean;
  initialOdometer?: number;
  onSubmit: (inspection: InspectionData) => void;
  loading?: boolean;
}

export const HandoverChecklist: React.FC<HandoverChecklistProps> = ({
  title,
  isEndRide = false,
  initialOdometer = 34210,
  onSubmit,
  loading = false,
}) => {
  const [odometer, setOdometer] = useState(initialOdometer.toString());
  const [fuelPercentage, setFuelPercentage] = useState(85);
  const [scratches, setScratches] = useState('');
  const [checklist, setChecklist] = useState({
    lightsWorking: true,
    tyresInspected: true,
    acHeaterWorking: true,
    accessoriesPresent: true,
    documentsPresent: true,
  });

  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=300&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=300&q=80',
  ]);

  const toggleChecklistItem = (key: keyof typeof checklist) => {
    setChecklist({ ...checklist, [key]: !checklist[key] });
  };

  const handleSimulateAddPhoto = () => {
    const samplePhotos = [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=300&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=300&q=80',
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=300&q=80',
    ];
    if (uploadedPhotos.length < 6) {
      const nextPhoto = samplePhotos[uploadedPhotos.length % samplePhotos.length];
      setUploadedPhotos([...uploadedPhotos, nextPhoto]);
    }
  };

  const handleSubmit = () => {
    const data: InspectionData = {
      odometerReading: parseInt(odometer, 10) || initialOdometer,
      fuelLevelPercentage: fuelPercentage,
      scratchesNotes: scratches,
      checklist,
      photos: uploadedPhotos,
      timestamp: new Date().toISOString(),
    };
    onSubmit(data);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>
        Verify the vehicle condition to ensure transparent liability and deposit safety.
      </Text>

      {/* Odometer Reading */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Odometer Reading (km)</Text>
        <Input
          placeholder="e.g. 34210"
          value={odometer}
          onChangeText={setOdometer}
          keyboardType="numeric"
          prefixIcon="speedometer-outline"
        />
      </View>

      {/* Fuel Level */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Fuel Level: {fuelPercentage}%</Text>
        <View style={styles.fuelButtonsRow}>
          {[25, 50, 75, 100].map((lvl) => (
            <TouchableOpacity
              key={lvl}
              onPress={() => setFuelPercentage(lvl)}
              style={[styles.fuelBtn, fuelPercentage === lvl && styles.fuelBtnActive]}
            >
              <Text style={[styles.fuelBtnText, fuelPercentage === lvl && styles.fuelBtnTextActive]}>
                {lvl}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Condition Checklist */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Inspection Checklist</Text>
        
        <TouchableOpacity
          onPress={() => toggleChecklistItem('lightsWorking')}
          style={styles.checkRow}
        >
          <Ionicons
            name={checklist.lightsWorking ? 'checkbox' : 'square-outline'}
            size={22}
            color={checklist.lightsWorking ? colors.primary : colors.muted}
          />
          <Text style={styles.checkLabel}>Headlights, indicators & brake lights working</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => toggleChecklistItem('tyresInspected')}
          style={styles.checkRow}
        >
          <Ionicons
            name={checklist.tyresInspected ? 'checkbox' : 'square-outline'}
            size={22}
            color={checklist.tyresInspected ? colors.primary : colors.muted}
          />
          <Text style={styles.checkLabel}>Tyres & spare tyre in good condition</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => toggleChecklistItem('acHeaterWorking')}
          style={styles.checkRow}
        >
          <Ionicons
            name={checklist.acHeaterWorking ? 'checkbox' : 'square-outline'}
            size={22}
            color={checklist.acHeaterWorking ? colors.primary : colors.muted}
          />
          <Text style={styles.checkLabel}>AC / Heater working properly</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => toggleChecklistItem('documentsPresent')}
          style={styles.checkRow}
        >
          <Ionicons
            name={checklist.documentsPresent ? 'checkbox' : 'square-outline'}
            size={22}
            color={checklist.documentsPresent ? colors.primary : colors.muted}
          />
          <Text style={styles.checkLabel}>Original RC & Insurance copy in glovebox</Text>
        </TouchableOpacity>
      </View>

      {/* Upload Photos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Vehicle Photos ({uploadedPhotos.length}/6)</Text>
        <Text style={styles.subtext}>
          Take clear photos of front, back, odometer, and any existing scratches.
        </Text>

        <View style={styles.photosGrid}>
          {uploadedPhotos.map((uri, idx) => (
            <View key={idx} style={styles.photoThumb}>
              <Image source={{ uri }} style={styles.thumbImage} />
            </View>
          ))}

          {uploadedPhotos.length < 6 ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSimulateAddPhoto}
              style={styles.addPhotoButton}
            >
              <Ionicons name="camera-outline" size={24} color={colors.primary} />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Notes / Scratches */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Existing Scratches / Notes (Optional)</Text>
        <Input
          placeholder="e.g. Minor scratch on rear left bumper..."
          value={scratches}
          onChangeText={setScratches}
          multiline
          numberOfLines={3}
          style={{ minHeight: 60 }}
        />
      </View>

      {/* Submit Button */}
      <Button
        title={isEndRide ? 'Confirm Return & End Ride' : 'Confirm Inspection & Start Ride'}
        variant={isEndRide ? 'danger' : 'success'}
        size="lg"
        loading={loading}
        onPress={handleSubmit}
        style={{ marginTop: 8 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  title: {
    ...typography.h2,
    color: colors.dark,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.body,
    color: colors.body,
    marginBottom: 16,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    ...typography.bodyBold,
    color: colors.dark,
    marginBottom: 8,
  },
  fuelButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fuelBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  fuelBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  fuelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.darkMuted,
  },
  fuelBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checkLabel: {
    ...typography.body,
    marginLeft: 8,
    color: colors.dark,
    flex: 1,
  },
  subtext: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: 10,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoThumb: {
    width: 76,
    height: 76,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginRight: 8,
    marginBottom: 8,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  addPhotoButton: {
    width: 76,
    height: 76,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  addPhotoText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },
});

export default HandoverChecklist;
