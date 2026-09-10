import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
  Modal,
  TextInput,
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
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Loader from '../../components/common/Loader';
import { isNetworkError } from '../../services/errorHandler';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  updateHostBookingStatus,
  hostCancelBooking,
  hostRescheduleBooking,
  fetchHostBookings,
  hostCancelBookingThunk,
} from '../../store/slices/hostSlice';
import {
  cancelBookingWithRefund,
  rescheduleBooking,
} from '../../store/slices/bookingSlice';
import { Booking } from '../../types';
import {
  checkHostChangeEligibility,
  HostChangeEligibility,
} from '../../utils/cancellationPolicy';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HostBookingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const { hostBookings, isLoading, error } = useAppSelector((state) => state.host);

  const [activeTab, setActiveTab] = useState<'requests' | 'confirmed' | 'active' | 'completed'>('confirmed');

  // Load live server bookings on mount
  React.useEffect(() => {
    dispatch(fetchHostBookings());
  }, [dispatch]);

  // Selected booking for action
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Modals
  const [isInformModalVisible, setIsInformModalVisible] = useState(false);
  const [isChangeRideModalVisible, setIsChangeRideModalVisible] = useState(false);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);

  // Form states
  const [hasInformedCustomer, setHasInformedCustomer] = useState(false);
  const [pendingActionType, setPendingActionType] = useState<'change' | 'cancel' | null>(null);
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [modificationNote, setModificationNote] = useState('');
  const [cancelReason, setCancelReason] = useState('Vehicle mechanical issue / maintenance');

  const tabs: { key: 'requests' | 'confirmed' | 'active' | 'completed'; label: string }[] = [
    { key: 'requests', label: 'New Requests' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
  ];

  const filteredBookings = hostBookings.filter((b) => {
    if (activeTab === 'requests') return b.status === 'pending';
    if (activeTab === 'confirmed') return b.status === 'upcoming';
    if (activeTab === 'active') return b.status === 'active';
    if (activeTab === 'completed') return b.status === 'completed';
    return true;
  });

  const handleAccept = (booking: Booking) => {
    dispatch(updateHostBookingStatus({ id: booking.id, status: 'confirmed' }));
    Alert.alert('Booking Accepted! 🎉', `Customer ${booking.customerName} has been notified.`);
  };

  const handleReject = (booking: Booking) => {
    dispatch(updateHostBookingStatus({ id: booking.id, status: 'cancelled' }));
    Alert.alert('Booking Rejected', 'The booking request has been declined.');
  };

  // Host Ride Action Trigger
  const handleHostInitiateChange = (booking: Booking) => {
    setSelectedBooking(booking);
    setNewStartDate(booking.startDate);
    setNewEndDate(booking.endDate);
    setModificationNote('');
    setHasInformedCustomer(false);

    const eligibility = checkHostChangeEligibility(booking.startDate);

    if (eligibility.canDirectlyChange) {
      // > 24 hours: Host can directly modify
      setIsChangeRideModalVisible(true);
    } else {
      // < 24 hours: Host MUST inform customer first
      setPendingActionType('change');
      setIsInformModalVisible(true);
    }
  };

  const handleHostInitiateCancel = (booking: Booking) => {
    setSelectedBooking(booking);
    setCancelReason('Vehicle mechanical issue / maintenance');
    setHasInformedCustomer(false);

    const eligibility = checkHostChangeEligibility(booking.startDate);

    if (eligibility.canDirectlyChange) {
      // > 24 hours: Normal cancel dialog
      setIsCancelModalVisible(true);
    } else {
      // < 24 hours: Host MUST inform customer first
      setPendingActionType('cancel');
      setIsInformModalVisible(true);
    }
  };

  const handleProceedAfterInforming = () => {
    if (!hasInformedCustomer) {
      Alert.alert(
        'Confirmation Required',
        'Please contact the customer and confirm the checkbox that you have informed them before proceeding.'
      );
      return;
    }

    setIsInformModalVisible(false);

    if (pendingActionType === 'change') {
      setIsChangeRideModalVisible(true);
    } else if (pendingActionType === 'cancel') {
      setIsCancelModalVisible(true);
    }
  };

  const handleConfirmChangeRide = () => {
    if (!selectedBooking) return;

    const note = modificationNote.trim() || 'Schedule adjusted by host';

    // Update in host slice
    dispatch(
      hostRescheduleBooking({
        id: selectedBooking.id,
        newStartDate,
        newEndDate,
        modificationNote: note,
        hostInformedCustomer: hasInformedCustomer,
      })
    );

    // Update in customer booking slice
    dispatch(
      rescheduleBooking({
        id: selectedBooking.id,
        newStartDate,
        newEndDate,
        modificationNote: note,
        hostInformedCustomer: hasInformedCustomer,
      })
    );

    setIsChangeRideModalVisible(false);
    Alert.alert(
      'Ride Changed Successfully',
      `Booking ${selectedBooking.id} updated. Customer ${selectedBooking.customerName} will see the updated schedule.`
    );
  };

  const handleConfirmHostCancel = async () => {
    if (!selectedBooking) return;

    try {
      // Execute cancellation on live backend server
      const actionRes = await dispatch(
        hostCancelBookingThunk({
          bookingId: selectedBooking.id,
          reason: cancelReason,
          refundAmount: selectedBooking.fare.totalPayableNow,
          hostInformedCustomer: hasInformedCustomer,
        })
      );

      setIsCancelModalVisible(false);

      if (hostCancelBookingThunk.fulfilled.match(actionRes)) {
        // Refetch latest server bookings cache
        dispatch(fetchHostBookings());
        Alert.alert(
          'Booking Cancelled',
          `Booking ${selectedBooking.id} has been cancelled. 100% full refund has been initiated to the customer.`
        );
      } else {
        Alert.alert('Cancellation Error', (actionRes.payload as string) || 'Failed to cancel booking on server');
      }
    } catch (err: any) {
      setIsCancelModalVisible(false);
      Alert.alert('Error', err.message || 'Error communicating with server');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Host Bookings</Text>
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
              <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 1. Loading State */}
      {isLoading && hostBookings.length === 0 ? (
        <Loader message="Loading host bookings..." />
      ) : error && hostBookings.length === 0 ? (
        /* 2. Error State */
        <ErrorState
          isOffline={isNetworkError(error)}
          message={error}
          retryAction={() => dispatch(fetchHostBookings())}
          style={{ flex: 1 }}
        />
      ) : (
        /* 3. List & 4. Empty State */
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => dispatch(fetchHostBookings())}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="document-text-outline"
              title={`No ${activeTab} bookings`}
              subtitle="New customer booking requests will appear here."
            />
          }
        renderItem={({ item }) => {
          const eligibility = checkHostChangeEligibility(item.startDate);

          return (
            <View style={styles.bookingCard}>
              {/* Top row */}
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.customerName}>{item.customerName}</Text>
                  <Text style={styles.bookingIdText}>ID: {item.id}</Text>
                </View>
                <Badge
                  label={item.status.toUpperCase()}
                  variant={item.status === 'active' ? 'warning' : 'primary'}
                  size="sm"
                />
              </View>

              <View style={styles.divider} />

              {/* Vehicle & Date Info */}
              <Text style={styles.vehicleName}>{item.vehicle.name}</Text>
              <View style={styles.infoLine}>
                <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                <Text style={styles.infoText}>{item.startDate} to {item.endDate}</Text>
              </View>

              <View style={styles.infoLine}>
                <Ionicons name="location-outline" size={14} color={colors.primary} />
                <Text style={styles.infoText}>{item.pickupLocation}</Text>
              </View>

              {item.modificationNote ? (
                <View style={styles.modificationBadge}>
                  <Ionicons name="create-outline" size={14} color={colors.primaryDark} />
                  <Text style={styles.modificationBadgeText}>Note: {item.modificationNote}</Text>
                </View>
              ) : null}

              {/* Payout Calculation */}
              <View style={styles.payoutBox}>
                <View>
                  <Text style={styles.payoutLabel}>Host Net Payout (85%)</Text>
                  <Text style={styles.payoutDesc}>
                    Gross: ₹{item.fare.baseRental} - 15% Comm: ₹{item.fare.myRideServiceFee}
                  </Text>
                </View>
                <Text style={styles.payoutAmount}>
                  ₹{item.fare.baseRental - item.fare.myRideServiceFee}
                </Text>
              </View>

              {/* Confirmed 24-Hour Policy Indicator */}
              {activeTab === 'confirmed' && (
                <View
                  style={[
                    styles.policyNoticeTag,
                    eligibility.canDirectlyChange
                      ? styles.policyNoticeTagSafe
                      : styles.policyNoticeTagUrgent,
                  ]}
                >
                  <Ionicons
                    name={eligibility.canDirectlyChange ? 'time-outline' : 'warning-outline'}
                    size={14}
                    color={eligibility.canDirectlyChange ? colors.success : colors.danger}
                  />
                  <Text
                    style={[
                      styles.policyNoticeTagText,
                      {
                        color: eligibility.canDirectlyChange
                          ? colors.success
                          : colors.danger,
                      },
                    ]}
                  >
                    {eligibility.canDirectlyChange
                      ? `${eligibility.formattedTimeUntilStart} before ride (Direct changes allowed)`
                      : `${eligibility.formattedTimeUntilStart} before ride (Must inform customer first)`}
                  </Text>
                </View>
              )}

              {/* Host Actions */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('Chat', { recipientName: item.customerName, bookingId: item.id })}
                  style={styles.actionBtn}
                >
                  <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                  <Text style={styles.actionBtnText}>Message</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => Alert.alert('Call Customer', `Calling ${item.customerPhone}`)}
                  style={styles.actionBtn}
                >
                  <Ionicons name="call-outline" size={16} color={colors.primary} />
                  <Text style={styles.actionBtnText}>Call</Text>
                </TouchableOpacity>

                {activeTab === 'confirmed' && (
                  <>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleHostInitiateChange(item)}
                      style={[styles.actionBtn, { backgroundColor: colors.primaryLight }]}
                    >
                      <Ionicons name="create-outline" size={15} color={colors.primary} />
                      <Text style={[styles.actionBtnText, { color: colors.primary }]}>Change</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleHostInitiateCancel(item)}
                      style={[styles.actionBtn, { backgroundColor: colors.dangerLight }]}
                    >
                      <Ionicons name="close-circle-outline" size={15} color={colors.danger} />
                      <Text style={[styles.actionBtnText, { color: colors.danger }]}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                )}

                {activeTab === 'requests' && (
                  <>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleReject(item)}
                      style={[styles.actionBtn, { backgroundColor: colors.dangerLight }]}
                    >
                      <Text style={[styles.actionBtnText, { color: colors.danger }]}>Reject</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleAccept(item)}
                      style={[styles.actionBtn, { backgroundColor: colors.successLight }]}
                    >
                      <Text style={[styles.actionBtnText, { color: colors.success }]}>Accept</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          );
        }}
      />
      )}

      {/* Modal 1: Mandatory Customer Informing (Within 24 Hours) */}
      <Modal
        visible={isInformModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsInformModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.urgentHeaderRow}>
              <Ionicons name="warning" size={24} color={colors.danger} />
              <Text style={styles.urgentTitle}>Customer Informing Required</Text>
            </View>

            <View style={styles.urgentAlertBox}>
              <Text style={styles.urgentAlertText}>
                Ride starts in less than 24 hours! Per MyRide Host Policy, you must contact and inform the customer directly before modifying or cancelling this booking.
              </Text>
            </View>

            {selectedBooking && (
              <View style={styles.customerQuickContact}>
                <Text style={styles.customerQuickLabel}>Customer: {selectedBooking.customerName}</Text>
                <Text style={styles.customerQuickPhone}>Phone: {selectedBooking.customerPhone}</Text>

                <View style={styles.contactBtnRow}>
                  <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={() => {
                      setIsInformModalVisible(false);
                      navigation.navigate('Chat', {
                        recipientName: selectedBooking.customerName,
                        bookingId: selectedBooking.id,
                      });
                    }}
                  >
                    <Ionicons name="chatbubble" size={16} color={colors.primary} />
                    <Text style={styles.contactBtnText}>Message Customer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={() => Alert.alert('Calling Customer', `Calling ${selectedBooking.customerPhone}`)}
                  >
                    <Ionicons name="call" size={16} color={colors.primary} />
                    <Text style={styles.contactBtnText}>Call Customer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Checkbox Acknowledgment */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setHasInformedCustomer(!hasInformedCustomer)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={hasInformedCustomer ? 'checkbox' : 'square-outline'}
                size={22}
                color={hasInformedCustomer ? colors.primary : colors.muted}
              />
              <Text style={styles.checkboxLabel}>
                I confirm that I have informed the customer directly about this {pendingActionType === 'change' ? 'ride change' : 'cancellation'}.
              </Text>
            </TouchableOpacity>

            <View style={styles.modalActionsRow}>
              <Button
                title="Go Back"
                variant="outline"
                size="md"
                onPress={() => setIsInformModalVisible(false)}
                style={{ flex: 1, marginRight: 6 }}
              />
              <Button
                title="Proceed"
                variant="primary"
                size="md"
                disabled={!hasInformedCustomer}
                onPress={handleProceedAfterInforming}
                style={{ flex: 1, marginLeft: 6, opacity: hasInformedCustomer ? 1 : 0.5 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Host Change / Reschedule Ride */}
      <Modal
        visible={isChangeRideModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsChangeRideModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Ride Details</Text>
              <TouchableOpacity onPress={() => setIsChangeRideModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.dark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>New Start Date & Time</Text>
            <TextInput
              style={styles.input}
              value={newStartDate}
              onChangeText={setNewStartDate}
              placeholder="e.g. 2026-09-12 11:00 AM"
            />

            <Text style={styles.inputLabel}>New End Date & Time</Text>
            <TextInput
              style={styles.input}
              value={newEndDate}
              onChangeText={setNewEndDate}
              placeholder="e.g. 2026-09-14 09:00 PM"
            />

            <Text style={styles.inputLabel}>Reason / Adjustment Note</Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              value={modificationNote}
              onChangeText={setModificationNote}
              placeholder="e.g. Vehicle prepped for 11:00 AM pickup per customer agreement"
              multiline
            />

            <View style={styles.modalActionsRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="md"
                onPress={() => setIsChangeRideModalVisible(false)}
                style={{ flex: 1, marginRight: 6 }}
              />
              <Button
                title="Save Changes"
                variant="primary"
                size="md"
                onPress={handleConfirmChangeRide}
                style={{ flex: 1, marginLeft: 6 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 3: Host Cancel Booking */}
      <Modal
        visible={isCancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.danger }]}>Host Cancel Booking</Text>
              <TouchableOpacity onPress={() => setIsCancelModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.dark} />
              </TouchableOpacity>
            </View>

            <View style={styles.cancelRefundNotice}>
              <Ionicons name="information-circle" size={18} color={colors.primary} />
              <Text style={styles.cancelRefundNoticeText}>
                When a host cancels, customer automatically receives a 100% full refund (₹{selectedBooking?.fare.totalPayableNow}).
              </Text>
            </View>

            <Text style={styles.inputLabel}>Cancellation Reason</Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Reason for cancellation (e.g. Mechanical problem)"
              multiline
            />

            <View style={styles.modalActionsRow}>
              <Button
                title="Keep Booking"
                variant="outline"
                size="md"
                onPress={() => setIsCancelModalVisible(false)}
                style={{ flex: 1, marginRight: 6 }}
              />
              <Button
                title="Confirm Cancel"
                variant="danger"
                size="md"
                onPress={handleConfirmHostCancel}
                style={{ flex: 1, marginLeft: 6 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.darkMuted,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  bookingIdText: {
    ...typography.caption,
    color: colors.muted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 10,
  },
  vehicleName: {
    ...typography.h3,
    color: colors.dark,
    marginBottom: 6,
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    ...typography.caption,
    color: colors.body,
    marginLeft: 6,
  },
  modificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: 6,
    borderRadius: borderRadius.sm,
    marginVertical: 4,
  },
  modificationBadgeText: {
    fontSize: 11,
    color: colors.primaryDark,
    marginLeft: 6,
  },
  payoutBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: 10,
    borderRadius: borderRadius.md,
    marginTop: 8,
    marginBottom: 8,
  },
  payoutLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  payoutDesc: {
    fontSize: 10,
    color: colors.primary,
  },
  payoutAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  policyNoticeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    marginBottom: 8,
  },
  policyNoticeTagSafe: {
    backgroundColor: '#ECFDF5',
  },
  policyNoticeTagUrgent: {
    backgroundColor: '#FEF2F2',
  },
  policyNoticeTagText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 5,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceVariant,
    paddingVertical: 7,
    borderRadius: borderRadius.md,
    flex: 1,
    marginHorizontal: 3,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    ...shadows.elevated,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.dark,
  },
  urgentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  urgentTitle: {
    ...typography.h3,
    color: colors.danger,
    marginLeft: 8,
  },
  urgentAlertBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    padding: 12,
    borderRadius: borderRadius.md,
    marginBottom: 14,
  },
  urgentAlertText: {
    fontSize: 12,
    color: colors.danger,
    lineHeight: 16,
  },
  customerQuickContact: {
    backgroundColor: colors.surfaceVariant,
    padding: 12,
    borderRadius: borderRadius.md,
    marginBottom: 14,
  },
  customerQuickLabel: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  customerQuickPhone: {
    ...typography.caption,
    color: colors.body,
    marginTop: 2,
    marginBottom: 10,
  },
  contactBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    flex: 1,
    marginHorizontal: 4,
  },
  contactBtnText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginLeft: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkboxLabel: {
    fontSize: 12,
    color: colors.dark,
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputLabel: {
    ...typography.captionBold,
    color: colors.dark,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.dark,
    marginBottom: 14,
  },
  cancelRefundNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: 10,
    borderRadius: borderRadius.md,
    marginBottom: 14,
  },
  cancelRefundNoticeText: {
    fontSize: 12,
    color: colors.primaryDark,
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
});

export default HostBookingsScreen;
