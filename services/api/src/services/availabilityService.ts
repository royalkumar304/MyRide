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
  const vehicle = await VehicleModel.findById(params.vehicleId);
  if (!vehicle) {
    return { isAvailable: false, reason: 'Vehicle not found' };
  }

  if (vehicle.verificationStatus !== 'APPROVED') {
    return { isAvailable: false, reason: 'Vehicle is currently not approved for public rental' };
  }

  if (!vehicle.availability.isAvailable) {
    return { isAvailable: false, reason: 'Host has temporarily paused vehicle availability' };
  }

  const startReq = new Date(params.startDateTime);
  const endReq = new Date(params.endDateTime);

  if (startReq >= endReq) {
    return { isAvailable: false, reason: 'Return date & time must be after pickup date & time' };
  }

  // Query database for conflicting active/confirmed bookings
  const conflictingBookings = await BookingModel.find({
    vehicleId: params.vehicleId,
    bookingStatus: {
      $in: ['CREATED', 'PAYMENT_PENDING', 'CONFIRMED', 'UPCOMING', 'PICKUP_PENDING', 'ACTIVE'],
    },
    $or: [
      {
        startDateTime: { $lt: endReq },
        endDateTime: { $gt: startReq },
      },
    ],
  });

  if (conflictingBookings.length > 0) {
    return {
      isAvailable: false,
      reason: 'Sorry, this vehicle is already booked for the selected dates and times.',
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

