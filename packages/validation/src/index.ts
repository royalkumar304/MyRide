import { z } from 'zod';

// Auth Validation
export const SendOtpSchema = z.object({
  phone: z.string().min(10, 'Valid 10-digit mobile number required'),
});

export const VerifyOtpSchema = z.object({
  phone: z.string().min(10),
  otp: z.string().min(4, 'OTP must be 4 digits'),
});

export const SignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid 10-digit mobile number required'),
  city: z.string().min(2, 'City is required'),
  role: z.enum(['CUSTOMER', 'HOST']).default('CUSTOMER'),
});

// Vehicle Validation
export const CreateVehicleSchema = z.object({
  type: z.enum(['BIKE', 'SCOOTER', 'CAR', 'SUV', 'EV']),
  brand: z.string().min(2),
  model: z.string().min(2),
  variant: z.string().optional(),
  year: z.number().min(2010).max(2030),
  registrationNumber: z.string().min(6, 'Valid registration plate number required'),
  fuelType: z.enum(['Petrol', 'Diesel', 'Electric', 'CNG']),
  transmission: z.enum(['Manual', 'Automatic']),
  seats: z.number().min(1).max(10),
  dailyRate: z.number().min(100),
  securityDeposit: z.number().min(0),
  deliveryFee: z.number().default(150),
  city: z.string().min(2),
  area: z.string().min(2),
  images: z.array(z.string().url()).min(1, 'At least 1 photo required'),
  features: z.array(z.string()).default([]),
});

// Booking Validation
export const CheckAvailabilitySchema = z.object({
  vehicleId: z.string(),
  startDateTime: z.string(),
  endDateTime: z.string(),
});

export const CreateBookingSchema = z.object({
  vehicleId: z.string(),
  startDateTime: z.string(),
  endDateTime: z.string(),
  durationDays: z.number().min(1),
  pickupType: z.enum(['self_pickup', 'home_delivery']).default('self_pickup'),
  pickupLocation: z.string().min(2),
  dropoffLocation: z.string().min(2),
  discountCode: z.string().optional(),
});

export const VerifyPaymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
  razorpaySignature: z.string().min(1, 'Razorpay signature is required'),
  paymentMethod: z.enum(['upi', 'card', 'netbanking', 'wallet']).default('upi').optional(),
});

// Settings & Commission Validation
export const UpdateCommissionSettingsSchema = z.object({
  defaultPercentage: z.number().min(0).max(50),
  bikePercentage: z.number().min(0).max(50).optional(),
  carPercentage: z.number().min(0).max(50).optional(),
  suvPercentage: z.number().min(0).max(50).optional(),
  evPercentage: z.number().min(0).max(50).optional(),
});

// Aliases for unified consumption
export const AuthPhoneSchema = SendOtpSchema;
export const UserSignupSchema = SignupSchema;
export const VehicleCreateSchema = CreateVehicleSchema;
export const BookingCreateSchema = CreateBookingSchema;
export const PaymentVerifySchema = VerifyPaymentSchema;

export const VehicleSearchQuerySchema = z.object({
  city: z.string().optional(),
  area: z.string().optional(),
  vehicleType: z.enum(['BIKE', 'SCOOTER', 'CAR', 'SUV', 'EV', 'bike', 'scooter', 'car', 'suv', 'ev']).optional(),
  brand: z.string().optional(),
  transmission: z.string().optional(),
  fuelType: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  price: z.coerce.number().optional(),
  seats: z.coerce.number().optional(),
  rating: z.coerce.number().optional(),
  distance: z.coerce.number().optional(),
  availability: z.string().optional(),
  sortBy: z.enum(['popular', 'price_asc', 'price_desc', 'rating', 'nearest', 'popularity']).optional(),
  q: z.string().optional(),
});


export const PlatformSettingsUpdateSchema = z.object({
  commission: z
    .object({
      defaultPercentage: z.number().min(0).max(50).optional(),
      bikePercentage: z.number().min(0).max(50).optional(),
      scooterPercentage: z.number().min(0).max(50).optional(),
      carPercentage: z.number().min(0).max(50).optional(),
      suvPercentage: z.number().min(0).max(50).optional(),
      evPercentage: z.number().min(0).max(50).optional(),
    })
    .optional(),
  referral: z
    .object({
      referrerReward: z.number().optional(),
      referredDiscount: z.number().optional(),
    })
    .optional(),
  taxes: z
    .object({
      gstPercentage: z.number().optional(),
    })
    .optional(),
  delivery: z
    .object({
      baseDeliveryFee: z.number().optional(),
      perKmFee: z.number().optional(),
    })
    .optional(),
});

