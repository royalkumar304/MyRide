import React, { useState, useEffect } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import colors from '../../constants/colors';
import { borderRadius, shadows, typography } from '../../constants/theme';
import Badge from '../../components/common/Badge';
import PriceCard from '../../components/vehicle/PriceCard';
import HostCard from '../../components/vehicle/HostCard';
import Button from '../../components/common/Button';
import Header from '../../components/common/Header';
import Loader from '../../components/common/Loader';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import { getFriendlyErrorMessage, isNetworkError } from '../../services/errorHandler';
import { useAppDispatch, useAppSelector } from '../../store';
import { upsertVehicle, toggleSaveVehicle } from '../../store/slices/vehicleSlice';
import { vehicleService } from '../../services/vehicleService';
import { Vehicle } from '../../types';
import { APP_CONFIG } from '../../constants/config';

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleDetails'>;

export const VehicleDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { vehicleId } = route.params;
  const dispatch = useAppDispatch();

  const { vehicles, savedVehicleIds } = useAppSelector((state) => state.vehicles);
  const matchedVehicle = vehicles.find((v) => v.id === vehicleId);

  const [vehicle, setVehicle] = useState<Vehicle | null>(matchedVehicle || null);
  const [loading, setLoading] = useState(!matchedVehicle);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(390);

  const loadVehicle = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await vehicleService.getVehicleById(vehicleId);
      if (res.success && res.data) {
        setVehicle(res.data);
        dispatch(upsertVehicle(res.data));
      } else {
        setError(getFriendlyErrorMessage(res.message || 'Requested data was not found.', res.statusCode || 404));
      }
    } catch (err: any) {
      console.warn('[VehicleDetailsScreen] Error loading vehicle:', err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (matchedVehicle) {
      setVehicle(matchedVehicle);
      setLoading(false);
      return;
    }

    loadVehicle();
  }, [vehicleId, matchedVehicle, dispatch]);

  const isSaved = vehicle ? savedVehicleIds.includes(vehicle.id) : false;

  const handleBookNow = () => {
    if (vehicle) {
      navigation.navigate('BookingFlow', { vehicle });
    }
  };

  const handleChatWithHost = () => {
    if (vehicle) {
      navigation.navigate('Chat', {
        recipientName: vehicle.hostName,
      });
    }
  };

  const handleCallHost = () => {
    const phone = vehicle?.hostPhone || APP_CONFIG.supportPhone;
    if (phone) {
      Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`).catch((err) => {
        console.warn('Failed to open phone dialer:', err);
      });
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
        <Header title="Vehicle Details" onBack={() => navigation.goBack()} />
        <Loader message="Loading vehicle details..." />
      </SafeAreaView>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
        <Header title="Vehicle Details" onBack={() => navigation.goBack()} />
        <ErrorState
          isOffline={isNetworkError(error)}
          message={error}
          retryAction={loadVehicle}
          style={{ flex: 1 }}
        />
      </SafeAreaView>
    );
  }

  // 3. Empty State (404 Not Found)
  if (!vehicle) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
        <Header title="Vehicle Details" onBack={() => navigation.goBack()} />
        <EmptyState
          icon="car-outline"
          title="Vehicle Not Found"
          subtitle="This vehicle is no longer available or was not found on the platform."
          actionTitle="Explore Other Rides"
          onAction={() => navigation.goBack()}
          style={{ flex: 1 }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title={vehicle.name}
        onBack={() => navigation.goBack()}
        rightActionIcon={isSaved ? 'heart' : 'heart-outline'}
        onRightAction={() => dispatch(toggleSaveVehicle(vehicle.id))}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Top Image Carousel */}
        <View
          style={styles.carouselContainer}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0) setCarouselWidth(w);
          }}
        >
          <FlatList
            data={vehicle.images}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / carouselWidth);
              setActiveImageIndex(idx);
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={[styles.carouselImage, { width: carouselWidth }]} resizeMode="cover" />
            )}
          />

          {/* Dots Indicator */}
          <View style={styles.carouselDots}>
            {vehicle.images.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.carouselDot,
                  activeImageIndex === idx && styles.carouselDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.detailsBody}>
          {/* Title & Badges */}
          <View style={styles.titleSection}>
            <View style={styles.badgesRow}>
              {vehicle.isHostVerified ? (
                <Badge label="✓ Verified Host" variant="success" size="sm" style={{ marginRight: 6 }} />
              ) : null}
              {vehicle.instantBooking ? (
                <Badge label="⚡ Instant Booking" variant="primary" size="sm" />
              ) : null}
            </View>

            <Text style={styles.title}>{vehicle.name}</Text>
            <Text style={styles.subtitle}>
              {vehicle.brand} • {vehicle.model} • {vehicle.year} Model
            </Text>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text style={styles.statScore}>{vehicle.rating.toFixed(1)}</Text>
                <Text style={styles.statLabel}>({vehicle.tripsCount} trips)</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Ionicons name="speedometer-outline" size={16} color={colors.primary} />
                <Text style={styles.statLabel}>{vehicle.transmission}</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Ionicons name="water-outline" size={16} color={colors.primary} />
                <Text style={styles.statLabel}>{vehicle.fuelType}</Text>
              </View>
            </View>
          </View>

          {/* Pickup Location */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Pick-up Location</Text>
            <View style={styles.locationRow}>
              <View style={styles.locationIconCircle}>
                <Ionicons name="location" size={20} color={colors.primary} />
              </View>
              <View style={styles.locationTextCol}>
                <Text style={styles.locationName}>
                  {vehicle.area}, {vehicle.city}
                </Text>
                <Text style={styles.locationNote}>
                  Exact address & landmark unlocked upon booking confirmation
                </Text>
              </View>
            </View>
          </View>

          {/* Key Features */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Key Features</Text>
            <View style={styles.featuresGrid}>
              {vehicle.features.map((feat, idx) => (
                <View key={idx} style={styles.featurePill}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.featureText}>{feat}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Transparent Pricing Breakdown */}
          <PriceCard
            baseRental={vehicle.pricePerDay}
            durationDays={1}
            deliveryFee={vehicle.deliveryAvailable ? 0 : 0}
            commissionPercentage={
              APP_CONFIG.categoryCommissionPercentages[vehicle.category] || APP_CONFIG.defaultCommissionPercentage
            }
            securityDeposit={vehicle.securityDeposit}
          />

          {/* Host Information */}
          <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Host Information</Text>
          <HostCard
            hostName={vehicle.hostName}
            rating={vehicle.hostRating}
            trips={vehicle.hostTrips}
            isVerified={vehicle.isHostVerified}
            onChatPress={handleChatWithHost}
            onCallPress={handleCallHost}
          />

          {/* Rental Guidelines */}
          {vehicle.guidelines && vehicle.guidelines.length > 0 ? (
            <View style={[styles.sectionCard, { marginTop: 12 }]}>
              <Text style={styles.sectionTitle}>Rental Guidelines</Text>
              {vehicle.guidelines.map((guide, idx) => (
                <View key={idx} style={styles.guideRow}>
                  <Ionicons name="ellipse" size={6} color={colors.darkMuted} style={{ marginTop: 6 }} />
                  <Text style={styles.guideText}>{guide}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomPriceLabel}>Rental Price</Text>
          <View style={styles.priceRow}>
            <Text style={styles.bottomPriceAmount}>₹{vehicle.pricePerDay}</Text>
            <Text style={styles.bottomPriceUnit}>/day</Text>
          </View>
        </View>

        <View style={styles.bottomBtnRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleChatWithHost}
            style={styles.chatIconBtn}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primary} />
          </TouchableOpacity>

          <Button
            title="Book Now"
            onPress={handleBookNow}
            variant="primary"
            size="lg"
            style={styles.bookNowBtn}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  carouselContainer: {
    height: 240,
    backgroundColor: colors.inputBackground,
    position: 'relative',
  },
  carouselImage: {
    width: '100%',
    height: 240,
  },
  carouselDots: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 3,
  },
  carouselDotActive: {
    width: 16,
    backgroundColor: colors.surface,
  },
  detailsBody: {
    padding: 16,
  },
  titleSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    ...shadows.card,
  },
  badgesRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  title: {
    ...typography.h1,
    fontSize: 24,
    color: colors.dark,
  },
  subtitle: {
    ...typography.body,
    color: colors.darkMuted,
    marginTop: 2,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statScore: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.dark,
    marginLeft: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.body,
    marginLeft: 4,
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    ...shadows.card,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.dark,
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationTextCol: {
    flex: 1,
  },
  locationName: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  locationNote: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: borderRadius.full,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureText: {
    fontSize: 12,
    color: colors.dark,
    marginLeft: 6,
    fontWeight: '500',
  },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  guideText: {
    ...typography.body,
    color: colors.body,
    marginLeft: 8,
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.elevated,
  },
  bottomPriceCol: {
    justifyContent: 'center',
  },
  bottomPriceLabel: {
    fontSize: 11,
    color: colors.muted,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  bottomPriceAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  bottomPriceUnit: {
    fontSize: 13,
    color: colors.muted,
    marginLeft: 2,
  },
  bottomBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatIconBtn: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bookNowBtn: {
    minWidth: 150,
  },
});

export default VehicleDetailsScreen;
