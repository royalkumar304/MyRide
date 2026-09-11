import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  StatusBar,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import colors from '../../constants/colors';
import { borderRadius, shadows, typography } from '../../constants/theme';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Header from '../../components/common/Header';
import Loader from '../../components/common/Loader';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import { isNetworkError } from '../../services/errorHandler';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  updateBookingStatus,
  cancelBookingWithRefund,
  fetchBookingById,
  cancelBookingThunk,
  fetchBookings,
} from '../../store/slices/bookingSlice';
import { bookingService } from '../../services/bookingService';
import { paymentService } from '../../services/paymentService';
import { openRazorpayCheckout } from '../../services/razorpayCheckout';
import { calculateCancellationRefund } from '../../utils/cancellationPolicy';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingDetails'>;

const CANCELLATION_REASONS = [
  'Change of travel plans',
  'Found alternative transport',
  'Unexpected personal emergency',
  'Host requested to cancel/reschedule',
  'Other reason',
];

export const BookingDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { bookingId } = route.params;
  const dispatch = useAppDispatch();
  const { bookings, activeBooking, isLoading, error } = useAppSelector((state) => state.bookings);

  useEffect(() => {
    if (bookingId) {
      dispatch(fetchBookingById(bookingId));
    }
  }, [bookingId, dispatch]);

  const booking = bookings.find((b) => b.id === bookingId) || (activeBooking?.id === bookingId ? activeBooking : undefined);

  // Cancellation Modal state
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRetryingPayment, setIsRetryingPayment] = useState(false);
  const [selectedReason, setSelectedReason] = useState(CANCELLATION_REASONS[0]);

  const isPaymentPending =
    booking &&
    (booking.status === 'pending' ||
      booking.paymentStatus === 'pending' ||
      booking.paymentStatus === 'failed') &&
    booking.status !== 'cancelled' &&
    booking.status !== 'completed';

  const handleRetryPayment = async () => {
    if (!booking) return;
    setIsRetryingPayment(true);

    try {
      const orderRes = await paymentService.createRazorpayOrder(booking.id);
      if (!orderRes.success || !orderRes.data) {
        Alert.alert(
          'Payment Order Error',
          orderRes.message || 'Unable to initialize Razorpay payment order on server.'
        );
        return;
      }

      const orderData = orderRes.data;
      const checkoutRes = await openRazorpayCheckout({
        keyId: orderData.keyId,
        orderId: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'MyRide Mobility',
        description: `Booking #${booking.id} • ${booking.vehicle?.name}`,
      });

      if (!checkoutRes.success) {
        if (checkoutRes.error.code === 'CANCELLED') {
          Alert.alert('Payment Cancelled', 'Payment was cancelled. You can retry paying whenever you are ready.');
        } else {
          Alert.alert('Payment Failed', checkoutRes.error.message);
        }
        return;
      }

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = checkoutRes.data;
      const verifyRes = await paymentService.verifyPayment({
        bookingId: booking.id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paymentMethod: 'upi',
      });

      if (verifyRes.success) {
        dispatch(fetchBookingById(booking.id));
        dispatch(fetchBookings(undefined));
        Alert.alert('Payment Confirmed 🎉', 'Your payment was verified and booking is now confirmed!');
      } else {
        Alert.alert('Verification Notice', verifyRes.message || 'Payment signature could not be verified on server.');
      }
    } catch (err: any) {
      Alert.alert('Payment Error', err.message || 'An error occurred during payment processing.');
    } finally {
      setIsRetryingPayment(false);
    }
  };

  // Compute live cancellation refund status
  const refundCalc = calculateCancellationRefund(
    booking?.startDate || new Date().toISOString(),
    booking?.fare?.totalPayableNow || 0,
    booking?.fare?.securityDeposit || 0
  );

  const handleStartRide = () => {
    if (booking) {
      navigation.navigate('DigitalPickup', { bookingId: booking.id });
    }
  };

  const handleEndRide = () => {
    if (booking) {
      navigation.navigate('ReturnVehicle', { bookingId: booking.id });
    }
  };

  const handleOpenCancelModal = () => {
    setIsCancelModalVisible(true);
  };

  const handleConfirmCancellation = async () => {
    if (!booking) return;
    setIsCancelling(true);

    try {
      // Cancel on live backend server and update Redux directly from actual API response
      const actionResult = await dispatch(
        cancelBookingThunk({
          bookingId: booking.id,
          reason: selectedReason,
          cancelledBy: 'customer',
          refundPercentage: refundCalc.refundPercentage,
          refundAmount: refundCalc.refundAmount,
        })
      );

      setIsCancelling(false);
      setIsCancelModalVisible(false);

      if (cancelBookingThunk.fulfilled.match(actionResult)) {
        // Refetch latest server bookings cache
        dispatch(fetchBookings(undefined));

        const message =
          refundCalc.refundPercentage === 100
            ? `Booking cancelled successfully. A full 100% refund of ₹${refundCalc.refundAmount} has been processed back to your payment method.`
            : `Booking cancelled. Per policy, 0% refund applies as this was cancelled within 24 hours of ride start.`;

        Alert.alert(
          refundCalc.refundPercentage === 100 ? '100% Refund Initiated 🎉' : 'Booking Cancelled (0% Refund)',
          message,
          [{ text: 'OK' }]
        );
      } else {
        const errMsg = (actionResult.payload as string) || 'Failed to cancel booking on server.';
        Alert.alert('Cancellation Failed', errMsg);
      }
    } catch (err: any) {
      setIsCancelling(false);
      Alert.alert('Cancellation Error', err.message || 'Failed to cancel booking on server.');
    }
  };

  // 1. Loading State
  if (!booking && isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
        <Header title="Booking Details" onBack={() => navigation.goBack()} />
        <Loader message="Loading booking details from server..." />
      </SafeAreaView>
    );
  }

  // 2. Error State
  if (!booking && error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
        <Header title="Booking Details" onBack={() => navigation.goBack()} />
        <ErrorState
          isOffline={isNetworkError(error)}
          message={error}
          retryAction={() => dispatch(fetchBookingById(bookingId))}
          style={{ flex: 1 }}
        />
      </SafeAreaView>
    );
  }

  // 3. Empty State (Not found)
  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
        <Header title="Booking Details" onBack={() => navigation.goBack()} />
        <EmptyState
          icon="receipt-outline"
          title="Booking Not Found"
          subtitle="The requested booking could not be retrieved from the server."
          actionTitle="Back to Bookings"
          onAction={() => navigation.goBack()}
          style={{ flex: 1 }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header title="Booking Details" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Header */}
        <View style={styles.statusCard}>
          <View>
            <Text style={styles.bookingIdLabel}>BOOKING ID</Text>
            <Text style={styles.bookingIdValue}>{booking.id}</Text>
          </View>
          <Badge
            label={booking.status.toUpperCase()}
            variant={
              booking.status === 'active'
                ? 'warning'
                : booking.status === 'completed'
                ? 'success'
                : booking.status === 'cancelled'
                ? 'danger'
                : 'primary'
            }
          />
        </View>

        {/* 24-Hour Policy Banner for Upcoming Bookings */}
        {booking.status === 'upcoming' && (
          <View
            style={[
              styles.policyBanner,
              refundCalc.isEligibleFor100PercentRefund
                ? styles.policyBannerSuccess
                : styles.policyBannerWarning,
            ]}
          >
            <Ionicons
              name={refundCalc.isEligibleFor100PercentRefund ? 'shield-checkmark' : 'alert-circle'}
              size={18}
              color={
                refundCalc.isEligibleFor100PercentRefund ? colors.success : colors.danger
              }
            />
            <View style={styles.policyBannerTextWrap}>
              <Text
                style={[
                  styles.policyBannerTitle,
                  {
                    color: refundCalc.isEligibleFor100PercentRefund
                      ? colors.success
                      : colors.danger,
                  },
                ]}
              >
                {refundCalc.isEligibleFor100PercentRefund
                  ? '100% Refund Window Active'
                  : '0% Refund Window (Within 24 Hours)'}
              </Text>
              <Text style={styles.policyBannerDesc}>
                {refundCalc.isEligibleFor100PercentRefund
                  ? `${refundCalc.formattedTimeUntilStart} before start. Free cancellation with 100% full refund.`
                  : `${refundCalc.formattedTimeUntilStart} before start. Non-refundable (0% refund) if cancelled now.`}
              </Text>
            </View>
          </View>
        )}

        {/* Cancellation Summary for Cancelled Bookings */}
        {booking.status === 'cancelled' && (
          <View style={styles.cancelledSummaryCard}>
            <View style={styles.cancelledHeaderRow}>
              <Ionicons name="close-circle" size={22} color={colors.danger} />
              <Text style={styles.cancelledTitle}>Cancellation & Refund Summary</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.cancelledDetailRow}>
              <Text style={styles.cancelledDetailLabel}>Cancelled By:</Text>
              <Text style={styles.cancelledDetailValue}>
                {booking.cancelledBy === 'host' ? 'Vehicle Host' : 'Customer (You)'}
              </Text>
            </View>

            {booking.cancellationReason ? (
              <View style={styles.cancelledDetailRow}>
                <Text style={styles.cancelledDetailLabel}>Reason:</Text>
                <Text style={styles.cancelledDetailValue}>{booking.cancellationReason}</Text>
              </View>
            ) : null}

            <View style={styles.cancelledDetailRow}>
              <Text style={styles.cancelledDetailLabel}>Refund Status:</Text>
              <Badge
                label={
                  (booking.refundPercentage ?? (booking.refundAmount && booking.refundAmount > 0 ? 100 : 0)) === 100
                    ? '100% REFUNDED'
                    : '0% REFUND (NON-REFUNDABLE)'
                }
                variant={
                  (booking.refundPercentage ?? (booking.refundAmount && booking.refundAmount > 0 ? 100 : 0)) === 100
                    ? 'success'
                    : 'danger'
                }
                size="sm"
              />
            </View>

            <View style={styles.cancelledDetailRow}>
              <Text style={styles.cancelledDetailLabel}>Refund Amount:</Text>
              <Text
                style={[
                  styles.refundAmountText,
                  {
                    color:
                      (booking.refundPercentage ?? (booking.refundAmount && booking.refundAmount > 0 ? 100 : 0)) === 100
                        ? colors.success
                        : colors.danger,
                  },
                ]}
              >
                ₹{booking.refundAmount !== undefined ? booking.refundAmount : (booking.refundPercentage === 100 ? booking.fare.totalPayableNow : 0)}
              </Text>
            </View>

            <Text style={styles.cancelledPolicyNote}>
              {(booking.refundPercentage ?? (booking.refundAmount && booking.refundAmount > 0 ? 100 : 0)) === 100
                ? '✅ 100% full refund processed to original payment method (reflected in 2-4 hours).'
                : '⚠️ Per MyRide policy, 0% refund applies to cancellations made within 24 hours of ride start.'}
            </Text>
          </View>
        )}

        {/* Vehicle Card */}
        <View style={styles.card}>
          <View style={styles.vehicleRow}>
            <Image source={{ uri: booking.vehicle.images[0] }} style={styles.vehicleImage} />
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>{booking.vehicle.name}</Text>
              <Text style={styles.vehicleReg}>{booking.vehicle.registrationNumber}</Text>
              <Text style={styles.vehicleSpecs}>
                {booking.vehicle.transmission} • {booking.vehicle.fuelType}
              </Text>
            </View>
          </View>
        </View>

        {/* Schedule & Handover Times */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rental Schedule</Text>

          <View style={styles.timelineItem}>
            <View style={styles.timelineDot} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.timelineLabel}>Pick-up</Text>
              <Text style={styles.timelineValue}>{booking.startDate}</Text>
              <Text style={styles.timelineSub}>{booking.pickupLocation}</Text>
            </View>
          </View>

          <View style={styles.timelineLine} />

          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, { backgroundColor: colors.danger }]} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.timelineLabel}>Drop-off / Return</Text>
              <Text style={styles.timelineValue}>{booking.endDate}</Text>
              <Text style={styles.timelineSub}>{booking.dropoffLocation}</Text>
            </View>
          </View>

          {booking.modificationNote ? (
            <View style={styles.modificationNoteBox}>
              <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
              <Text style={styles.modificationNoteText}>{booking.modificationNote}</Text>
            </View>
          ) : null}
        </View>

        {/* Host Contact Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Host Information</Text>
          <View style={styles.hostRow}>
            <View style={styles.hostAvatar}>
              <Text style={styles.hostLetter}>{booking.hostName.charAt(0)}</Text>
            </View>
            <View style={styles.hostInfo}>
              <Text style={styles.hostName}>{booking.hostName}</Text>
              <Text style={styles.hostPhone}>{booking.hostPhone}</Text>
            </View>
          </View>

          <View style={styles.hostActionsRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Chat', { recipientName: booking.hostName, bookingId: booking.id })}
              style={styles.hostActionBtn}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
              <Text style={styles.hostActionText}>Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => Alert.alert('Calling Host', `Calling ${booking.hostPhone}`)}
              style={styles.hostActionBtn}
            >
              <Ionicons name="call-outline" size={18} color={colors.primary} />
              <Text style={styles.hostActionText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => Alert.alert('Directions', `Navigating to ${booking.pickupLocation}`)}
              style={styles.hostActionBtn}
            >
              <Ionicons name="navigate-outline" size={18} color={colors.primary} />
              <Text style={styles.hostActionText}>Directions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fare & Security Deposit Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Breakdown</Text>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Rental Base Fare</Text>
            <Text style={styles.fareValue}>₹{booking.fare.baseRental}</Text>
          </View>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>MyRide Service Fee</Text>
            <Text style={styles.fareValue}>₹{booking.fare.myRideServiceFee}</Text>
          </View>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Refundable Security Deposit</Text>
            <Text style={[styles.fareValue, { color: colors.primary }]}>₹{booking.fare.securityDeposit}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.fareRow}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>₹{booking.fare.totalPayableNow}</Text>
          </View>
        </View>

        {/* Payment Pending / Retry Payment Action */}
        {isPaymentPending && (
          <Button
            title={isRetryingPayment ? 'Connecting to Razorpay...' : 'Pay Now / Complete Payment'}
            onPress={handleRetryPayment}
            variant="primary"
            size="lg"
            disabled={isRetryingPayment}
            icon={<Ionicons name="card-outline" size={20} color={colors.surface} />}
            style={styles.primaryActionBtn}
          />
        )}

        {/* Ride Actions: Digital Pickup / Return */}
        {booking.status === 'upcoming' && (
          <Button
            title="Start Ride (Digital Handover)"
            onPress={handleStartRide}
            variant="success"
            size="lg"
            icon={<Ionicons name="speedometer-outline" size={20} color={colors.surface} />}
            style={styles.primaryActionBtn}
          />
        )}

        {booking.status === 'active' && (
          <Button
            title="End Ride (Digital Return)"
            onPress={handleEndRide}
            variant="danger"
            size="lg"
            icon={<Ionicons name="checkmark-done-circle" size={20} color={colors.surface} />}
            style={styles.primaryActionBtn}
          />
        )}

        {booking.status === 'completed' && !booking.rated && (
          <Button
            title="Rate & Review Ride"
            onPress={() =>
              navigation.navigate('Review', {
                bookingId: booking.id,
                vehicleId: booking.vehicleId,
                vehicleName: booking.vehicle.name,
              })
            }
            variant="outline"
            size="lg"
            icon={<Ionicons name="star-outline" size={20} color={colors.primary} />}
            style={styles.primaryActionBtn}
          />
        )}

        {booking.status === 'upcoming' && (
          <TouchableOpacity onPress={handleOpenCancelModal} style={styles.cancelLink}>
            <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
            <Text style={styles.cancelText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Cancellation Confirmation Modal */}
      <Modal
        visible={isCancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cancel Booking</Text>
              <TouchableOpacity onPress={() => setIsCancelModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.dark} />
              </TouchableOpacity>
            </View>

            {/* Refund Calculation Box */}
            <View
              style={[
                styles.modalRefundBox,
                refundCalc.isEligibleFor100PercentRefund
                  ? styles.modalRefundBoxSuccess
                  : styles.modalRefundBoxDanger,
              ]}
            >
              <View style={styles.refundBoxHeader}>
                <Ionicons
                  name={refundCalc.isEligibleFor100PercentRefund ? 'gift-outline' : 'alert-circle'}
                  size={20}
                  color={refundCalc.isEligibleFor100PercentRefund ? colors.success : colors.danger}
                />
                <Text
                  style={[
                    styles.refundBoxTitle,
                    {
                      color: refundCalc.isEligibleFor100PercentRefund
                        ? colors.success
                        : colors.danger,
                    },
                  ]}
                >
                  {refundCalc.isEligibleFor100PercentRefund
                    ? '100% Full Refund Eligible'
                    : '0% Refund (Non-Refundable)'}
                </Text>
              </View>

              <Text style={styles.refundBoxAmount}>
                Refund Amount: ₹{refundCalc.refundAmount}
              </Text>
              <Text style={styles.refundBoxDesc}>{refundCalc.policyNote}</Text>
            </View>

            {/* Reason Selector */}
            <Text style={styles.reasonSectionTitle}>Please select reason for cancellation:</Text>
            <View style={styles.reasonsList}>
              {CANCELLATION_REASONS.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    onPress={() => setSelectedReason(reason)}
                    style={[
                      styles.reasonOption,
                      isSelected && styles.reasonOptionSelected,
                    ]}
                  >
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={isSelected ? colors.primary : colors.muted}
                    />
                    <Text
                      style={[
                        styles.reasonText,
                        isSelected && styles.reasonTextSelected,
                      ]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Actions */}
            <View style={styles.modalActionsRow}>
              <Button
                title="Keep Ride"
                variant="outline"
                size="md"
                onPress={() => setIsCancelModalVisible(false)}
                style={{ flex: 1, marginRight: 6 }}
              />
              <Button
                title={refundCalc.isEligibleFor100PercentRefund ? 'Cancel (100% Refund)' : 'Cancel (0% Refund)'}
                variant="danger"
                size="md"
                onPress={handleConfirmCancellation}
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    ...shadows.subtle,
  },
  bookingIdLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  bookingIdValue: {
    ...typography.h3,
    color: colors.dark,
  },
  policyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: 12,
  },
  policyBannerSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  policyBannerWarning: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  policyBannerTextWrap: {
    marginLeft: 8,
    flex: 1,
  },
  policyBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  policyBannerDesc: {
    fontSize: 11,
    color: colors.darkMuted,
    lineHeight: 15,
  },
  cancelledSummaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.dangerLight,
    marginBottom: 12,
    ...shadows.subtle,
  },
  cancelledHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cancelledTitle: {
    ...typography.bodyBold,
    color: colors.danger,
    marginLeft: 8,
  },
  cancelledDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cancelledDetailLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  cancelledDetailValue: {
    ...typography.captionBold,
    color: colors.dark,
  },
  refundAmountText: {
    fontSize: 16,
    fontWeight: '800',
  },
  cancelledPolicyNote: {
    fontSize: 11,
    color: colors.darkMuted,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    lineHeight: 15,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    ...shadows.subtle,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.dark,
    marginBottom: 12,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleImage: {
    width: 80,
    height: 60,
    borderRadius: borderRadius.md,
    marginRight: 14,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    ...typography.bodyBold,
    color: colors.dark,
    marginBottom: 2,
  },
  vehicleReg: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  vehicleSpecs: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 5,
  },
  timelineLine: {
    width: 2,
    height: 20,
    backgroundColor: colors.border,
    marginLeft: 4,
    marginVertical: 4,
  },
  timelineLabel: {
    ...typography.caption,
    color: colors.muted,
  },
  timelineValue: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  timelineSub: {
    ...typography.caption,
    color: colors.body,
  },
  modificationNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: 8,
    borderRadius: borderRadius.sm,
    marginTop: 10,
  },
  modificationNoteText: {
    fontSize: 11,
    color: colors.primaryDark,
    marginLeft: 6,
    flex: 1,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hostAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  hostLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  hostInfo: {
    flex: 1,
  },
  hostName: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  hostPhone: {
    ...typography.caption,
    color: colors.body,
  },
  hostActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 10,
  },
  hostActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    flex: 1,
    marginHorizontal: 4,
  },
  hostActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 4,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fareLabel: {
    ...typography.body,
    color: colors.body,
  },
  fareValue: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 8,
  },
  totalLabel: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  primaryActionBtn: {
    marginTop: 8,
    marginBottom: 12,
  },
  cancelLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '600',
    marginLeft: 6,
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
  modalRefundBox: {
    padding: 14,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: 16,
  },
  modalRefundBoxSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  modalRefundBoxDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  refundBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  refundBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  refundBoxAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.dark,
    marginBottom: 4,
  },
  refundBoxDesc: {
    fontSize: 12,
    color: colors.darkMuted,
    lineHeight: 16,
  },
  reasonSectionTitle: {
    ...typography.captionBold,
    color: colors.dark,
    marginBottom: 10,
  },
  reasonsList: {
    marginBottom: 18,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: borderRadius.sm,
    marginBottom: 4,
  },
  reasonOptionSelected: {
    backgroundColor: colors.surfaceVariant,
  },
  reasonText: {
    fontSize: 13,
    color: colors.body,
    marginLeft: 8,
  },
  reasonTextSelected: {
    color: colors.dark,
    fontWeight: '600',
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default BookingDetailsScreen;
