import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Vehicle } from '../../types';
import colors from '../../constants/colors';
import { borderRadius, shadows, typography } from '../../constants/theme';
import Badge from '../common/Badge';

export interface VehicleCardProps {
  vehicle: Vehicle;
  onPress: () => void;
  isSaved?: boolean;
  onToggleSave?: () => void;
  style?: ViewStyle;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onPress,
  isSaved = false,
  onToggleSave,
  style,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      style={[styles.card, style]}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: vehicle.images[0] }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Favorite Heart Button */}
        {onToggleSave ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onToggleSave}
            style={styles.favoriteButton}
          >
            <Ionicons
              name={isSaved ? 'heart' : 'heart-outline'}
              size={22}
              color={isSaved ? colors.danger : colors.dark}
            />
          </TouchableOpacity>
        ) : null}

        {/* Instant Booking or Verified Badge */}
        <View style={styles.topBadges}>
          {vehicle.instantBooking ? (
            <Badge
              label="⚡ Instant Book"
              variant="success"
              size="sm"
              style={styles.badgeMargin}
            />
          ) : null}
          {vehicle.isHostVerified ? (
            <Badge
              label="✓ Verified Host"
              variant="primary"
              size="sm"
            />
          ) : null}
        </View>
      </View>

      <View style={styles.content}>
        {/* Title and Rating */}
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {vehicle.name}
          </Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={13} color="#F59E0B" />
            <Text style={styles.ratingText}>
              {vehicle.rating.toFixed(1)}{' '}
              <Text style={styles.tripsText}>({vehicle.tripsCount} trips)</Text>
            </Text>
          </View>
        </View>

        {/* Transmission & Fuel Specs */}
        <View style={styles.specsRow}>
          <Text style={styles.specItem}>
            {vehicle.transmission} • {vehicle.fuelType} • {vehicle.seatingCapacity} Seats
          </Text>
        </View>

        {/* Distance and Location */}
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.primary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {vehicle.distanceKm ? `${vehicle.distanceKm} km away • ` : ''}
            {vehicle.area}, {vehicle.city}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Price and CTA */}
        <View style={styles.footerRow}>
          <View>
            <View style={styles.priceRow}>
              <Text style={styles.priceAmount}>₹{vehicle.pricePerDay}</Text>
              <Text style={styles.priceUnit}>/day</Text>
            </View>
            {vehicle.deliveryAvailable ? (
              <Text style={styles.deliveryTag}>Home Delivery Available</Text>
            ) : null}
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  imageWrapper: {
    position: 'relative',
    height: 180,
    backgroundColor: colors.inputBackground,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.subtle,
  },
  topBadges: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
  },
  badgeMargin: {
    marginRight: 6,
  },
  content: {
    padding: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    ...typography.h3,
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginLeft: 3,
  },
  tripsText: {
    fontWeight: '500',
    color: '#B45309',
    fontSize: 11,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  specItem: {
    ...typography.caption,
    color: colors.darkMuted,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationText: {
    ...typography.caption,
    color: colors.body,
    marginLeft: 4,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  priceUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.muted,
    marginLeft: 2,
  },
  deliveryTag: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
    marginTop: 2,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 2,
  },
});

export default VehicleCard;
