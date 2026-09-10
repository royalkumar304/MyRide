import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDoc extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash?: string;
  profileImage?: string;
  city: string;
  role: 'CUSTOMER' | 'HOST' | 'ADMIN';
  isVerified: boolean;
  kycStatus: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  drivingLicenseNumber?: string;
  drivingLicenseVerified?: boolean;
  drivingLicenseUrl?: string;
  rating: number;
  totalTrips: number;
  referralCode: string;
  referredBy?: mongoose.Types.ObjectId;
  walletBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    phone: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String },
    profileImage: { type: String },
    city: { type: String, required: true, index: true },
    role: { type: String, enum: ['CUSTOMER', 'HOST', 'ADMIN'], default: 'CUSTOMER', index: true },
    isVerified: { type: Boolean, default: false },
    kycStatus: {
      type: String,
      enum: ['NOT_STARTED', 'PENDING', 'VERIFIED', 'REJECTED'],
      default: 'NOT_STARTED',
    },
    drivingLicenseNumber: { type: String },
    drivingLicenseVerified: { type: Boolean, default: false },
    drivingLicenseUrl: { type: String },
    rating: { type: Number, default: 5.0 },
    totalTrips: { type: Number, default: 0 },
    referralCode: { type: String, unique: true, index: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
    walletBalance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUserDoc>('User', UserSchema);
export default UserModel;
