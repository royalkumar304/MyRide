import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VehicleFilterParams, VehicleCategory, FuelType, TransmissionType } from '../../types';
import colors from '../../constants/colors';
import { borderRadius, typography } from '../../constants/theme';
import Button from '../common/Button';

export interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: VehicleFilterParams;
  onApply: (filters: VehicleFilterParams) => void;
  onReset: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApply,
  onReset,
}) => {
  const [localFilters, setLocalFilters] = useState<VehicleFilterParams>(filters);

  const categories: { label: string; value: VehicleCategory | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Bikes', value: 'bike' },
    { label: 'Cars', value: 'car' },
    { label: 'SUVs', value: 'suv' },
    { label: 'EVs', value: 'ev' },
  ];

  const fuelTypes: FuelType[] = ['Petrol', 'Diesel', 'Electric', 'CNG'];
  const transmissions: TransmissionType[] = ['Manual', 'Automatic'];
  const sortOptions = [
    { label: 'Price: Low to High', value: 'price_asc' as const },
    { label: 'Price: High to Low', value: 'price_desc' as const },
    { label: 'Highest Rated', value: 'rating' as const },
    { label: 'Nearest to Me', value: 'nearest' as const },
    { label: 'Most Booked', value: 'popularity' as const },
  ];

  const toggleFuelType = (fuel: FuelType) => {
    const current = localFilters.fuelTypes || [];
    if (current.includes(fuel)) {
      setLocalFilters({ ...localFilters, fuelTypes: current.filter(f => f !== fuel) });
    } else {
      setLocalFilters({ ...localFilters, fuelTypes: [...current, fuel] });
    }
  };

  const toggleTransmission = (trans: TransmissionType) => {
    const current = localFilters.transmissions || [];
    if (current.includes(trans)) {
      setLocalFilters({ ...localFilters, transmissions: current.filter(t => t !== trans) });
    } else {
      setLocalFilters({ ...localFilters, transmissions: [...current, trans] });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filters & Sorting</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.dark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Sort By */}
            <Text style={styles.sectionTitle}>Sort By</Text>
            <View style={styles.chipsWrap}>
              {sortOptions.map((opt) => {
                const isSelected = localFilters.sortBy === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setLocalFilters({ ...localFilters, sortBy: opt.value })}
                    style={[styles.chip, isSelected && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Vehicle Category */}
            <Text style={styles.sectionTitle}>Vehicle Category</Text>
            <View style={styles.chipsWrap}>
              {categories.map((cat) => {
                const isSelected = (localFilters.category || 'all') === cat.value;
                return (
                  <TouchableOpacity
                    key={cat.value}
                    onPress={() => setLocalFilters({ ...localFilters, category: cat.value })}
                    style={[styles.chip, isSelected && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Fuel Type */}
            <Text style={styles.sectionTitle}>Fuel Type</Text>
            <View style={styles.chipsWrap}>
              {fuelTypes.map((fuel) => {
                const isSelected = localFilters.fuelTypes?.includes(fuel);
                return (
                  <TouchableOpacity
                    key={fuel}
                    onPress={() => toggleFuelType(fuel)}
                    style={[styles.chip, isSelected && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {fuel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Transmission */}
            <Text style={styles.sectionTitle}>Transmission</Text>
            <View style={styles.chipsWrap}>
              {transmissions.map((trans) => {
                const isSelected = localFilters.transmissions?.includes(trans);
                return (
                  <TouchableOpacity
                    key={trans}
                    onPress={() => toggleTransmission(trans)}
                    style={[styles.chip, isSelected && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {trans}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quick Preferences */}
            <Text style={styles.sectionTitle}>Preferences</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                setLocalFilters({ ...localFilters, deliveryOnly: !localFilters.deliveryOnly })
              }
              style={styles.toggleRow}
            >
              <Text style={styles.toggleLabel}>Home Delivery Available</Text>
              <Ionicons
                name={localFilters.deliveryOnly ? 'checkbox' : 'square-outline'}
                size={22}
                color={localFilters.deliveryOnly ? colors.primary : colors.muted}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                setLocalFilters({
                  ...localFilters,
                  instantBookingOnly: !localFilters.instantBookingOnly,
                })
              }
              style={styles.toggleRow}
            >
              <Text style={styles.toggleLabel}>Instant Booking Only</Text>
              <Ionicons
                name={localFilters.instantBookingOnly ? 'checkbox' : 'square-outline'}
                size={22}
                color={localFilters.instantBookingOnly ? colors.primary : colors.muted}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                setLocalFilters({ ...localFilters, verifiedOnly: !localFilters.verifiedOnly })
              }
              style={styles.toggleRow}
            >
              <Text style={styles.toggleLabel}>Verified Hosts Only</Text>
              <Ionicons
                name={localFilters.verifiedOnly ? 'checkbox' : 'square-outline'}
                size={22}
                color={localFilters.verifiedOnly ? colors.primary : colors.muted}
              />
            </TouchableOpacity>
          </ScrollView>

          {/* Bottom Action Footer */}
          <View style={styles.footer}>
            <Button
              title="Reset All"
              variant="outline"
              size="md"
              onPress={() => {
                onReset();
                onClose();
              }}
              style={styles.footerBtn}
            />
            <Button
              title="Apply Filters"
              variant="primary"
              size="md"
              onPress={() => {
                onApply(localFilters);
                onClose();
              }}
              style={styles.footerBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.dark,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  sectionTitle: {
    ...typography.bodyBold,
    color: colors.dark,
    marginTop: 14,
    marginBottom: 10,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceVariant,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  chipText: {
    fontSize: 13,
    color: colors.darkMuted,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  toggleLabel: {
    ...typography.body,
    color: colors.dark,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerBtn: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default FilterModal;
