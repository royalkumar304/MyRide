import { HostEarningsSummary, WithdrawalRequest, Booking } from '../../types';
import { MOCK_HOST_SUMMARY, MOCK_BOOKINGS } from '../mockData';
import { APP_CONFIG } from '../../constants/config';
import { mockApiCall, ApiResponse } from '../api';

let hostSummary = { ...MOCK_HOST_SUMMARY };

export const mockHostService = {
  async getDashboardSummary(hostId: string): Promise<ApiResponse<HostEarningsSummary>> {
    return mockApiCall(hostSummary, 250);
  },

  async getHostBookings(hostId: string): Promise<ApiResponse<Booking[]>> {
    return mockApiCall(MOCK_BOOKINGS, 250);
  },

  async updateBookingStatus(bookingId: string, status: 'confirmed' | 'cancelled'): Promise<ApiResponse<{ bookingId: string; status: string }>> {
    return mockApiCall({ bookingId, status }, 300);
  },

  async requestPayout(amount: number, upiOrAccount: string): Promise<ApiResponse<WithdrawalRequest>> {
    if (amount > hostSummary.availableBalance) {
      return { success: false, error: 'Requested amount exceeds available balance' };
    }

    const request: WithdrawalRequest = {
      id: 'wdr-' + Date.now(),
      amount,
      payoutMethod: upiOrAccount.includes('@') ? 'upi' : 'bank_transfer',
      destinationAccount: upiOrAccount,
      status: 'processing',
      requestedAt: new Date().toISOString(),
    };

    hostSummary = {
      ...hostSummary,
      availableBalance: hostSummary.availableBalance - amount,
    };

    return mockApiCall(request, 400);
  },

  calculateCommission(grossAmount: number, category: 'car' | 'bike' | 'suv' | 'ev' = 'car'): {
    gross: number;
    rate: number;
    commission: number;
    net: number;
  } {
    const rate = APP_CONFIG.categoryCommissionPercentages[category] || APP_CONFIG.defaultCommissionPercentage;
    const commission = Math.round((grossAmount * rate) / 100);
    const net = grossAmount - commission;
    return {
      gross: grossAmount,
      rate,
      commission,
      net,
    };
  },
};
