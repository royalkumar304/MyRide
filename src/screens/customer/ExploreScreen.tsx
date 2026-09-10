import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import colors from '../../constants/colors';
import { borderRadius, shadows, typography } from '../../constants/theme';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import VehicleCard from '../../components/vehicle/VehicleCard';
import FilterModal from '../../components/vehicle/FilterModal';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Loader from '../../components/common/Loader';
import { getFriendlyErrorMessage, isNetworkError } from '../../services/errorHandler';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  setSearchQuery,
  setFilters,
  resetFilters,
  toggleSaveVehicle,
  setSelectedVehicle,
  setVehicles,
  setVehiclesLoading,
} from '../../store/slices/vehicleSlice';
import { vehicleService } from '../../services/vehicleService';
import { Vehicle } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ExploreScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();

  const { vehicles, savedVehicleIds, searchQuery, filters, isLoading } = useAppSelector(
    (state) => state.vehicles
  );
  const { selectedCity } = useAppSelector((state) => state.ui);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  // Debounce search input changes by 350ms to optimize network requests
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load vehicles from backend using live query parameters
  const loadVehicles = useCallback(async () => {
    try {
      dispatch(setVehiclesLoading(true));
      setError(null);

      const res = await vehicleService.getVehicles({
        city: selectedCity?.name,
        area: filters.area,
        category: filters.category,
        brand: filters.brand,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        fuelTypes: filters.fuelTypes,
        transmissions: filters.transmissions,
        seats: filters.seats,
        seatingCapacity: filters.seatingCapacity,
        rating: filters.minRating || filters.rating,
        distance: filters.distance,
        availability: filters.availability,
        sortBy: filters.sortBy,
        deliveryOnly: filters.deliveryOnly,
        instantBookingOnly: filters.instantBookingOnly,
        verifiedOnly: filters.verifiedOnly,
        searchQuery: debouncedQuery,
        q: debouncedQuery,
      });

      if (res.success && res.data) {
        dispatch(setVehicles(res.data));
      } else {
        setError(getFriendlyErrorMessage(res.message || 'Failed to fetch vehicles from server', res.statusCode));
      }
    } catch (err: any) {
      console.warn('[ExploreScreen] Error fetching vehicles:', err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      dispatch(setVehiclesLoading(false));
    }
  }, [filters, selectedCity?.name, debouncedQuery, dispatch]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const handleResetFilters = () => {
    dispatch(resetFilters());
    dispatch(setSearchQuery(''));
  };

  const handleVehiclePress = (vehicle: Vehicle) => {
    dispatch(setSelectedVehicle(vehicle));
    navigation.navigate('VehicleDetails', { vehicleId: vehicle.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchRow}>
          <Input
            placeholder={`Search cars & bikes in ${selectedCity.name}...`}
            value={searchQuery}
            onChangeText={(val) => dispatch(setSearchQuery(val))}
            prefixIcon="search-outline"
            containerStyle={styles.searchInputContainer}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setFilterModalVisible(true)}
            style={styles.filterBtn}
          >
            <Ionicons name="options-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* View Toggle Bar (List vs Map) */}
        <View style={styles.viewToggleBar}>
          <Text style={styles.resultsCount}>
            {vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'} found
          </Text>

          <View style={styles.togglePill}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setViewMode('list')}
              style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            >
              <Ionicons
                name="list"
                size={16}
                color={viewMode === 'list' ? colors.primary : colors.muted}
              />
              <Text
                style={[
                  styles.toggleText,
                  viewMode === 'list' && styles.toggleTextActive,
                ]}
              >
                List
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setViewMode('map')}
              style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
            >
              <Ionicons
                name="map"
                size={16}
                color={viewMode === 'map' ? colors.primary : colors.muted}
              />
              <Text
                style={[
                  styles.toggleText,
                  viewMode === 'map' && styles.toggleTextActive,
                ]}
              >
                Map
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Error State Banner when vehicles exist */}
      {error && vehicles.length > 0 && (
        <View style={styles.errorContainer}>
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={22} color={colors.danger} />
            <Text style={styles.errorText} numberOfLines={2}>
              {error}
            </Text>
          </View>
          <TouchableOpacity onPress={loadVehicles} style={styles.retryInlineBtn}>
            <Ionicons name="refresh-outline" size={16} color={colors.primary} />
            <Text style={styles.retryInlineText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 1. Loading State (Initial Fetch) */}
      {isLoading && vehicles.length === 0 ? (
        <Loader message={`Searching available rides in ${selectedCity.name}...`} />
      ) : error && vehicles.length === 0 ? (
        /* 2. Error State (Initial Fetch Failed) */
        <ErrorState
          isOffline={isNetworkError(error)}
          message={error}
          retryAction={loadVehicles}
          style={{ flex: 1 }}
        />
      ) : viewMode === 'list' ? (
        /* 3. List View Mode (Success & Empty States) */
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={loadVehicles}
          ListEmptyComponent={
            /* 4. Empty State */
            <EmptyState
              icon="search-outline"
              title="No Vehicles Found"
              subtitle={`No vehicles match your search criteria in ${selectedCity.name}. Try adjusting your filters or search terms.`}
              actionTitle="Reset Filters"
              onAction={handleResetFilters}
            />
          }
          renderItem={({ item }) => (
            <VehicleCard
              vehicle={item}
              isSaved={savedVehicleIds.includes(item.id)}
              onToggleSave={() => dispatch(toggleSaveVehicle(item.id))}
              onPress={() => handleVehiclePress(item)}
            />
          )}
        />
      ) : (
        /* Map View Simulation */
        <View style={styles.mapContainer}>
          <View style={styles.mapGraphic}>
            <Ionicons name="map-outline" size={64} color={colors.primary} />
            <Text style={styles.mapTitle}>Live City Mobility Map</Text>
            <Text style={styles.mapSubtitle}>
              Showing verified hubs in {selectedCity.name}
            </Text>

            {/* Map vehicle pins */}
            <View style={styles.pinsList}>
              {vehicles.slice(0, 4).map((veh) => (
                <TouchableOpacity
                  key={veh.id}
                  activeOpacity={0.8}
                  onPress={() => handleVehiclePress(veh)}
                  style={styles.mapPinCard}
                >
                  <Ionicons name="location" size={20} color={colors.primary} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.pinName}>{veh.name}</Text>
                    <Text style={styles.pinPrice}>₹{veh.pricePerDay}/day • {veh.area}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Filter Bottom Sheet Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        onApply={(newFilters) => {
          dispatch(setFilters(newFilters));
          setFilterModalVisible(false);
        }}
        onReset={handleResetFilters}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
  },
  searchHeader: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.subtle,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    marginBottom: 0,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingBottom: 4,
  },
  resultsCount: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.muted,
  },
  togglePill: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceVariant,
    padding: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  toggleBtnActive: {
    backgroundColor: colors.surface,
    ...shadows.subtle,
  },

  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  toggleTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.muted,
    fontWeight: '500',
  },
  errorContainer: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: borderRadius.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  errorText: {
    fontSize: 13,
    color: colors.danger,
    fontWeight: '600',
    flex: 1,
  },
  retryInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  retryInlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  mapContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  mapGraphic: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: borderRadius.lg,
    width: '100%',
    ...shadows.card,
  },
  mapTitle: {
    ...typography.h3,
    marginTop: 12,
    color: colors.dark,
  },
  mapSubtitle: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 4,
    textAlign: 'center',
  },

  pinsList: {
    marginTop: 20,
    width: '100%',
    gap: 10,
  },
  mapPinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    padding: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  pinName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
  },
  pinPrice: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default ExploreScreen;
