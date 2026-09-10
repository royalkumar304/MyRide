import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import { PickupMethod, PaymentMethodType, Booking } from '../../types';
import colors from '../../constants/colors';
import { borderRadius, shadows, typography } from '../../constants/theme';
import Button from '../../components/common/Button';
import Header from '../../components/common/Header';
import { APP_CONFIG } from '../../constants/config';
import { useAppDispatch, useAppSelector } from '../../store';
import { addBooking } from '../../store/slices/bookingSlice';
import { bookingService } from '../../services/bookingService';
import { vehicleService } from '../../services/vehicleService';
import { logger } from '../../utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingFlow'>;

export const BookingFlowScreen: React.FC<Props> = ({ navigation, route }) => {
  const { vehicle } = route.params;
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  // Flow Step: 1, 2, 3, 4
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Dynamic Dates & Duration
  const [durationDays, setDurationDays] = useState(2);

  const { startDateTimeIso, endDateTimeIso, formattedStartDate, formattedEndDate } = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() + 1); // Tomorrow
    start.setHours(10, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + durationDays);
    end.setHours(20, 0, 0, 0);

    const formatOpt: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return {
      startDateTimeIso: start.toISOString(),
      endDateTimeIso: end.toISOString(),
      formattedStartDate: start.toLocaleDateString('en-IN', formatOpt),
      formattedEndDate: end.toLocaleDateString('en-IN', formatOpt),
    };
  }, [durationDays]);

  // Step 2: Pickup method
  const [pickupMethod, setPickupMethod] = useState<PickupMethod>('self_pickup');

  // Step 4: Payment method
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('upi');

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quotePricing, setQuotePricing] = useState<any>(null);

  // Live dynamic fare calculation from backend POST /vehicles/quote (Server is source of truth)
  useEffect(() => {
    let isMounted = true;
    const fetchQuote = async () => {
      setIsQuoteLoading(true);
      setQuoteError(null);
      try {
        const res = await vehicleService.calculateFareQuote({
          vehicleId: vehicle.id,
          startDateTime: startDateTimeIso,
          endDateTime: endDateTimeIso,
          pickupType: pickupMethod,
        });

        if (isMounted) {
          setIsQuoteLoading(false);
          if (res.success && res.data?.breakdown) {
            setQuotePricing(res.data.breakdown);
          } else {
            setQuoteError(res.message || 'Unable to retrieve verified quote from server');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setIsQuoteLoading(false);
          logger.warn('[BookingFlowScreen] Error fetching fare quote:', err);
          setQuoteError(err.message || 'Error communicating with pricing server');
        }
      }
    };

    fetchQuote();
    return () => {
      isMounted = false;
    };
  }, [vehicle.id, startDateTimeIso, endDateTimeIso, pickupMethod]);

  // Server-authorized pricing (The backend is the source of truth)
  // Never trust frontend client pricing, commissions, taxes, deposit, or total
  const isServerPricingReady = !isQuoteLoading && !!quotePricing;

  const rentalSubtotal = quotePricing?.baseAmount ?? (vehicle.pricePerDay * durationDays);
  const deliveryFee = quotePricing?.deliveryFee ?? (pickupMethod === 'home_delivery' ? (vehicle.deliveryFee || 200) : 0);
  const commissionRate = quotePricing?.commissionRate ?? (APP_CONFIG.categoryCommissionPercentages[vehicle.category] || 15);
  const myRideFee = quotePricing?.commissionAmount ?? Math.round((rentalSubtotal * commissionRate) / 100);
  const securityDeposit = quotePricing?.securityDeposit ?? vehicle.securityDeposit;
  const taxes = quotePricing?.taxes ?? Math.round(myRideFee * 0.18);
  const totalPayableNow = quotePricing?.totalAmount ?? (rentalSubtotal + deliveryFee + myRideFee + taxes + securityDeposit);

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as any);
    } else {
      handleFinalPayment();
    }
  };

  const handleFinalPayment = async () => {
    setIsProcessingPayment(true);

    try {
      // 1. Create booking on live backend API
      // Server-side pricing: The backend calculates final base amount, platform commission,
      // taxes, security deposit, and totalAmount server-side from database configuration
      const res = await bookingService.createBooking({
        vehicleId: vehicle.id,
        vehicle,
        customerId: user?.id || '6a9e4e50b4a29f4bdb7b6898',
        customerName: user?.fullName || 'Rahul Sharma',
        customerPhone: user?.phoneNumber || '+91 98765 43210',
        hostId: vehicle.hostId,
        hostName: vehicle.hostName,
        hostPhone: vehicle.hostPhone || '+91 98765 00001',
        startDate: startDateTimeIso,
        endDate: endDateTimeIso,
        pickupLocation: pickupMethod === 'home_delivery' ? 'Delivered to your address' : `${vehicle.area}, ${vehicle.city}`,
        dropoffLocation: `${vehicle.area}, ${vehicle.city}`,
        pickupMethod,
        status: 'upcoming',
        pricing: {
          baseAmount: rentalSubtotal,
          durationDays,
          deliveryFee,
          commissionRate,
          commissionAmount: myRideFee,
          taxes,
          discount: 0,
          securityDeposit,
          totalAmount: totalPayableNow,
          hostEarnings: rentalSubtotal - myRideFee,
        },
        fare: {
          // Frontend estimates - backend definitively recalculates and enforces server pricing
          baseRental: rentalSubtotal,
          durationDays,
          deliveryFee,
          myRideServiceFee: myRideFee,
          discountAmount: 0,
          securityDeposit,
          taxes,
          totalPayableNow,
        },
        paymentStatus: 'pending',
      });

      if (!res.success || !res.data) {
        Alert.alert('Booking Failed', res.message || 'Unable to reserve vehicle with backend server. Please try again.');
        return;
      }

      // 2. The final booking amount and canonical ID MUST strictly come from the backend
      const confirmedBooking = res.data;
      const backendFare = confirmedBooking.fare;

      logger.debug('[BookingFlowScreen] Final server-authorized pricing applied:', {
        bookingId: confirmedBooking.id,
        serverBaseAmount: confirmedBooking.pricing?.baseAmount,
        serverCommission: confirmedBooking.pricing?.commissionAmount,
        serverTaxes: confirmedBooking.pricing?.taxes,
        serverDeposit: confirmedBooking.pricing?.securityDeposit,
        serverTotalAmount: confirmedBooking.pricing?.totalAmount,
      });

      // Populate Redux strictly with the backend-confirmed booking
      dispatch(addBooking(confirmedBooking));
      navigation.replace('BookingConfirmation', { booking: confirmedBooking });
    } catch (err: any) {
      logger.warn('[BookingFlowScreen] Error during booking creation:', err);
      Alert.alert('Booking Error', err.message || 'Network error occurred while reserving your vehicle.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />
      <Header
        title="Complete Booking"
        onBack={() => {
          if (currentStep > 1) {
            setCurrentStep((prev) => (prev - 1) as any);
          } else {
            navigation.goBack();
          }
        }}
      />

      {/* Progress Step Bar */}
      <View style={styles.stepsBar}>
        {[
          { step: 1, label: 'Dates' },
          { step: 2, label: 'Pickup' },
          { step: 3, label: 'Review' },
          { step: 4, label: 'Payment' },
        ].map((s) => {
          const isDone = s.step < currentStep;
          const isActive = s.step === currentStep;
          return (
            <View key={s.step} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  isActive && styles.stepCircleActive,
                  isDone && styles.stepCircleDone,
                ]}
              >
                {isDone ? (
                  <Ionicons name="checkmark" size={14} color={colors.surface} />
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      isActive && styles.stepNumberActive,
                    ]}
                  >
                    {s.step}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  isActive && styles.stepLabelActive,
                ]}
              >
                {s.label}
              </Text>
            </View>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Vehicle Mini Bar */}
        <View style={styles.vehicleSummaryCard}>
          <Image source={{ uri: vehicle.images[0] }} style={styles.thumbImage} />
          <View style={styles.thumbInfo}>
            <Text style={styles.thumbName}>{vehicle.name}</Text>
            <Text style={styles.thumbSpecs}>
              {vehicle.transmission} • {vehicle.fuelType} • {vehicle.area}
            </Text>
            <Text style={styles.thumbPrice}>₹{vehicle.pricePerDay}/day</Text>
          </View>
        </View>

        {/* STEP 1: Dates & Duration */}
        {currentStep === 1 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepHeading}>Step 1: Select Trip Duration</Text>
            <Text style={styles.stepSubheading}>
              Choose how many days you need the vehicle for.
            </Text>

            <View style={styles.card}>
              <View style={styles.dateBlock}>
                <Ionicons name="calendar" size={20} color={colors.primary} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.dateBlockLabel}>Pickup Date & Time</Text>
                  <Text style={styles.dateBlockValue}>{formattedStartDate}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.dateBlock}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.dateBlockLabel}>Return Date & Time</Text>
                  <Text style={styles.dateBlockValue}>{formattedEndDate}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.selectorLabel}>Rental Duration (Days)</Text>
            <View style={styles.daysSelectorRow}>
              {[1, 2, 3, 5, 7].map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => setDurationDays(d)}
                  style={[styles.dayPill, durationDays === d && styles.dayPillActive]}
                >
                  <Text style={[styles.dayPillText, durationDays === d && styles.dayPillTextActive]}>
                    {d} {d === 1 ? 'Day' : 'Days'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* STEP 2: Pickup Options */}
        {currentStep === 2 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepHeading}>Step 2: Choose Pickup Method</Text>
            <Text style={styles.stepSubheading}>
              Pick up directly from host hub or have it delivered to your doorstep.
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPickupMethod('self_pickup')}
              style={[
                styles.optionCard,
                pickupMethod === 'self_pickup' && styles.optionCardActive,
              ]}
            >
              <View style={styles.optionRadio}>
                {pickupMethod === 'self_pickup' && <View style={styles.radioDot} />}
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Self Pickup (Recommended)</Text>
                <Text style={styles.optionDesc}>
                  Pick up the vehicle from {vehicle.area}, {vehicle.city}. No extra charge.
                </Text>
                <Text style={styles.freeBadge}>FREE</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPickupMethod('home_delivery')}
              style={[
                styles.optionCard,
                pickupMethod === 'home_delivery' && styles.optionCardActive,
              ]}
            >
              <View style={styles.optionRadio}>
                {pickupMethod === 'home_delivery' && <View style={styles.radioDot} />}
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Doorstep Delivery</Text>
                <Text style={styles.optionDesc}>
                  Host drops off the vehicle at your residential or hotel location in {vehicle.city}.
                </Text>
                <Text style={styles.deliveryFeeText}>+₹{vehicle.deliveryFee || 200}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 3: Review Booking */}
        {currentStep === 3 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepHeading}>Step 3: Review Booking & Fare</Text>
            <Text style={styles.stepSubheading}>
              Check trip schedule and transparent fare details.
            </Text>

            <View style={styles.reviewCard}>
              {/* Server-Side Pricing Verification Badge */}
              {isQuoteLoading ? (
                <View style={styles.serverQuoteBadgeLoading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.serverQuoteBadgeTextLoading}>Calculating server quote...</Text>
                </View>
              ) : quotePricing ? (
                <View style={styles.serverQuoteBadge}>
                  <Ionicons name="shield-checkmark" size={14} color="#03543F" />
                  <Text style={styles.serverQuoteBadgeText}>
                    Server Verified Fare • Platform Commission: {commissionRate}%
                  </Text>
                </View>
              ) : (
                <View style={styles.serverQuoteBadgeWarning}>
                  <Ionicons name="information-circle-outline" size={14} color="#854D0E" />
                  <Text style={styles.serverQuoteBadgeTextWarning}>
                    Estimated Fare • Final amount will be authorized by server on booking
                  </Text>
                </View>
              )}

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Duration</Text>
                <Text style={styles.reviewValue}>{durationDays} Days</Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Pickup Method</Text>
                <Text style={styles.reviewValue}>
                  {pickupMethod === 'self_pickup' ? 'Self Pickup' : 'Doorstep Delivery'}
                </Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Location</Text>
                <Text style={styles.reviewValue}>{vehicle.area}, {vehicle.city}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>
                  Base Rental (₹{quotePricing?.baseAmount ? Math.round(quotePricing.baseAmount / durationDays) : vehicle.pricePerDay} × {durationDays})
                </Text>
                <Text style={styles.reviewValue}>₹{rentalSubtotal}</Text>
              </View>

              {deliveryFee > 0 ? (
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>Delivery Fee</Text>
                  <Text style={styles.reviewValue}>₹{deliveryFee}</Text>
                </View>
              ) : null}

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>MyRide Platform Fee ({commissionRate}%)</Text>
                <Text style={styles.reviewValue}>₹{myRideFee}</Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>GST & Service Taxes</Text>
                <Text style={styles.reviewValue}>₹{taxes}</Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Refundable Security Deposit</Text>
                <Text style={[styles.reviewValue, { color: colors.primary }]}>₹{securityDeposit}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.reviewTotalRow}>
                <Text style={styles.reviewTotalLabel}>Total Payable Now</Text>
                {isQuoteLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.reviewTotalValue}>₹{totalPayableNow}</Text>
                )}
              </View>
            </View>

            <View style={styles.depositNotice}>
              <Ionicons name="information-circle" size={16} color={colors.primary} />
              <Text style={styles.depositNoticeText}>
                The ₹{securityDeposit} security deposit is 100% refundable within 2 hours of vehicle drop-off.
              </Text>
            </View>

            {/* Cancellation & Refund Policy */}
            <View style={styles.cancellationPolicyCard}>
              <View style={styles.policyHeaderRow}>
                <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
                <Text style={styles.policyTitle}>Cancellation & Refund Policy</Text>
              </View>

              <View style={styles.policyItem}>
                <View style={[styles.policyDot, { backgroundColor: colors.success }]} />
                <View style={styles.policyTextWrap}>
                  <Text style={styles.policyTierTitle}>
                    Before 24 Hours of Ride Start: <Text style={{ color: colors.success, fontWeight: '700' }}>100% Refund</Text>
                  </Text>
                  <Text style={styles.policyTierDesc}>
                    Full 100% refund of total paid amount credited back to original payment source.
                  </Text>
                </View>
              </View>

              <View style={styles.policyItem}>
                <View style={[styles.policyDot, { backgroundColor: colors.danger }]} />
                <View style={styles.policyTextWrap}>
                  <Text style={styles.policyTierTitle}>
                    Within 24 Hours of Ride Start: <Text style={{ color: colors.danger, fontWeight: '700' }}>0% Refund</Text>
                  </Text>
                  <Text style={styles.policyTierDesc}>
                    Strict non-refundable cancellation window within 24 hours of ride start time.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* STEP 4: Payment */}
        {currentStep === 4 && (
          <View style={styles.stepSection}>
            <Text style={styles.stepHeading}>Step 4: Select Payment Method</Text>
            <Text style={styles.stepSubheading}>
              Secure Razorpay gateway integration for Indian UPI, Cards & Netbanking.
            </Text>

            {/* UPI Option */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPaymentMethod('upi')}
              style={[
                styles.payMethodCard,
                paymentMethod === 'upi' && styles.payMethodCardActive,
              ]}
            >
              <View style={styles.payIconCircle}>
                <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.payMethodInfo}>
                <Text style={styles.payMethodTitle}>UPI (GPay / PhonePe / Paytm / BHIM)</Text>
                <Text style={styles.payMethodDesc}>Instant zero-convenience fee payment</Text>
              </View>
              <View style={styles.optionRadio}>
                {paymentMethod === 'upi' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>

            {/* Credit / Debit Card */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPaymentMethod('card')}
              style={[
                styles.payMethodCard,
                paymentMethod === 'card' && styles.payMethodCardActive,
              ]}
            >
              <View style={styles.payIconCircle}>
                <Ionicons name="card-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.payMethodInfo}>
                <Text style={styles.payMethodTitle}>Credit / Debit Card</Text>
                <Text style={styles.payMethodDesc}>Visa, MasterCard, RuPay, Maestro</Text>
              </View>
              <View style={styles.optionRadio}>
                {paymentMethod === 'card' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>

            {/* Net Banking */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setPaymentMethod('netbanking')}
              style={[
                styles.payMethodCard,
                paymentMethod === 'netbanking' && styles.payMethodCardActive,
              ]}
            >
              <View style={styles.payIconCircle}>
                <Ionicons name="business-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.payMethodInfo}>
                <Text style={styles.payMethodTitle}>Net Banking</Text>
                <Text style={styles.payMethodDesc}>All major Indian banks supported</Text>
              </View>
              <View style={styles.optionRadio}>
                {paymentMethod === 'netbanking' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>

            {/* Razorpay Badge */}
            <View style={styles.razorpaySecurityBadge}>
              <Ionicons name="shield-checkmark" size={16} color={colors.success} />
              <Text style={styles.razorpaySecurityText}>
                Secured by Razorpay • 256-bit SSL Encryption
              </Text>
            </View>

            {/* Step 4 Policy Assurance */}
            <View style={styles.step4PolicyBanner}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={styles.step4PolicyText}>
                <Text style={{ fontWeight: '700' }}>Cancellation Window:</Text> 100% refund if cancelled 24+ hrs before start. 0% refund within 24 hrs.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Floating Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.footerLabel}>Total Amount</Text>
          {isQuoteLoading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.footerAmount, { fontSize: 13, color: colors.muted }]}>Calculating...</Text>
            </View>
          ) : (
            <Text style={styles.footerAmount}>₹{totalPayableNow}</Text>
          )}
        </View>

        <Button
          title={currentStep === 4 ? `Pay ₹${totalPayableNow}` : 'Continue'}
          onPress={handleNextStep}
          variant="primary"
          size="lg"
          disabled={isQuoteLoading}
          loading={isProcessingPayment}
          style={styles.continueBtn}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceVariant,
  },
  stepsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  stepCircleDone: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  stepNumberActive: {
    color: colors.primary,
  },
  stepLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '500',
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingBottom: 110,
  },
  vehicleSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...shadows.subtle,
  },
  thumbImage: {
    width: 70,
    height: 55,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.inputBackground,
    marginRight: 12,
  },
  thumbInfo: {
    flex: 1,
  },
  thumbName: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  thumbSpecs: {
    fontSize: 11,
    color: colors.body,
    marginTop: 2,
  },
  thumbPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  stepSection: {
    marginTop: 4,
  },
  stepHeading: {
    ...typography.h3,
    color: colors.dark,
  },
  stepSubheading: {
    ...typography.caption,
    color: colors.body,
    marginTop: 4,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    ...shadows.card,
  },
  dateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBlockLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
  },
  dateBlockValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 12,
  },
  selectorLabel: {
    ...typography.bodyBold,
    color: colors.dark,
    marginBottom: 10,
  },
  daysSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayPill: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    marginHorizontal: 3,
    alignItems: 'center',
  },
  dayPillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  dayPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.darkMuted,
  },
  dayPillTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 14,
    ...shadows.subtle,
  },
  optionCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '40',
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  optionDesc: {
    ...typography.caption,
    color: colors.body,
    marginTop: 4,
  },
  freeBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
    marginTop: 6,
  },
  deliveryFeeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 6,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewLabel: {
    ...typography.body,
    color: colors.body,
  },
  reviewValue: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  reviewTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
  },
  reviewTotalLabel: {
    ...typography.h3,
    color: colors.dark,
  },
  reviewTotalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  depositNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: borderRadius.md,
    marginTop: 14,
  },
  depositNoticeText: {
    ...typography.caption,
    color: colors.primaryDark,
    marginLeft: 8,
    flex: 1,
  },
  payMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 12,
  },
  payMethodCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '40',
  },
  payIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  payMethodInfo: {
    flex: 1,
  },
  payMethodTitle: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  payMethodDesc: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  razorpaySecurityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  razorpaySecurityText: {
    fontSize: 12,
    color: colors.darkMuted,
    marginLeft: 6,
    fontWeight: '500',
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
  footerLabel: {
    fontSize: 11,
    color: colors.muted,
  },
  footerAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  continueBtn: {
    minWidth: 160,
  },
  cancellationPolicyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 14,
    ...shadows.subtle,
  },
  policyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  policyTitle: {
    ...typography.bodyBold,
    color: colors.dark,
    marginLeft: 8,
  },
  policyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  policyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 8,
  },
  policyTextWrap: {
    flex: 1,
  },
  policyTierTitle: {
    fontSize: 13,
    color: colors.dark,
    fontWeight: '600',
    marginBottom: 2,
  },
  policyTierDesc: {
    fontSize: 11,
    color: colors.muted,
    lineHeight: 15,
  },
  step4PolicyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: borderRadius.md,
    marginTop: 14,
  },
  step4PolicyText: {
    fontSize: 11,
    color: colors.primaryDark,
    marginLeft: 8,
    flex: 1,
    lineHeight: 15,
  },
  serverQuoteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DEF7EC',
    borderWidth: 1,
    borderColor: '#BCF0DA',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  serverQuoteBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#03543F',
    marginLeft: 6,
    flex: 1,
  },
  serverQuoteBadgeLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  serverQuoteBadgeTextLoading: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.muted,
    marginLeft: 6,
  },
  serverQuoteBadgeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF08A',
    borderWidth: 1,
    borderColor: '#FDE047',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  serverQuoteBadgeTextWarning: {
    fontSize: 12,
    fontWeight: '500',
    color: '#854D0E',
    marginLeft: 6,
    flex: 1,
  },
});

export default BookingFlowScreen;
