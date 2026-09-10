import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/types';
import colors from '../../constants/colors';
import { borderRadius, shadows, typography } from '../../constants/theme';
import Button from '../../components/common/Button';

type Props = NativeStackScreenProps<RootStackParamList, 'BookingConfirmation'>;

export const BookingConfirmationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { booking } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surface} />

      <View style={styles.content}>
        {/* Animated Checkmark Circle */}
        <View style={styles.successCircle}>
          <Ionicons name="checkmark-sharp" size={48} color={colors.surface} />
        </View>

        <Text style={styles.title}>Booking Confirmed! 🎉</Text>
        <Text style={styles.subtitle}>
          Your vehicle is reserved. Host has been notified.
        </Text>

        {/* Booking ID Pill */}
        <View style={styles.idContainer}>
          <Text style={styles.idLabel}>BOOKING ID</Text>
          <Text style={styles.idValue}>{booking.id}</Text>
        </View>

        {/* Vehicle Summary Card */}
        <View style={styles.card}>
          <Image source={{ uri: booking.vehicle.images[0] }} style={styles.vehicleImage} />
          
          <View style={styles.cardDetails}>
            <Text style={styles.vehicleName}>{booking.vehicle.name}</Text>
            <Text style={styles.hostName}>Host: {booking.vehicle.hostName} (✓ Verified)</Text>

            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.primary} />
              <Text style={styles.infoText}>{booking.startDate}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color={colors.primary} />
              <Text style={styles.infoText}>{booking.pickupLocation}</Text>
            </View>

            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>Amount Paid:</Text>
              <Text style={styles.fareValue}>₹{booking.fare.totalPayableNow}</Text>
            </View>
          </View>
        </View>

        <View style={styles.instructionsBox}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
          <Text style={styles.instructionsText}>
            Keep your original Driving License ready for the Digital Vehicle Handover before starting your ride.
          </Text>
        </View>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <Button
          title="View Booking Details"
          variant="primary"
          size="lg"
          onPress={() => {
            navigation.replace('BookingDetails', { bookingId: booking.id });
          }}
          style={styles.actionBtn}
        />

        <Button
          title="Back to Home"
          variant="secondary"
          size="md"
          onPress={() => {
            navigation.replace('CustomerMain');
          }}
          style={[styles.actionBtn, { marginTop: 10 }]}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: 24,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...shadows.card,
  },
  title: {
    ...typography.h1,
    color: colors.dark,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.body,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  idContainer: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: 20,
  },
  idLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
  },
  idValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: 2,
    letterSpacing: 1.5,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  vehicleImage: {
    width: '100%',
    height: 140,
  },
  cardDetails: {
    padding: 14,
  },
  vehicleName: {
    ...typography.h3,
    color: colors.dark,
  },
  hostName: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    ...typography.caption,
    color: colors.body,
    marginLeft: 6,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fareLabel: {
    fontSize: 13,
    color: colors.darkMuted,
    fontWeight: '600',
  },
  fareValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.dark,
  },
  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: borderRadius.md,
    width: '100%',
  },
  instructionsText: {
    ...typography.caption,
    color: colors.primaryDark,
    marginLeft: 8,
    flex: 1,
  },
  bottomBar: {
    padding: 24,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionBtn: {
    width: '100%',
  },
});

export default BookingConfirmationScreen;
