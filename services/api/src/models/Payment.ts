import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentDoc extends Document {
  bookingId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  amountPaise: number;
  currency: string;
  method: 'upi' | 'card' | 'netbanking' | 'wallet';
  status: 'captured' | 'failed' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPaymentDoc>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    razorpayOrderId: { type: String, required: true, unique: true },
    razorpayPaymentId: { type: String, required: true, unique: true },
    razorpaySignature: { type: String, required: true },
    amountPaise: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    method: { type: String, enum: ['upi', 'card', 'netbanking', 'wallet'], default: 'upi' },
    status: { type: String, enum: ['captured', 'failed', 'refunded'], default: 'captured' },
  },
  { timestamps: true }
);

export const PaymentModel =
  mongoose.models.Payment || mongoose.model<IPaymentDoc>('Payment', PaymentSchema);
export default PaymentModel;
