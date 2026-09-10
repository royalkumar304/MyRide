import { getActivePlatformSettings } from '../models/PlatformSettings';
import { calculateRentalFare } from '@myride/utils';
import { VehicleType } from '@myride/types';

export async function calculateBookingPrice(params: {
  dailyRate: number;
  durationDays: number;
  vehicleType: VehicleType;
  pickupType: 'self_pickup' | 'home_delivery';
  discountAmount?: number;
  securityDeposit: number;
}) {
  const settingsDoc = await getActivePlatformSettings();
  const settings = typeof settingsDoc?.toObject === 'function' ? settingsDoc.toObject() : settingsDoc;

  return calculateRentalFare({
    dailyRate: params.dailyRate,
    durationDays: params.durationDays,
    vehicleType: params.vehicleType,
    pickupType: params.pickupType,
    discountAmount: params.discountAmount,
    securityDeposit: params.securityDeposit,
    platformSettings: settings as any,
  });
}
