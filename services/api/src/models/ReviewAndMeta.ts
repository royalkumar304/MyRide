import mongoose, { Schema, Document } from 'mongoose';

// Review
export interface IReviewDoc extends Document {
  bookingId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  rating: number;
  categoryRatings: {
    vehicleCondition: number;
    hostBehaviour: number;
    pickupExperience: number;
    valueForMoney: number;
  };
  comment: string;
  createdAt: Date;
}

const ReviewSchema = new Schema<IReviewDoc>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    categoryRatings: {
      vehicleCondition: { type: Number, min: 1, max: 5 },
      hostBehaviour: { type: Number, min: 1, max: 5 },
      pickupExperience: { type: Number, min: 1, max: 5 },
      valueForMoney: { type: Number, min: 1, max: 5 },
    },
    comment: { type: String },
  },
  { timestamps: true }
);

export const ReviewModel =
  mongoose.models.Review || mongoose.model<IReviewDoc>('Review', ReviewSchema);

// AuditLog
export interface IAuditLogDoc extends Document {
  adminId: mongoose.Types.ObjectId;
  adminName: string;
  action: string;
  targetId?: string;
  details: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDoc>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    adminName: { type: String, required: true },
    action: { type: String, required: true, index: true },
    targetId: { type: String },
    details: { type: Object },
  },
  { timestamps: true }
);

export const AuditLogModel =
  mongoose.models.AuditLog || mongoose.model<IAuditLogDoc>('AuditLog', AuditLogSchema);

// City
export interface ICityDoc extends Document {
  name: string;
  state: string;
  isPopular: boolean;
  hubs: string[];
  coordinates: [number, number];
}

const CitySchema = new Schema<ICityDoc>(
  {
    name: { type: String, required: true, unique: true, index: true },
    state: { type: String, required: true },
    isPopular: { type: Boolean, default: false },
    hubs: [{ type: String }],
    coordinates: { type: [Number], required: true },
  },
  { timestamps: true }
);

export const CityModel =
  mongoose.models.City || mongoose.model<ICityDoc>('City', CitySchema);

// Offer
export interface IOfferDoc extends Document {
  code: string;
  title: string;
  description: string;
  discountPercentage?: number;
  flatDiscountAmount?: number;
  maxDiscount?: number;
  minBookingAmount: number;
  validTill: Date;
  badgeText: string;
  isActive: boolean;
}

const OfferSchema = new Schema<IOfferDoc>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    discountPercentage: { type: Number },
    flatDiscountAmount: { type: Number },
    maxDiscount: { type: Number },
    minBookingAmount: { type: Number, default: 500 },
    validTill: { type: Date, required: true },
    badgeText: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const OfferModel =
  mongoose.models.Offer || mongoose.model<IOfferDoc>('Offer', OfferSchema);
