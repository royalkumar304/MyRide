import { PaymentTransaction, PaymentMethodType } from '../types';
import { APP_CONFIG } from '../constants/config';
import { mockApiCall, ApiResponse } from './api';

export const paymentService = {
  async createRazorpayOrder(amountInInr: number, receiptId: string): Promise<ApiResponse<{
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
  }>> {
    const orderId = 'order_rzp_' + Math.random().toString(36).substring(2, 12);
    return mockApiCall({
      orderId,
      amount: amountInInr * 100, // paise
      currency: 'INR',
      keyId: APP_CONFIG.razorpayKeyId,
    }, 300);
  },

  async verifyPaymentSignature(paymentDetails: {
    bookingId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    amount: number;
    method: PaymentMethodType;
  }): Promise<ApiResponse<PaymentTransaction>> {
    const transaction: PaymentTransaction = {
      id: 'tx-' + Date.now(),
      bookingId: paymentDetails.bookingId,
      razorpayOrderId: paymentDetails.razorpayOrderId,
      razorpayPaymentId: paymentDetails.razorpayPaymentId,
      razorpaySignature: paymentDetails.razorpaySignature,
      amount: paymentDetails.amount,
      currency: 'INR',
      method: paymentDetails.method,
      status: 'captured',
      createdAt: new Date().toISOString(),
    };
    return mockApiCall(transaction, 400);
  },
};
