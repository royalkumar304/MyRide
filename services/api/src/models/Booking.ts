import mongoose, { Schema, Document } from 'mongoose';

export interface IBookingDoc extends Document {
  bookingId: string; // e.g. "MYR-829431"
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  hostId: mongoose.Types.ObjectId;
  hostName: string;
  hostPhone: string;
  vehicleId: mongoose.Types.ObjectId;
  startDateTime: Date;
  endDateTime: Date;
  durationDays: number;
  pickupType: 'self_pickup' | 'home_delivery';
  pickupLocation: string;
  dropoffLocation: string;
  pricing: {
    baseAmount: number;
    durationDays: number;
    deliveryFee: number;
    commissionRate: number;
    commissionAmount: number;
    taxes: number;
    discount: number;
    securityDeposit: number;
    totalAmount: number;
    hostEarnings: number;
  };
  paymentStatus:
    | 'pending'
    | 'processing'
    | 'paid'
    | 'completed'
    | 'failed'
    | 'refunded'
    | 'cancelled';
  bookingStatus:
    | 'CREATED'
    | 'PAYMENT_PENDING'
    | 'CONFIRMED'
    | 'UPCOMING'
    | 'PICKUP_PENDING'
    | 'ACTIVE'
    | 'RETURN_PENDING'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'REFUNDED'
    | 'EXPIRED'
    | 'FAILED';
  reservationExpiresAt?: Date;
  idempotencyKey?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paidAt?: Date;
  startInspection?: {
    odometerReading: number;
    fuelLevelPercentage: number;
    photos: string[];
    scratchesNotes?: string;
    checklist: Record<string, boolean>;
    timestamp: Date;
  };
  endInspection?: {
    odometerReading: number;
    fuelLevelPercentage: number;
    photos: string[];
    damageReport?: string;
    checklist: Record<string, boolean>;
    timestamp: Date;
  };
  cancellationReason?: string;
  isRated?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBookingDoc>(
  {
    bookingId: { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    hostName: { type: String, required: true },
    hostPhone: { type: String, required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    startDateTime: { type: Date, required: true, index: true },
    endDateTime: { type: Date, required: true, index: true },
    durationDays: { type: Number, required: true },
    pickupType: { type: String, enum: ['self_pickup', 'home_delivery'], default: 'self_pickup' },
    pickupLocation: { type: String, required: true },
    dropoffLocation: { type: String, required: true },
    pricing: {
      baseAmount: { type: Number, required: true },
      durationDays: { type: Number, required: true },
      deliveryFee: { type: Number, default: 0 },
      commissionRate: { type: Number, required: true },
      commissionAmount: { type: Number, required: true },
      taxes: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      securityDeposit: { type: Number, required: true },
      totalAmount: { type: Number, required: true },
      hostEarnings: { type: Number, required: true },
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
    },
    bookingStatus: {
      type: String,
      enum: [
        'CREATED',
        'PAYMENT_PENDING',
        'CONFIRMED',
        'UPCOMING',
        'PICKUP_PENDING',
        'ACTIVE',
        'RETURN_PENDING',
        'COMPLETED',
        'CANCELLED',
        'REFUNDED',
        'EXPIRED',
        'FAILED',
      ],
      default: 'UPCOMING',
      index: true,
    },
    reservationExpiresAt: { type: Date, index: true },
    idempotencyKey: { type: String, sparse: true, index: true },
    razorpayOrderId: { type: String, unique: true, sparse: true },
    razorpayPaymentId: { type: String, index: true, sparse: true },
    paidAt: { type: Date },
    startInspection: { type: Object },
    endInspection: { type: Object },
    cancellationReason: { type: String },
    isRated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound index for optimized availability overlap query (ESR rule: vehicleId = eq, bookingStatus = in, dates = range)
BookingSchema.index({ vehicleId: 1, bookingStatus: 1, startDateTime: 1, endDateTime: 1 });

// Compound unique sparse index for idempotent booking creation per customer
BookingSchema.index({ customerId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

// Compound index for efficient reservation expiration evaluation and cleanup
BookingSchema.index({ bookingStatus: 1, reservationExpiresAt: 1 });

export const BookingModel =
  mongoose.models.Booking || mongoose.model<IBookingDoc>('Booking', BookingSchema);
export default BookingModel;
