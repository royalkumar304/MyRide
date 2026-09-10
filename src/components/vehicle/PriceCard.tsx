import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../../constants/colors';
import { borderRadius, shadows, typography } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export interface PriceCardProps {
  baseRental: number;
  durationDays?: number;
  deliveryFee?: number;
  commissionPercentage?: number;
  securityDeposit: number;
  discount?: number;
}

export const PriceCard: React.FC<PriceCardProps> = ({
  baseRental,
  durationDays = 1,
  deliveryFee = 0,
  commissionPercentage = 15,
  securityDeposit,
  discount = 0,
}) => {
  const rentalSubtotal = baseRental * durationDays;
  const myRideFee = Math.round((rentalSubtotal * commissionPercentage) / 100);
  const totalRentalCost = rentalSubtotal + deliveryFee + myRideFee - discount;
  const totalDueNow = totalRentalCost + securityDeposit;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Pricing Breakdown</Text>

      {/* Base Rental */}
      <View style={styles.row}>
        <Text style={styles.label}>
          Base Rental ({durationDays} {durationDays === 1 ? 'day' : 'days'} × ₹{baseRental})
        </Text>
        <Text style={styles.value}>₹{rentalSubtotal}</Text>
      </View>

      {/* Delivery Fee */}
      {deliveryFee > 0 ? (
        <View style={styles.row}>
          <Text style={styles.label}>Home Delivery Fee</Text>
          <Text style={styles.value}>₹{deliveryFee}</Text>
        </View>
      ) : null}

      {/* MyRide Platform Service Fee */}
      <View style={styles.row}>
        <View style={styles.labelWithIcon}>
          <Text style={styles.label}>MyRide Platform Fee ({commissionPercentage}%)</Text>
          <Ionicons name="information-circle-outline" size={14} color={colors.muted} style={{ marginLeft: 4 }} />
        </View>
        <Text style={styles.value}>₹{myRideFee}</Text>
      </View>

      {/* Explanatory note for 15% fee */}
      <View style={styles.noteBox}>
        <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
        <Text style={styles.noteText}>
          The {commissionPercentage}% MyRide fee powers 24/7 roadside assistance, host verification, and digital handover insurance support.
        </Text>
      </View>

      {/* Discount */}
      {discount > 0 ? (
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.success }]}>Promo Discount</Text>
          <Text style={[styles.value, { color: colors.success }]}>-₹{discount}</Text>
        </View>
      ) : null}

      {/* Security Deposit */}
      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Refundable Security Deposit</Text>
          <Text style={styles.sublabel}>100% refunded upon safe vehicle return</Text>
        </View>
        <Text style={[styles.value, { color: colors.primaryDark }]}>₹{securityDeposit}</Text>
      </View>

      <View style={styles.divider} />

      {/* Total Due Now */}
      <View style={styles.totalRow}>
        <View>
          <Text style={styles.totalLabel}>Total Payable Now</Text>
          <Text style={styles.totalSublabel}>Includes ₹{securityDeposit} refundable deposit</Text>
        </View>
        <Text style={styles.totalValue}>₹{totalDueNow}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
    marginVertical: 8,
  },
  title: {
    ...typography.h3,
    marginBottom: 14,
    color: colors.dark,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    ...typography.body,
    color: colors.body,
  },
  sublabel: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '500',
  },
  value: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primaryLight,
    padding: 10,
    borderRadius: borderRadius.md,
    marginBottom: 12,
  },
  noteText: {
    ...typography.caption,
    color: colors.primaryDark,
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  totalLabel: {
    ...typography.h3,
    color: colors.dark,
  },
  totalSublabel: {
    ...typography.caption,
    color: colors.muted,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
});

export default PriceCard;
