import { ApiResponse } from '../api';
import { PaymentTransaction } from '../../types';

/**
 * Mock payments have been strictly disabled in Phase 2 production Razorpay integration.
 * Insecure client-side Math.random() order/payment generation is prohibited.
 */
export const mockPaymentService = {
  async createRazorpayOrder(_amountInInr: number, _receiptId: string): Promise<ApiResponse<any>> {
    return {
      success: false,
      message: '[Security Policy] Client mock payments are prohibited. Real Razorpay server order is required.',
      error: 'MOCK_PAYMENT_PROHIBITED',
    };
  },

  async verifyPaymentSignature(_paymentDetails: any): Promise<ApiResponse<PaymentTransaction>> {
    return {
      success: false,
      message: '[Security Policy] Client mock signature verification is prohibited. Server HMAC verification required.',
      error: 'MOCK_VERIFICATION_PROHIBITED',
    };
  },
};
