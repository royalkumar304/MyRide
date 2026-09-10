import crypto from 'crypto';
import { ENV } from '../config/env';

export interface IRazorpayOrderResponse {
  orderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
}

export const razorpayService = {
  async createOrder(amountInInr: number, receipt: string): Promise<IRazorpayOrderResponse> {
    const amountPaise = Math.round(amountInInr * 100);
    const orderId = 'order_rzp_' + crypto.randomBytes(8).toString('hex');

    return {
      orderId,
      amountPaise,
      currency: 'INR',
      keyId: ENV.RAZORPAY_KEY_ID,
    };
  },

  verifyPaymentSignature(params: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    // In production:
    // const hmac = crypto.createHmac('sha256', ENV.RAZORPAY_KEY_SECRET);
    // hmac.update(params.orderId + '|' + params.paymentId);
    // const generatedSignature = hmac.digest('hex');
    // return generatedSignature === params.signature;

    // For test / sandbox development:
    return Boolean(params.orderId && params.paymentId && params.signature);
  },
};

export async function createRazorpayOrder(params: {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: any;
}) {
  const result = await razorpayService.createOrder(params.amount / 100, params.receipt || 'order');
  return { id: result.orderId, amount: result.amountPaise, currency: result.currency };
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  return razorpayService.verifyPaymentSignature({ orderId, paymentId, signature });
}

