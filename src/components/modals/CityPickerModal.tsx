import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CityOption, POPULAR_CITIES } from '../../constants/cities';
import colors from '../../constants/colors';
import { borderRadius, typography } from '../../constants/theme';
import Input from '../common/Input';

export interface CityPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedCity: CityOption;
  onSelectCity: (city: CityOption) => void;
}

export const CityPickerModal: React.FC<CityPickerModalProps> = ({
  visible,
  onClose,
  selectedCity,
  onSelectCity,
}) => {
  const [search, setSearch] = useState('');

  const filteredCities = POPULAR_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.state.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Select Your City</Text>
              <Text style={styles.subtitle}>Discover available cars & bikes near you</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.dark} />
            </TouchableOpacity>
          </View>

          {/* Search input */}
          <View style={styles.searchWrapper}>
            <Input
              placeholder="Search city or state..."
              value={search}
              onChangeText={setSearch}
              prefixIcon="search-outline"
              containerStyle={{ marginBottom: 0 }}
            />
          </View>

          {/* Use GPS Location */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              onSelectCity(POPULAR_CITIES[0]); // Default GPS to Lucknow
              onClose();
            }}
            style={styles.gpsRow}
          >
            <View style={styles.gpsIconCircle}>
              <Ionicons name="navigate" size={18} color={colors.primary} />
            </View>
            <View style={styles.gpsTextCol}>
              <Text style={styles.gpsTitle}>Use Current GPS Location</Text>
              <Text style={styles.gpsSubtitle}>Detect nearest rental vehicles</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.sectionHeader}>Popular Cities in North & Central India</Text>

          {/* City List */}
          <FlatList
            data={filteredCities}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = item.id === selectedCity.id;
              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelectCity(item);
                    onClose();
                  }}
                  style={[styles.cityRow, isSelected && styles.cityRowSelected]}
                >
                  <Ionicons
                    name="location-sharp"
                    size={20}
                    color={isSelected ? colors.primary : colors.muted}
                    style={{ marginRight: 12 }}
                  />
                  <View style={styles.cityTextCol}>
                    <Text style={[styles.cityName, isSelected && styles.cityNameSelected]}>
                      {item.name}
                    </Text>
                    <Text style={styles.stateName}>{item.state}</Text>
                  </View>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  ) : null}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 10 : 0,
  },
  container: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 370 : 440,
    backgroundColor: colors.surface,
    borderRadius: 24,
    maxHeight: Platform.OS === 'web' ? '86%' : '88%',
    overflow: 'hidden',
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    ...typography.h3,
    color: colors.dark,
  },
  subtitle: {
    ...typography.caption,
    color: colors.muted,
  },
  closeBtn: {
    padding: 4,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.primaryLight,
    marginHorizontal: 20,
    borderRadius: borderRadius.md,
    marginBottom: 14,
  },
  gpsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  gpsTextCol: {
    flex: 1,
  },
  gpsTitle: {
    ...typography.bodyBold,
    color: colors.primaryDark,
  },
  gpsSubtitle: {
    fontSize: 11,
    color: colors.primary,
  },
  sectionHeader: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.darkMuted,
    paddingHorizontal: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  cityRowSelected: {
    backgroundColor: colors.surfaceVariant,
  },
  cityTextCol: {
    flex: 1,
  },
  cityName: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  cityNameSelected: {
    color: colors.primary,
  },
  stateName: {
    ...typography.caption,
    color: colors.body,
  },
});

export default CityPickerModal;
