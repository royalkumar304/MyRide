import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Booking, BookingStatus } from '../../types';
import colors from '../../constants/colors';
import { borderRadius, shadows, typography } from '../../constants/theme';
import Badge from '../common/Badge';

export interface BookingCardProps {
  booking: Booking;
  onPress: () => void;
  isHostView?: boolean;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onPress,
  isHostView = false,
}) => {
  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'upcoming':
        return <Badge label="Upcoming" variant="primary" size="sm" />;
      case 'active':
        return <Badge label="Active Ride" variant="warning" size="sm" />;
      case 'completed':
        return <Badge label="Completed" variant="success" size="sm" />;
      case 'cancelled':
        return <Badge label="Cancelled" variant="danger" size="sm" />;
      default:
        return <Badge label={status} variant="neutral" size="sm" />;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={styles.card}
    >
      {/* Top Bar: Booking ID & Status */}
      <View style={styles.topBar}>
        <View style={styles.bookingIdWrap}>
          <Text style={styles.bookingIdLabel}>Booking ID:</Text>
          <Text style={styles.bookingId}>{booking.id}</Text>
        </View>
        {getStatusBadge(booking.status)}
      </View>

      <View style={styles.divider} />

      {/* Main Content */}
      <View style={styles.contentRow}>
        <Image
          source={{ uri: booking.vehicle.images[0] }}
          style={styles.vehicleImage}
          resizeMode="cover"
        />

        <View style={styles.detailsCol}>
          <Text style={styles.vehicleName} numberOfLines={1}>
            {booking.vehicle.name}
          </Text>
          <Text style={styles.regNumber}>{booking.vehicle.registrationNumber}</Text>

          <View style={styles.infoLine}>
            <Ionicons name="calendar-outline" size={13} color={colors.primary} />
            <Text style={styles.infoText} numberOfLines={1}>
              {booking.startDate}
            </Text>
          </View>

          <View style={styles.infoLine}>
            <Ionicons name="location-outline" size={13} color={colors.primary} />
            <Text style={styles.infoText} numberOfLines={1}>
              {booking.pickupLocation}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Bottom Bar: Amount & CTA */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.fareLabel}>Total Paid</Text>
          <Text style={styles.fareAmount}>₹{booking.fare.totalPayableNow}</Text>
        </View>

        <View style={styles.ctaButton}>
          <Text style={styles.ctaText}>
            {booking.status === 'active' ? 'Digital Return' : 'View Details'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingIdWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingIdLabel: {
    ...typography.caption,
    color: colors.muted,
    marginRight: 4,
  },
  bookingId: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.dark,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleImage: {
    width: 80,
    height: 70,
    borderRadius: borderRadius.md,
    backgroundColor: colors.inputBackground,
    marginRight: 12,
  },
  detailsCol: {
    flex: 1,
  },
  vehicleName: {
    ...typography.bodyBold,
    color: colors.dark,
  },
  regNumber: {
    fontSize: 11,
    color: colors.darkMuted,
    marginBottom: 4,
    fontWeight: '500',
  },
  infoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  infoText: {
    ...typography.caption,
    color: colors.body,
    marginLeft: 4,
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  fareLabel: {
    fontSize: 11,
    color: colors.muted,
  },
  fareAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.dark,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 4,
  },
});

export default BookingCard;
