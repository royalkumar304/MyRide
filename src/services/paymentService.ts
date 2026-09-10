import { PaymentTransaction, PaymentMethodType } from '../types';
import { apiClient, ApiResponse } from './apiClient';

export interface RazorpayOrderData {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  bookingId: string;
}

export interface PaymentVerificationPayload {
  bookingId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  paymentMethod: PaymentMethodType;
}

export const paymentService = {
  /**
   * Prepares and fetches official Razorpay order from backend API:
   * POST /payments/create-order
   * Does NOT generate fake order IDs in mobile code.
   */
  async createRazorpayOrder(
    bookingId: string
  ): Promise<ApiResponse<RazorpayOrderData>> {
    const response = await apiClient.post<{
      success: boolean;
      order: {
        id: string;
        amount: number;
        currency: string;
        key: string;
        bookingId: string;
      };
      message?: string;
    }>('/payments/create-order', { bookingId });

    if (response.success && response.data?.order) {
      return {
        success: true,
        data: {
          orderId: response.data.order.id,
          amount: response.data.order.amount,
          currency: response.data.order.currency,
          keyId: response.data.order.key,
          bookingId: response.data.order.bookingId,
        },
      };
    }

    return {
      success: false,
      message: response.message || 'Failed to create payment order on backend server',
      error: response.error,
      statusCode: response.statusCode,
    };
  },

  /**
   * Submits Razorpay payment signature to backend API for validation:
   * POST /payments/verify
   * Does NOT mark bookings as paid locally.
   */
  async verifyPayment(paymentDetails: PaymentVerificationPayload): Promise<ApiResponse<{
    success: boolean;
    message: string;
    booking?: any;
  }>> {
    const response = await apiClient.post<{ success: boolean; message: string; booking: any }>(
      '/payments/verify',
      {
        bookingId: paymentDetails.bookingId,
        razorpayOrderId: paymentDetails.razorpayOrderId,
        razorpayPaymentId: paymentDetails.razorpayPaymentId,
        razorpaySignature: paymentDetails.razorpaySignature,
        paymentMethod: paymentDetails.paymentMethod,
      }
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Payment verified successfully by backend server',
      };
    }

    return {
      success: false,
      message: response.message || 'Payment verification failed on server',
      error: response.error,
      statusCode: response.statusCode,
    };
  },

  // Alias for backward compatibility
  async verifyPaymentSignature(paymentDetails: {
    bookingId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    amount?: number;
    method: PaymentMethodType;
  }): Promise<ApiResponse<PaymentTransaction>> {
    const verifyRes = await this.verifyPayment({
      bookingId: paymentDetails.bookingId,
      razorpayOrderId: paymentDetails.razorpayOrderId,
      razorpayPaymentId: paymentDetails.razorpayPaymentId,
      razorpaySignature: paymentDetails.razorpaySignature,
      paymentMethod: paymentDetails.method,
    });

    if (verifyRes.success) {
      return {
        success: true,
        data: {
          id: 'tx-' + Date.now(),
          bookingId: paymentDetails.bookingId,
          razorpayOrderId: paymentDetails.razorpayOrderId,
          razorpayPaymentId: paymentDetails.razorpayPaymentId,
          razorpaySignature: paymentDetails.razorpaySignature,
          amount: paymentDetails.amount || 0,
          currency: 'INR',
          method: paymentDetails.method,
          status: 'captured',
          createdAt: new Date().toISOString(),
        },
      };
    }

    return {
      success: false,
      message: verifyRes.message,
      error: verifyRes.error,
      statusCode: verifyRes.statusCode,
    };
  },
};
