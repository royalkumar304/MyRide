import { isUsingMemoryStore } from '../config/db';
import { memoryStore } from '../config/store';
import BookingModel from '../models/Booking';
import VehicleModel from '../models/Vehicle';
import { isTimeOverlap } from '@myride/utils';

export async function checkVehicleAvailability(params: {
  vehicleId: string;
  startDateTime: string | Date;
  endDateTime: string | Date;
}): Promise<{
  isAvailable: boolean;
  reason?: string;
}> {
  let vehicle: any = null;
  if (isUsingMemoryStore()) {
    vehicle = memoryStore.vehicles.find(
      (v) => v._id === params.vehicleId || v.id === params.vehicleId
    );
  } else {
    vehicle = await VehicleModel.findById(params.vehicleId);
  }

  if (!vehicle) {
    return { isAvailable: false, reason: 'Vehicle not found' };
  }

  if (vehicle.verificationStatus && vehicle.verificationStatus !== 'APPROVED') {
    return { isAvailable: false, reason: 'Vehicle is currently not approved for public rental' };
  }

  if (vehicle.availability && !vehicle.availability.isAvailable) {
    return { isAvailable: false, reason: 'Host has temporarily paused vehicle availability' };
  }

  const startReq = new Date(params.startDateTime);
  const endReq = new Date(params.endDateTime);

  if (startReq >= endReq) {
    return { isAvailable: false, reason: 'Return date & time must be after pickup date & time' };
  }

  const now = new Date();

  if (isUsingMemoryStore()) {
    // Lazily mark expired reservations in memory store
    memoryStore.bookings.forEach((b) => {
      if (
        (b.vehicleId === params.vehicleId || (b.vehicle && b.vehicle._id === params.vehicleId)) &&
        b.bookingStatus === 'PAYMENT_PENDING' &&
        b.paymentStatus === 'pending' &&
        b.reservationExpiresAt &&
        new Date(b.reservationExpiresAt) <= now
      ) {
        b.bookingStatus = 'EXPIRED';
      }
    });

    const isBlockingStatus = (b: any) => {
      if (['CONFIRMED', 'UPCOMING', 'PICKUP_PENDING', 'ACTIVE'].includes(b.bookingStatus)) {
        return true;
      }
      if (['CREATED', 'PAYMENT_PENDING'].includes(b.bookingStatus)) {
        if (!b.reservationExpiresAt) return true;
        return new Date(b.reservationExpiresAt) > now;
      }
      return false;
    };

    const conflictingBookings = memoryStore.bookings.filter(
      (b) =>
        (b.vehicleId === params.vehicleId || (b.vehicle && b.vehicle._id === params.vehicleId)) &&
        isBlockingStatus(b) &&
        new Date(b.startDateTime) < endReq &&
        new Date(b.endDateTime) > startReq
    );

    const hasActiveReservationConflict = (vehicle.activeReservations || []).some((r: any) => {
      if (!['PAYMENT_PENDING', 'CONFIRMED', 'UPCOMING', 'PICKUP_PENDING', 'ACTIVE'].includes(r.status)) return false;
      if (r.status === 'PAYMENT_PENDING' && r.expiresAt && new Date(r.expiresAt) <= now) return false;
      return new Date(r.startDateTime) < endReq && new Date(r.endDateTime) > startReq;
    });

    if (hasActiveReservationConflict || conflictingBookings.length > 0) {
      return {
        isAvailable: false,
        reason: 'Vehicle is no longer available for the selected dates.',
      };
    }

    return { isAvailable: true };
  }

  // 1. Lazily transition expired reservations in database so DB state remains accurate
  await BookingModel.updateMany(
    {
      vehicleId: params.vehicleId,
      bookingStatus: 'PAYMENT_PENDING',
      paymentStatus: 'pending',
      reservationExpiresAt: { $lte: now },
    },
    {
      $set: { bookingStatus: 'EXPIRED' },
    }
  ).catch(() => {});

  // 2. Query database for conflicting bookings (only active / unexpired holds block)
  const conflictingBookings = await BookingModel.find({
    vehicleId: params.vehicleId,
    startDateTime: { $lt: endReq },
    endDateTime: { $gt: startReq },
    $or: [
      {
        bookingStatus: {
          $in: ['CONFIRMED', 'UPCOMING', 'PICKUP_PENDING', 'ACTIVE'],
        },
      },
      {
        bookingStatus: { $in: ['CREATED', 'PAYMENT_PENDING'] },
        $or: [
          { reservationExpiresAt: { $gt: now } },
          { reservationExpiresAt: { $exists: false } },
          { reservationExpiresAt: null },
        ],
      },
    ],
  });

  if (conflictingBookings.length > 0) {
    return {
      isAvailable: false,
      reason: 'Vehicle is no longer available for the selected dates.',
    };
  }

  return { isAvailable: true };
}

export async function isVehicleAvailableForDates(
  vehicleId: string,
  start: Date,
  end: Date
): Promise<boolean> {
  const result = await checkVehicleAvailability({
    vehicleId,
    startDateTime: start,
    endDateTime: end,
  });
  return result.isAvailable;
}

