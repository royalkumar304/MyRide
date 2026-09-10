import mongoose, { Schema, Document } from 'mongoose';

export interface IVehicleDoc extends Omit<Document, 'model'> {
  ownerId: mongoose.Types.ObjectId;
  ownerName: string;
  ownerPhone?: string;
  ownerRating: number;
  isHostVerified: boolean;
  type: 'BIKE' | 'SCOOTER' | 'CAR' | 'SUV' | 'EV';
  brand: string;
  model: string;
  variant?: string;
  year: number;
  registrationNumber: string;
  fuelType: 'Petrol' | 'Diesel' | 'Electric' | 'CNG';
  transmission: 'Manual' | 'Automatic';
  seats: number;
  pricing: {
    hourlyRate?: number;
    dailyRate: number;
    weeklyRate?: number;
    securityDeposit: number;
    deliveryFee: number;
  };
  securityDeposit: number;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
    address: string;
    area: string;
    city: string;
    state: string;
  };
  images: string[];
  features: string[];
  guidelines?: string[];
  availability: {
    isAvailable: boolean;
    operatingHours?: string;
    blockedDates?: string[];
  };
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  rating: number;
  totalTrips: number;
  deliveryAvailable: boolean;
  instantBooking: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicleDoc>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerName: { type: String, required: true },
    ownerPhone: { type: String },
    ownerRating: { type: Number, default: 5.0 },
    isHostVerified: { type: Boolean, default: false },
    type: { type: String, enum: ['BIKE', 'SCOOTER', 'CAR', 'SUV', 'EV'], required: true, index: true },
    brand: { type: String, required: true, index: true },
    model: { type: String, required: true },
    variant: { type: String },
    year: { type: Number, required: true },
    registrationNumber: { type: String, required: true, unique: true, uppercase: true, index: true },
    fuelType: { type: String, enum: ['Petrol', 'Diesel', 'Electric', 'CNG'], required: true },
    transmission: { type: String, enum: ['Manual', 'Automatic'], required: true },
    seats: { type: Number, required: true },
    pricing: {
      hourlyRate: { type: Number },
      dailyRate: { type: Number, required: true },
      weeklyRate: { type: Number },
      securityDeposit: { type: Number, required: true },
      deliveryFee: { type: Number, default: 150 },
    },
    securityDeposit: { type: Number, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
      address: { type: String, required: true },
      area: { type: String, required: true, index: true },
      city: { type: String, required: true, index: true },
      state: { type: String, required: true },
    },
    images: [{ type: String, required: true }],
    features: [{ type: String }],
    guidelines: [{ type: String }],
    availability: {
      isAvailable: { type: Boolean, default: true },
      operatingHours: { type: String, default: '08:00 AM - 09:00 PM' },
      blockedDates: [{ type: String }],
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING',
      index: true,
    },
    rating: { type: Number, default: 5.0 },
    totalTrips: { type: Number, default: 0 },
    deliveryAvailable: { type: Boolean, default: true },
    instantBooking: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// 2dsphere index for radial geospatial search
VehicleSchema.index({ 'location.coordinates': '2dsphere' });

export const VehicleModel = mongoose.models.Vehicle || mongoose.model<IVehicleDoc>('Vehicle', VehicleSchema);
export default VehicleModel;
