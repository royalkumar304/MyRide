export type PaymentMethodType = 'upi' | 'card' | 'netbanking' | 'wallet';

export interface RazorpayOrderPayload {
  amount: number; // in paise (e.g. ₹100 = 10000)
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface PaymentTransaction {
  id: string;
  bookingId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
  amount: number;
  currency: string;
  method: PaymentMethodType;
  status: 'captured' | 'failed' | 'refunded';
  upiVpa?: string;
  cardLast4?: string;
  bankName?: string;
  createdAt: string;
}
