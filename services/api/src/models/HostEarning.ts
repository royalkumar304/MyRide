import mongoose, { Schema, Document } from 'mongoose';

export interface IHostEarningDoc extends Document {
  hostId: mongoose.Types.ObjectId;
  bookingId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  vehicleName: string;
  grossAmount: number;
  commissionPercentage: number;
  commissionAmount: number;
  netAmount: number;
  status: 'PENDING' | 'AVAILABLE' | 'WITHDRAWN' | 'REFUNDED';
  tripDate: Date;
  settledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const HostEarningSchema = new Schema<IHostEarningDoc>(
  {
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    vehicleName: { type: String, required: true },
    grossAmount: { type: Number, required: true },
    commissionPercentage: { type: Number, default: 15 },
    commissionAmount: { type: Number, required: true },
    netAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'AVAILABLE', 'WITHDRAWN', 'REFUNDED'],
      default: 'AVAILABLE',
      index: true,
    },
    tripDate: { type: Date, default: Date.now },
    settledAt: { type: Date },
  },
  { timestamps: true }
);

export const HostEarningModel =
  mongoose.models.HostEarning ||
  mongoose.model<IHostEarningDoc>('HostEarning', HostEarningSchema);
export default HostEarningModel;
