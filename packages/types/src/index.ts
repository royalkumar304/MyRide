// Centralized TypeScript Domain Types for MyRide Platform

export type UserRole = 'CUSTOMER' | 'HOST' | 'ADMIN';
export type KycStatus = 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface IUser {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  city: string;
  role: UserRole;
  isVerified: boolean;
  kycStatus: KycStatus;
  drivingLicenseNumber?: string;
  drivingLicenseVerified?: boolean;
  drivingLicenseUrl?: string;
  rating: number;
  totalTrips: number;
  referralCode: string;
  referredBy?: string;
  walletBalance: number;
  createdAt: string;
  updatedAt?: string;
}

export type VehicleType = 'BIKE' | 'SCOOTER' | 'CAR' | 'SUV' | 'EV';
export type FuelType = 'Petrol' | 'Diesel' | 'Electric' | 'CNG';
export type TransmissionType = 'Manual' | 'Automatic';
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface IVehicleDocument {
  _id: string;
  id?: string;
  vehicleId: string;
  type: 'RC' | 'Insurance' | 'PUC' | 'Permit';
  documentNumber: string;
  fileUrl: string;
  verified: boolean;
  expiryDate?: string;
  rejectionReason?: string;
  verifiedAt?: string;
}

export interface IVehicleLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
  area: string;
  city: string;
  state: string;
}

export interface IVehiclePricing {
  hourlyRate?: number;
  dailyRate: number;
  weeklyRate?: number;
  securityDeposit: number;
  deliveryFee: number;
}

export interface IVehicle {
  _id: string;
  id?: string;
  ownerId: string;
  ownerName: string;
  ownerPhone?: string;
  ownerRating: number;
  isHostVerified: boolean;
  type: VehicleType;
  brand: string;
  model: string;
  variant?: string;
  year: number;
  registrationNumber: string;
  fuelType: FuelType;
  transmission: TransmissionType;
  seats: number;
  pricing: IVehiclePricing;
  securityDeposit: number;
  location: IVehicleLocation;
  images: string[];
  features: string[];
  guidelines?: string[];
  availability: {
    isAvailable: boolean;
    operatingHours?: string;
    blockedDates?: string[];
  };
  verificationStatus: VerificationStatus;
  rating: number;
  totalTrips: number;
  deliveryAvailable: boolean;
  instantBooking: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type BookingStatus =
  | 'CREATED'
  | 'PAYMENT_PENDING'
  | 'CONFIRMED'
  | 'UPCOMING'
  | 'PICKUP_PENDING'
  | 'ACTIVE'
  | 'RETURN_PENDING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PickupType = 'self_pickup' | 'home_delivery';

export interface IInspectionChecklist {
  lightsWorking: boolean;
  tyresInspected: boolean;
  acHeaterWorking: boolean;
  accessoriesPresent: boolean;
  documentsPresent: boolean;
}

export interface IInspectionData {
  odometerReading: number;
  fuelLevelPercentage: number;
  photos: string[];
  scratchesNotes?: string;
  checklist: IInspectionChecklist;
  timestamp: string;
}

export interface IBookingPricing {
  baseAmount: number;
  durationDays: number;
  deliveryFee: number;
  commissionRate: number;       // e.g. 15% from platform settings
  commissionAmount: number;     // e.g. 15% of base
  taxes: number;                // GST
  discount: number;
  securityDeposit: number;      // 100% Refundable
  totalAmount: number;          // Total customer pays
  hostEarnings: number;         // baseAmount - commissionAmount
}

export interface IBooking {
  _id: string;
  id?: string;
  bookingId: string;            // e.g. "MYR-829431"
  customerId: string;
  customerName: string;
  customerPhone: string;
  hostId: string;
  hostName: string;
  hostPhone: string;
  vehicleId: string;
  vehicle: IVehicle;
  startDateTime: string;
  endDateTime: string;
  durationDays: number;
  pickupType: PickupType;
  pickupLocation: string;
  dropoffLocation: string;
  pricing: IBookingPricing;
  paymentStatus: 'pending' | 'processing' | 'paid' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  bookingStatus: BookingStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paidAt?: string;
  startInspection?: IInspectionData;
  endInspection?: IInspectionData;
  cancellationReason?: string;
  isRated?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface IPayment {
  _id: string;
  id?: string;
  bookingId: string;
  customerId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  amountPaise: number;
  currency: string;
  method: 'upi' | 'card' | 'netbanking' | 'wallet';
  status: 'captured' | 'failed' | 'refunded' | 'pending';
  createdAt: string;
}

export interface IHostEarning {
  _id: string;
  id?: string;
  hostId: string;
  bookingId: string;
  vehicleId: string;
  vehicleName: string;
  grossAmount: number;
  commissionPercentage: number;
  commissionAmount: number;
  netAmount: number;
  status: 'PENDING' | 'AVAILABLE' | 'WITHDRAWN' | 'REFUNDED';
  tripDate: string;
  createdAt: string;
}

export interface IPlatformSettings {
  commission: {
    defaultPercentage: number; // 15%
    bikePercentage: number;    // 12%
    scooterPercentage: number; // 12%
    carPercentage: number;     // 15%
    suvPercentage: number;     // 15%
    evPercentage: number;      // 10%
  };
  referral: {
    referrerReward: number;   // ₹200
    referredDiscount: number; // ₹150
  };
  taxes: {
    gstPercentage: number;    // 18% on platform fee
  };
  delivery: {
    baseDeliveryFee: number;  // ₹150
    perKmFee: number;         // ₹15
  };
  support: {
    phone: string;
    email: string;
    emergencyPhone: string;
    roadsidePhone: string;
  };
  supportedCities: string[];
  updatedAt: string;
}

export interface IReview {
  _id: string;
  id?: string;
  bookingId: string;
  vehicleId: string;
  customerId: string;
  customerName: string;
  rating: number;
  categoryRatings: {
    vehicleCondition: number;
    hostBehaviour: number;
    pickupExperience: number;
    valueForMoney: number;
  };
  comment: string;
  createdAt: string;
}

export interface IAuditLog {
  _id: string;
  id?: string;
  adminId: string;
  adminName: string;
  action:
    | 'VEHICLE_APPROVED'
    | 'VEHICLE_REJECTED'
    | 'COMMISSION_UPDATED'
    | 'SETTINGS_UPDATED'
    | 'HOST_VERIFIED'
    | 'REFUND_PROCESSED'
    | 'BOOKING_CANCELLED';
  targetId: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface IPaymentWebhookEvent {
  _id?: string;
  id?: string;
  eventId: string;
  event: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: 'processed' | 'failed' | 'ignored';
  receivedAt: string;
  processedAt?: string;
  failureReason?: string;
  payloadHash?: string;
}
