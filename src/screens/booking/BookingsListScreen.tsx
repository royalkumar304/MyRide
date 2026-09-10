import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { BookingStatus } from '../../types';
import colors from '../../constants/colors';
import { borderRadius, typography } from '../../constants/theme';
import BookingCard from '../../components/booking/BookingCard';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchBookings } from '../../store/slices/bookingSlice';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const BookingsListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { bookings, isLoading, error } = useAppSelector((state) => state.bookings);

  const [activeTab, setActiveTab] = useState<BookingStatus>('upcoming');

  useEffect(() => {
    dispatch(fetchBookings(undefined));
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchBookings(undefined));
  };

  const tabs: { key: BookingStatus; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const filteredBookings = bookings.filter((b) => b.status === activeTab);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
            >
              <Text style={[styles.tabLabel, isSelected && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Error Banner with Retry */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bookings List */}
      {isLoading && bookings.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your rides from server...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="No rides booked yet"
              subtitle={`You have no ${activeTab} rentals right now.`}
              actionTitle="Find a Ride"
              onAction={() => navigation.navigate('CustomerMain')}
            />
          }
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onPress={() =>
                navigation.navigate('BookingDetails', { bookingId: item.id })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.dark,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  tabBtnActive: {
    backgroundColor: colors.primaryLight,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.darkMuted,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    ...typography.body,
    color: colors.darkMuted,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    margin: 16,
    marginBottom: 0,
    padding: 12,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },
  retryBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    marginLeft: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default BookingsListScreen;
