import { PaymentTransaction, PaymentMethodType } from '../types';
import { apiPost, ApiResponse } from './api';
import { mockPaymentService } from './mock/mockPaymentService';

export const paymentService = {
  async createRazorpayOrder(
    amountInInr: number,
    receiptId: string
  ): Promise<
    ApiResponse<{
      orderId: string;
      amount: number;
      currency: string;
      keyId: string;
    }>
  > {
    const response = await apiPost<{
      success: boolean;
      order: {
        id: string;
        amount: number;
        currency: string;
        key: string;
        bookingId: string;
      };
    }>('/payments/create-order', { bookingId: receiptId });

    if (response.success && response.data?.order) {
      return {
        success: true,
        data: {
          orderId: response.data.order.id,
          amount: response.data.order.amount,
          currency: response.data.order.currency,
          keyId: response.data.order.key,
        },
      };
    }

    console.warn('[paymentService.createRazorpayOrder] Live API failed. Falling back to mock.');
    return mockPaymentService.createRazorpayOrder(amountInInr, receiptId);
  },

  async verifyPaymentSignature(paymentDetails: {
    bookingId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    amount: number;
    method: PaymentMethodType;
  }): Promise<ApiResponse<PaymentTransaction>> {
    const response = await apiPost<{ success: boolean; booking: any }>('/payments/verify', {
      bookingId: paymentDetails.bookingId,
      razorpayOrderId: paymentDetails.razorpayOrderId,
      razorpayPaymentId: paymentDetails.razorpayPaymentId,
      razorpaySignature: paymentDetails.razorpaySignature,
      paymentMethod: paymentDetails.method,
    });

    if (response.success) {
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
      return {
        success: true,
        data: transaction,
      };
    }

    console.warn('[paymentService.verifyPaymentSignature] Live API failed. Falling back to mock.');
    return mockPaymentService.verifyPaymentSignature(paymentDetails);
  },

  async simulatePayment(bookingId: string): Promise<ApiResponse<{ success: boolean; message: string; booking?: any }>> {
    const response = await apiPost<{ success: boolean; message: string; booking: any }>(
      '/payments/simulate',
      { bookingId }
    );

    if (response.success) {
      return {
        success: true,
        data: {
          success: true,
          message: response.data?.message || 'Payment simulated successfully in backend database',
          booking: response.data?.booking,
        },
      };
    }

    return {
      success: true,
      data: {
        success: true,
        message: 'Payment simulated locally',
      },
    };
  },
};
