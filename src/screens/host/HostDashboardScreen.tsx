import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import colors from '../../constants/colors';
import { borderRadius, shadows, typography } from '../../constants/theme';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import { isNetworkError } from '../../services/errorHandler';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchHostDashboard, fetchHostVehicles } from '../../store/slices/hostSlice';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HostDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { summary, hostVehicles, isLoading, error } = useAppSelector((state) => state.host);
  const { user } = useAppSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    await Promise.all([
      dispatch(fetchHostDashboard()),
      dispatch(fetchHostVehicles()),
    ]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const firstName = user?.fullName?.split(' ')[0] || 'Rahul';

  // 1. Loading State (Initial Fetch)
  if (isLoading && hostVehicles.length === 0 && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
        <Loader message="Loading host dashboard..." />
      </SafeAreaView>
    );
  }

  // 2. Error State (Initial Fetch Failed)
  if (error && hostVehicles.length === 0 && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
        <ErrorState
          isOffline={isNetworkError(error)}
          message={error}
          retryAction={loadData}
          style={{ flex: 1 }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Morning, {firstName} 👋</Text>
          <Text style={styles.subtitle}>Host Control Center • Lucknow Hub</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Chat', { recipientName: 'Customer Inquiries' })}
          style={styles.chatHeaderBtn}
        >
          <Ionicons name="chatbubbles-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Earnings Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewTop}>
            <View>
              <Text style={styles.overviewLabel}>Total Gross Earnings</Text>
              <Text style={styles.overviewAmount}>₹{summary.totalGrossEarnings.toLocaleString()}</Text>
            </View>
            <View style={styles.commissionPill}>
              <Text style={styles.commissionText}>15% Platform Commission Deducted</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* 3 Mini Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCol}>
              <Text style={styles.metricVal}>₹{summary.thisMonthEarnings.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>This Month</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCol}>
              <Text style={styles.metricVal}>{summary.activeRentalsCount}</Text>
              <Text style={styles.metricLabel}>Active Rentals</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCol}>
              <Text style={styles.metricVal}>{summary.completedTripsCount}</Text>
              <Text style={styles.metricLabel}>Total Trips</Text>
            </View>
          </View>
        </View>

        {/* Quick Add Vehicle Banner */}
        <View style={styles.addBanner}>
          <View style={styles.addBannerTextCol}>
            <Text style={styles.addBannerTitle}>Earn up to ₹25,000/month</Text>
            <Text style={styles.addBannerSub}>
              List your idle car or bike with 100% verified KYC renters.
            </Text>
          </View>
          <Button
            title="List Vehicle"
            onPress={() => navigation.navigate('AddVehicleWizard')}
            variant="primary"
            size="sm"
            icon={<Ionicons name="add" size={16} color={colors.surface} />}
          />
        </View>

        {/* Your Vehicles Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Listed Vehicles ({hostVehicles.length})</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddVehicleWizard')}>
            <Text style={styles.addLink}>+ Add New</Text>
          </TouchableOpacity>
        </View>

        {/* Host Vehicle Cards */}
        {hostVehicles.length === 0 ? (
          <EmptyState
            icon="car-sport-outline"
            title="No Vehicles Listed Yet"
            subtitle="Earn up to ₹25,000/month by listing your car, bike, or scooter with verified KYC renters."
            actionTitle="List Your First Vehicle"
            onAction={() => navigation.navigate('AddVehicleWizard')}
            style={{ backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 24, marginVertical: 8 }}
          />
        ) : (
          hostVehicles.map((veh) => (
            <View key={veh.id} style={styles.vehicleCard}>
              <Image source={{ uri: veh.images[0] }} style={styles.vehicleImg} />

              <View style={styles.vehicleDetails}>
                <View style={styles.vehicleTitleRow}>
                  <Text style={styles.vehicleName} numberOfLines={1}>
                    {veh.name}
                  </Text>
                  <Badge
                    label={veh.status.replace('_', ' ').toUpperCase()}
                    variant={
                      veh.status === 'available'
                        ? 'success'
                        : veh.status === 'booked'
                        ? 'primary'
                        : 'warning'
                    }
                    size="sm"
                  />
                </View>

                <Text style={styles.vehicleReg}>{veh.registrationNumber}</Text>

                <View style={styles.vehicleStatsRow}>
                  <Text style={styles.vehicleRate}>₹{veh.pricePerDay}/day</Text>
                  <Text style={styles.vehicleTrips}>
                    ⭐ {veh.rating.toFixed(1)} • {veh.tripsCount} trips completed
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  greeting: {
    ...typography.h2,
    color: colors.dark,
  },
  subtitle: {
    ...typography.caption,
    color: colors.body,
    marginTop: 2,
  },
  chatHeaderBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  overviewCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: borderRadius.lg,
    padding: 18,
    marginBottom: 16,
    ...shadows.elevated,
  },
  overviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#BFDBFE',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  overviewAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.surface,
    marginTop: 4,
  },
  commissionPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    maxWidth: 160,
  },
  commissionText: {
    fontSize: 10,
    color: '#E0E7FF',
    fontWeight: '600',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricCol: {
    alignItems: 'center',
    flex: 1,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.surface,
  },
  metricLabel: {
    fontSize: 11,
    color: '#BFDBFE',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  addBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
    ...shadows.subtle,
  },
  addBannerTextCol: {
    flex: 1,
    marginRight: 10,
  },
  addBannerTitle: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  addBannerSub: {
    ...typography.caption,
    color: colors.body,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.dark,
  },
  addLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  vehicleCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    ...shadows.subtle,
  },
  vehicleImg: {
    width: 90,
    height: 75,
    borderRadius: borderRadius.md,
    backgroundColor: colors.inputBackground,
    marginRight: 12,
  },
  vehicleDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  vehicleTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleName: {
    ...typography.bodyBold,
    color: colors.dark,
    flex: 1,
    marginRight: 6,
  },
  vehicleReg: {
    fontSize: 11,
    color: colors.darkMuted,
    fontWeight: '500',
  },
  vehicleStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  vehicleRate: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  vehicleTrips: {
    ...typography.caption,
    color: colors.body,
  },
  emptyVehiclesCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
    ...shadows.subtle,
  },
  emptyVehiclesTitle: {
    ...typography.bodyBold,
    color: colors.dark,
    marginBottom: 4,
  },
  emptyVehiclesSub: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
});

export default HostDashboardScreen;
