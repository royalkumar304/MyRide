import crypto from 'crypto';
import { ENV } from '../config/env';

export interface IRazorpayOrderResponse {
  orderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
  receipt?: string;
}

export interface IRazorpayOrderParams {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface IVerifySignatureParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

export const razorpayService = {
  /**
   * Checks whether Razorpay credentials are fully configured.
   */
  isConfigured(): boolean {
    return Boolean(ENV.RAZORPAY_KEY_ID && ENV.RAZORPAY_KEY_SECRET);
  },

  /**
   * Creates a genuine Razorpay Order using Razorpay REST API.
   * Never generates fake or mock order IDs.
   */
  async createOrder(params: IRazorpayOrderParams): Promise<IRazorpayOrderResponse> {
    const keyId = ENV.RAZORPAY_KEY_ID;
    const keySecret = ENV.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error(
        '[Razorpay Configuration Error] Razorpay credentials (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are missing or incomplete. Please configure valid credentials in environment variables.'
      );
    }

    if (!params.amountPaise || params.amountPaise <= 0) {
      throw new Error('[Razorpay Error] Order amount must be greater than zero.');
    }

    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const currency = params.currency || 'INR';

    const payload = {
      amount: Math.round(params.amountPaise),
      currency,
      receipt: params.receipt.slice(0, 40),
      notes: params.notes || {},
    };

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    const responseData: any = await response.json();

    if (!response.ok) {
      const errorMsg =
        responseData?.error?.description ||
        responseData?.error?.message ||
        `Razorpay API rejected order creation with HTTP ${response.status}`;
      throw new Error(`[Razorpay Order Error] ${errorMsg}`);
    }

    if (!responseData.id) {
      throw new Error('[Razorpay Order Error] Malformed response received from Razorpay Orders API');
    }

    return {
      orderId: responseData.id,
      amountPaise: responseData.amount,
      currency: responseData.currency || currency,
      keyId,
      receipt: responseData.receipt,
    };
  },

  /**
   * Cryptographically verifies Razorpay payment signature using HMAC-SHA256.
   * Expected: HMAC-SHA256(order_id + "|" + payment_id, secret) == signature
   */
  verifyPaymentSignature(params: IVerifySignatureParams): boolean {
    const keySecret = ENV.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      throw new Error(
        '[Razorpay Configuration Error] Cannot verify payment signature: RAZORPAY_KEY_SECRET is not configured.'
      );
    }

    if (!params.orderId || !params.paymentId || !params.signature) {
      return false;
    }

    const payload = `${params.orderId}|${params.paymentId}`;
    const hmac = crypto.createHmac('sha256', keySecret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
    const providedBuffer = Buffer.from(params.signature, 'utf-8');

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  },

  /**
   * Generates a valid signature for a given orderId, paymentId, and secret.
   * Used for deterministic automated cryptographic testing.
   */
  generateSignatureForTesting(orderId: string, paymentId: string, secret?: string): string {
    const activeSecret = secret || ENV.RAZORPAY_KEY_SECRET;
    if (!activeSecret) {
      throw new Error('Secret is required to generate test signature');
    }
    const hmac = crypto.createHmac('sha256', activeSecret);
    hmac.update(`${orderId}|${paymentId}`);
    return hmac.digest('hex');
  },
};

export async function createRazorpayOrder(params: {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
}) {
  const result = await razorpayService.createOrder({
    amountPaise: params.amount,
    currency: params.currency || 'INR',
    receipt: params.receipt || 'order',
    notes: params.notes,
  });

  return {
    id: result.orderId,
    amount: result.amountPaise,
    currency: result.currency,
    key: result.keyId,
  };
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  return razorpayService.verifyPaymentSignature({ orderId, paymentId, signature });
}
