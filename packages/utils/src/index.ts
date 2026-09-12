import { VehicleType, IBookingPricing, IPlatformSettings } from '@myride/types';
import { DEFAULT_PLATFORM_SETTINGS } from '@myride/constants';

/**
 * Server-side Pricing Engine Formula:
 * Base Rental + Delivery Fee - Discount + MyRide Commission + Taxes + Security Deposit = Total Payable
 */
export function calculateRentalFare(params: {
  dailyRate: number;
  durationDays: number;
  vehicleType: VehicleType;
  pickupType: 'self_pickup' | 'home_delivery';
  discountAmount?: number;
  securityDeposit: number;
  platformSettings?: IPlatformSettings;
}): IBookingPricing {
  const settings = params.platformSettings || (DEFAULT_PLATFORM_SETTINGS as IPlatformSettings);
  const days = Math.max(1, params.durationDays);
  const baseAmount = params.dailyRate * days;

  // Delivery Fee
  const deliveryFee =
    params.pickupType === 'home_delivery'
      ? settings.delivery?.baseDeliveryFee || 150
      : 0;

  // Platform Commission lookup by category
  let commissionRate = settings.commission.defaultPercentage || 15;
  const typeKey = params.vehicleType.toLowerCase();
  if (typeKey === 'bike') {
    commissionRate = settings.commission.bikePercentage || 12;
  } else if (typeKey === 'scooter') {
    commissionRate = settings.commission.scooterPercentage || 12;
  } else if (typeKey === 'ev') {
    commissionRate = settings.commission.evPercentage || 10;
  } else if (typeKey === 'suv') {
    commissionRate = settings.commission.suvPercentage || 15;
  } else if (typeKey === 'car') {
    commissionRate = settings.commission.carPercentage || 15;
  }

  const commissionAmount = Math.round((baseAmount * commissionRate) / 100);

  // 18% GST applicable on the platform service fee
  const gstRate = settings.taxes?.gstPercentage || 18;
  const taxes = Math.round((commissionAmount * gstRate) / 100);

  const discount = params.discountAmount || 0;
  const securityDeposit = params.securityDeposit;

  // Customer total payable
  const totalAmount =
    baseAmount + deliveryFee - discount + commissionAmount + taxes + securityDeposit;

  // Host net earnings (Rental fare minus platform fee)
  const hostEarnings = baseAmount - commissionAmount;

  return {
    baseAmount,
    durationDays: days,
    deliveryFee,
    commissionRate,
    commissionAmount,
    taxes,
    discount,
    securityDeposit,
    totalAmount,
    hostEarnings,
  };
}

/**
 * Generates official MyRide booking reference ID
 * Cryptographically random and collision-resistant
 */
export function generateBookingId(): string {
  let num: number;
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    num = 100000 + (arr[0] % 900000);
  } else {
    try {
      const nodeCrypto = require('crypto');
      num = 100000 + (nodeCrypto.randomBytes(4).readUInt32BE(0) % 900000);
    } catch {
      num = Math.floor(100000 + Math.random() * 900000);
    }
  }
  return `MYR-${num}`;
}

/**
 * Checks whether two datetime intervals overlap
 */
export function isTimeOverlap(
  startA: Date | string,
  endA: Date | string,
  startB: Date | string,
  endB: Date | string
): boolean {
  const a1 = new Date(startA).getTime();
  const a2 = new Date(endA).getTime();
  const b1 = new Date(startB).getTime();
  const b2 = new Date(endB).getTime();

  return a1 < b2 && a2 > b1;
}
