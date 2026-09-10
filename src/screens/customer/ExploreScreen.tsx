import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import colors from '../../constants/colors';
import { borderRadius, shadows, typography } from '../../constants/theme';
import Input from '../../components/common/Input';
import VehicleCard from '../../components/vehicle/VehicleCard';
import FilterModal from '../../components/vehicle/FilterModal';
import EmptyState from '../../components/common/EmptyState';
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

  const { vehicles, savedVehicleIds, searchQuery, filters } = useAppSelector(
    (state) => state.vehicles
  );
  const { selectedCity } = useAppSelector((state) => state.ui);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Load vehicles from real API
  React.useEffect(() => {
    let isMounted = true;
    const fetchVehicles = async () => {
      try {
        dispatch(setVehiclesLoading(true));
        const res = await vehicleService.getVehicles({
          ...filters,
          city: selectedCity?.name,
        });
        if (isMounted && res.success && res.data) {
          dispatch(setVehicles(res.data));
        }
      } catch (err) {
        console.warn('[ExploreScreen] Error fetching vehicles:', err);
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
  }, [filters.category, filters.sortBy, filters.minPrice, filters.maxPrice, selectedCity?.name]);

  // Filter logic
  const filteredVehicles = vehicles.filter((v) => {
    if (filters.category && filters.category !== 'all' && v.category !== filters.category) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        v.name.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.area.toLowerCase().includes(q) ||
        v.city.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filters.fuelTypes && filters.fuelTypes.length > 0 && !filters.fuelTypes.includes(v.fuelType)) {
      return false;
    }
    if (filters.transmissions && filters.transmissions.length > 0 && !filters.transmissions.includes(v.transmission)) {
      return false;
    }
    if (filters.deliveryOnly && !v.deliveryAvailable) {
      return false;
    }
    if (filters.instantBookingOnly && !v.instantBooking) {
      return false;
    }
    if (filters.verifiedOnly && !v.isHostVerified) {
      return false;
    }
    return true;
  });

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
            {filteredVehicles.length} {filteredVehicles.length === 1 ? 'vehicle' : 'vehicles'} found
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

      {/* Main View Mode Rendering */}
      {viewMode === 'list' ? (
        <FlatList
          data={filteredVehicles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="No Vehicles Found"
              subtitle="Try adjusting your search keywords or clearing some filters."
              actionTitle="Reset Filters"
              onAction={() => dispatch(resetFilters())}
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

            {/* Simulated map pins */}
            <View style={styles.pinsList}>
              {filteredVehicles.slice(0, 4).map((veh) => (
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

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        onApply={(newFilters) => dispatch(setFilters(newFilters))}
        onReset={() => dispatch(resetFilters())}
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
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    marginBottom: 0,
    marginRight: 10,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  resultsCount: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.darkMuted,
  },
  togglePill: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  toggleBtnActive: {
    backgroundColor: colors.surface,
    ...shadows.subtle,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    marginLeft: 4,
  },
  toggleTextActive: {
    color: colors.primary,
  },
  listContent: {
    padding: 16,
  },
  mapContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  mapGraphic: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  mapTitle: {
    ...typography.h3,
    color: colors.dark,
    marginTop: 12,
  },
  mapSubtitle: {
    ...typography.caption,
    color: colors.body,
    marginTop: 2,
    marginBottom: 20,
  },
  pinsList: {
    width: '100%',
  },
  mapPinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    padding: 12,
    borderRadius: borderRadius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pinName: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  pinPrice: {
    ...typography.caption,
    color: colors.primaryDark,
    marginTop: 2,
  },
});

export default ExploreScreen;
