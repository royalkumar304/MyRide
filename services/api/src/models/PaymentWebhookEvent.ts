import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentWebhookEventDoc extends Document {
  eventId: string;
  event: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: 'processing' | 'processed' | 'failed' | 'ignored';
  receivedAt: Date;
  processedAt?: Date;
  failureReason?: string;
  payloadHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentWebhookEventSchema = new Schema<IPaymentWebhookEventDoc>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    event: { type: String, required: true, index: true },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String, index: true },
    status: {
      type: String,
      enum: ['processing', 'processed', 'failed', 'ignored'],
      default: 'processing',
      index: true,
    },
    receivedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
    failureReason: { type: String },
    payloadHash: { type: String },
  },
  { timestamps: true }
);

export const PaymentWebhookEventModel =
  mongoose.models.PaymentWebhookEvent ||
  mongoose.model<IPaymentWebhookEventDoc>('PaymentWebhookEvent', PaymentWebhookEventSchema);

export default PaymentWebhookEventModel;
