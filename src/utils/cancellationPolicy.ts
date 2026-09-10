/**
 * Cancellation & Ride Change Policy Utilities for MyRide
 *
 * Rules:
 * 1. Customer Cancellation:
 *    - >= 24 hours before ride start: 100% Full Refund
 *    - < 24 hours before ride start: 0% Refund (Non-refundable window)
 *
 * 2. Host Ride Change / Cancellation:
 *    - >= 24 hours before ride start: Host can change or cancel with standard notice
 *    - < 24 hours before ride start: Host MUST inform the customer first (Call/Message) before changing or cancelling
 */

export interface CancellationRefundCalculation {
  hoursRemaining: number;
  formattedTimeUntilStart: string;
  isEligibleFor100PercentRefund: boolean;
  refundPercentage: 100 | 0;
  refundAmount: number;
  penaltyAmount: number;
  policyNote: string;
  isPastStartTime: boolean;
}

export interface HostChangeEligibility {
  hoursRemaining: number;
  formattedTimeUntilStart: string;
  canDirectlyChange: boolean;
  requiresCustomerInformed: boolean;
  policyNote: string;
}

/**
 * Parses various date/time formats used in the app into a standard Date object.
 * Supports:
 * - "2026-09-12 10:00 AM"
 * - "12 Sep 2026, 10:00 AM"
 * - "Tomorrow, 10:00 AM" / "Today, 10:00 AM"
 * - ISO string: "2026-09-12T10:00:00Z"
 */
export const parseBookingDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();

  // Handle standard ISO string
  if (dateStr.includes('T') && !isNaN(Date.parse(dateStr))) {
    return new Date(dateStr);
  }

  // Handle "Tomorrow, 10:00 AM" or "Today, 10:00 AM"
  const now = new Date();
  if (dateStr.toLowerCase().startsWith('today')) {
    const timePart = dateStr.split(',')[1]?.trim() || '10:00 AM';
    return parseTimeOntoDate(new Date(now), timePart);
  }
  if (dateStr.toLowerCase().startsWith('tomorrow')) {
    const target = new Date(now);
    target.setDate(target.getDate() + 1);
    const timePart = dateStr.split(',')[1]?.trim() || '10:00 AM';
    return parseTimeOntoDate(target, timePart);
  }

  // Handle "12 Sep 2026, 10:00 AM" or "12 Sep 2026 10:00 AM"
  const cleaned = dateStr.replace(',', '').trim();
  const directParse = new Date(cleaned);
  if (!isNaN(directParse.getTime())) {
    return directParse;
  }

  // Handle "2026-09-12 10:00 AM"
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    let hour = parseInt(match[4], 10);
    const minute = parseInt(match[5], 10);
    const meridiem = match[6].toUpperCase();

    if (meridiem === 'PM' && hour < 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;

    return new Date(year, month, day, hour, minute, 0);
  }

  // Fallback
  return new Date();
};

const parseTimeOntoDate = (date: Date, timeStr: string): Date => {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const meridiem = match[3].toUpperCase();

    if (meridiem === 'PM' && hour < 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;

    date.setHours(hour, minute, 0, 0);
  }
  return date;
};

/**
 * Formats a duration in hours into human readable text (e.g., "38 hours", "2 days 4 hours", "3 hours 15 mins")
 */
export const formatHoursRemaining = (hours: number): string => {
  if (hours <= 0) return '0 hours (Started/Elapsed)';

  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  if (wholeHours >= 48) {
    const days = Math.floor(wholeHours / 24);
    const remHours = wholeHours % 24;
    return `${days} days ${remHours > 0 ? `${remHours}h` : ''}`.trim();
  }

  if (wholeHours >= 24) {
    const days = 1;
    const remHours = wholeHours - 24;
    return `${days} day ${remHours}h`;
  }

  if (wholeHours > 0) {
    return `${wholeHours}h ${minutes > 0 ? `${minutes}m` : ''}`.trim();
  }

  return `${minutes} minutes`;
};

/**
 * Calculates customer cancellation refund based on 24-hour cutoff rule.
 */
export const calculateCancellationRefund = (
  startDateStr: string,
  totalPayableNow: number,
  securityDeposit: number = 0
): CancellationRefundCalculation => {
  const now = new Date();
  const startDate = parseBookingDate(startDateStr);
  const diffMs = startDate.getTime() - now.getTime();
  const hoursRemaining = diffMs / (1000 * 60 * 60);
  const isPastStartTime = hoursRemaining <= 0;

  const isEligibleFor100PercentRefund = hoursRemaining >= 24;
  const formattedTimeUntilStart = formatHoursRemaining(hoursRemaining);

  if (isEligibleFor100PercentRefund) {
    // 100% Refund
    return {
      hoursRemaining,
      formattedTimeUntilStart,
      isEligibleFor100PercentRefund: true,
      refundPercentage: 100,
      refundAmount: totalPayableNow,
      penaltyAmount: 0,
      policyNote: `Cancelled with ${formattedTimeUntilStart} remaining (>= 24 hrs). You are eligible for a 100% full refund of ₹${totalPayableNow}.`,
      isPastStartTime,
    };
  }

  // < 24 hours: 0% Refund
  return {
    hoursRemaining,
    formattedTimeUntilStart,
    isEligibleFor100PercentRefund: false,
    refundPercentage: 0,
    refundAmount: 0,
    penaltyAmount: totalPayableNow,
    policyNote: isPastStartTime
      ? 'Ride start time has already elapsed. 0% refund applies.'
      : `Cancelled with only ${formattedTimeUntilStart} remaining (< 24 hrs). Per MyRide policy, 0% refund applies to cancellations within 24 hours of ride start.`,
    isPastStartTime,
  };
};

/**
 * Checks if Host can directly change the ride or must inform customer first.
 */
export const checkHostChangeEligibility = (startDateStr: string): HostChangeEligibility => {
  const now = new Date();
  const startDate = parseBookingDate(startDateStr);
  const diffMs = startDate.getTime() - now.getTime();
  const hoursRemaining = diffMs / (1000 * 60 * 60);

  const canDirectlyChange = hoursRemaining >= 24;
  const formattedTimeUntilStart = formatHoursRemaining(hoursRemaining);

  if (canDirectlyChange) {
    return {
      hoursRemaining,
      formattedTimeUntilStart,
      canDirectlyChange: true,
      requiresCustomerInformed: false,
      policyNote: `More than 24 hours before ride start (${formattedTimeUntilStart}). You can modify ride details directly.`,
    };
  }

  return {
    hoursRemaining,
    formattedTimeUntilStart,
    canDirectlyChange: false,
    requiresCustomerInformed: true,
    policyNote: `Less than 24 hours before ride start (${formattedTimeUntilStart})! You must contact and inform the customer directly before modifying or cancelling this ride.`,
  };
};
