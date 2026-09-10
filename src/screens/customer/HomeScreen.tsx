import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import colors from '../../constants/colors';
import { borderRadius, shadows, typography } from '../../constants/theme';
import VehicleCard from '../../components/vehicle/VehicleCard';
import CityPickerModal from '../../components/modals/CityPickerModal';
import HubLocationPickerModal from '../../components/modals/HubLocationPickerModal';
import DateTimePickerModal from '../../components/modals/DateTimePickerModal';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { VehicleCardSkeleton } from '../../components/common/Loader';
import { useAppDispatch, useAppSelector } from '../../store';
import { setSelectedCity } from '../../store/slices/uiSlice';
import {
  setSelectedCategory,
  toggleSaveVehicle,
  setSelectedVehicle,
  setVehicles,
  setVehiclesLoading,
} from '../../store/slices/vehicleSlice';
import { vehicleService } from '../../services/vehicleService';
import { VehicleCategory } from '../../types';
import { getTranslation } from '../../localization';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();

  const { selectedCity, language } = useAppSelector((state) => state.ui);
  const { vehicles, savedVehicleIds, selectedCategory, isLoading } = useAppSelector((state) => state.vehicles);
  const { user } = useAppSelector((state) => state.auth);
  const { bookings } = useAppSelector((state) => state.bookings);

  const t = getTranslation(language);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [dateTimeModalVisible, setDateTimeModalVisible] = useState(false);

  const [pickupLocation, setPickupLocation] = useState(
    `${selectedCity?.hubs?.[0] || 'Central Hub'}, ${selectedCity?.name || 'Lucknow'}`
  );
  const [startDate, setStartDate] = useState('Tomorrow, 10:00 AM');
  const [endDate, setEndDate] = useState('Day After, 08:00 PM');

  // Keep pickup location in sync when selected city changes (e.g. Agra, Kanpur, Jaipur)
  useEffect(() => {
    if (selectedCity) {
      const defaultHub = selectedCity.hubs && selectedCity.hubs.length > 0 ? selectedCity.hubs[0] : 'Central Hub';
      setPickupLocation(`${defaultHub}, ${selectedCity.name}`);
    }
  }, [selectedCity]);

  // Load vehicles from real API
  useEffect(() => {
    let isMounted = true;
    const fetchVehicles = async () => {
      try {
        dispatch(setVehiclesLoading(true));
        const res = await vehicleService.getVehicles({
          city: selectedCity?.name,
        });
        if (isMounted && res.success && res.data) {
          dispatch(setVehicles(res.data));
        }
      } catch (err) {
        console.warn('[HomeScreen] Live vehicles fetch error:', err);
      } finally {
        if (isMounted) {
          dispatch(setVehiclesLoading(false));
        }
      }
    };

    fetchVehicles();
    return () => {
      isMounted = false;
    };
  }, [selectedCity?.name]);

  const categories: { key: VehicleCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'bike', label: t.bikes, icon: 'bicycle-outline' },
    { key: 'car', label: t.cars, icon: 'car-outline' },
    { key: 'suv', label: t.suvs, icon: 'car-sport-outline' },
    { key: 'ev', label: t.evs, icon: 'flash-outline' },
  ];

  const filteredVehicles = selectedCategory === 'all'
    ? vehicles
    : vehicles.filter((v) => v.category === selectedCategory);

  const handleCategorySelect = (catKey: VehicleCategory) => {
    if (selectedCategory === catKey) {
      dispatch(setSelectedCategory('all'));
    } else {
      dispatch(setSelectedCategory(catKey));
    }
  };

  const handleSearchPress = () => {
    // Navigate to Explore screen
    navigation.navigate('CustomerMain');
  };

  const handleVehiclePress = (vehicle: any) => {
    dispatch(setSelectedVehicle(vehicle));
    navigation.navigate('VehicleDetails', { vehicleId: vehicle.id });
  };

  const hasPreviousBookings = bookings.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Top App Header with City Selector */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={styles.brandTitle}>MYRIDE</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setCityModalVisible(true)}
          style={styles.citySelectorBtn}
        >
          <Ionicons name="location" size={16} color={colors.primary} />
          <Text style={styles.cityText} numberOfLines={1}>
            {selectedCity.name}, {selectedCity.state.split(' ')[0]}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.muted} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Welcome Greeting */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingTitle}>
            {hasPreviousBookings ? `${t.welcomeBack} ${user?.fullName?.split(' ')[0] || ''}` : t.findFirstRide}
          </Text>
          <Text style={styles.greetingSubtitle}>{t.whereAreYouRiding}</Text>
        </View>

        {/* Large Search Card */}
        <View style={styles.searchCard}>
          {/* Pickup spot */}
          <TouchableOpacity
            style={styles.searchField}
            onPress={() => setLocationModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="pin-outline" size={20} color={colors.primary} style={styles.fieldIcon} />
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>{t.pickupLocation}</Text>
              <Text style={styles.fieldValue} numberOfLines={1}>{pickupLocation}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </TouchableOpacity>

          <View style={styles.fieldDivider} />

          {/* Date & Time Row */}
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={[styles.searchField, { flex: 1 }]}
              onPress={() => setDateTimeModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.primary} style={styles.fieldIcon} />
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>{t.startDateAndTime}</Text>
                <Text style={styles.fieldValue} numberOfLines={1}>{startDate}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.verticalDivider} />

            <TouchableOpacity
              style={[styles.searchField, { flex: 1 }]}
              onPress={() => setDateTimeModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={18} color={colors.primary} style={styles.fieldIcon} />
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>{t.endDateAndTime}</Text>
                <Text style={styles.fieldValue} numberOfLines={1}>{endDate}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Search CTA */}
          <Button
            title={t.searchRides}
            onPress={handleSearchPress}
            variant="primary"
            size="lg"
            icon={<Ionicons name="search" size={18} color={colors.surface} />}
            style={styles.searchCta}
          />
        </View>

        {/* Quick Categories */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t.quickCategories}</Text>
          {selectedCategory !== 'all' ? (
            <TouchableOpacity onPress={() => dispatch(setSelectedCategory('all'))}>
              <Text style={styles.clearFilterText}>Show All</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.categoryGrid}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                activeOpacity={0.8}
                onPress={() => handleCategorySelect(cat.key)}
                style={[
                  styles.categoryCard,
                  isSelected && styles.categoryCardActive,
                ]}
              >
                <View
                  style={[
                    styles.categoryIconCircle,
                    isSelected && styles.categoryIconCircleActive,
                  ]}
                >
                  <Ionicons
                    name={cat.icon}
                    size={24}
                    color={isSelected ? colors.surface : colors.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.categoryLabel,
                    isSelected && styles.categoryLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Trust & Safety Banner */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('SafetyCenter')}
          style={styles.safetyBanner}
        >
          <View style={styles.safetyIconCircle}>
            <Ionicons name="shield-checkmark" size={20} color={colors.success} />
          </View>
          <View style={styles.safetyTextCol}>
            <Text style={styles.safetyTitle}>MyRide Trust Shield</Text>
            <Text style={styles.safetySubtitle}>
              100% Verified Hosts • 24/7 Roadside Assistance • Transparent Fares
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </TouchableOpacity>

        {/* Popular Near You */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>{t.popularNearYou}</Text>
            <Text style={styles.sectionSubtitle}>
              Available in {selectedCity.name}
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Offers')}>
            <Text style={styles.offersLink}>View Offers 🎁</Text>
          </TouchableOpacity>
        </View>

        {/* Vehicle Cards List / Skeletons / Empty */}
        {isLoading && filteredVehicles.length === 0 ? (
          <>
            <VehicleCardSkeleton />
            <VehicleCardSkeleton />
          </>
        ) : filteredVehicles.length === 0 ? (
          <EmptyState
            icon="car-outline"
            title="No vehicles in this category"
            subtitle={`There are currently no ${selectedCategory !== 'all' ? selectedCategory : ''} vehicles available in ${selectedCity.name}.`}
            actionTitle="View All Vehicles"
            onAction={() => dispatch(setSelectedCategory('all'))}
          />
        ) : (
          filteredVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              isSaved={savedVehicleIds.includes(vehicle.id)}
              onToggleSave={() => dispatch(toggleSaveVehicle(vehicle.id))}
              onPress={() => handleVehiclePress(vehicle)}
            />
          ))
        )}
      </ScrollView>

      {/* City Picker Modal */}
      <CityPickerModal
        visible={cityModalVisible}
        onClose={() => setCityModalVisible(false)}
        selectedCity={selectedCity}
        onSelectCity={(city) => {
          dispatch(setSelectedCity(city));
          const hub = city.hubs && city.hubs.length > 0 ? city.hubs[0] : 'Central Hub';
          setPickupLocation(`${hub}, ${city.name}`);
        }}
      />

      {/* Hub Location Picker Modal */}
      <HubLocationPickerModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        selectedCity={selectedCity}
        currentLocation={pickupLocation}
        onSelectHub={(hub) => setPickupLocation(hub)}
        onChangeCityPress={() => setCityModalVisible(true)}
      />

      {/* Date & Time Picker Modal */}
      <DateTimePickerModal
        visible={dateTimeModalVisible}
        onClose={() => setDateTimeModalVisible(false)}
        initialStartDate={startDate}
        initialEndDate={endDate}
        onConfirm={(newStart, newEnd) => {
          setStartDate(newStart);
          setEndDate(newEnd);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1,
  },
  citySelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 180,
  },
  cityText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.dark,
    marginHorizontal: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  greetingContainer: {
    marginBottom: 16,
  },
  greetingTitle: {
    ...typography.h2,
    color: colors.dark,
  },
  greetingSubtitle: {
    ...typography.body,
    color: colors.body,
    marginTop: 2,
  },
  searchCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    marginBottom: 20,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  fieldIcon: {
    marginRight: 10,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark,
    marginTop: 2,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.borderLight,
    marginHorizontal: 8,
  },
  searchCta: {
    marginTop: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
    marginTop: 6,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.dark,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.muted,
  },
  clearFilterText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  offersLink: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '700',
  },
  categoryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  categoryCardActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryIconCircleActive: {
    backgroundColor: colors.primary,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.darkMuted,
  },
  categoryLabelActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: 12,
    marginBottom: 20,
  },
  safetyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  safetyTextCol: {
    flex: 1,
  },
  safetyTitle: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  safetySubtitle: {
    fontSize: 11,
    color: colors.body,
    marginTop: 2,
  },
});

export default HomeScreen;
