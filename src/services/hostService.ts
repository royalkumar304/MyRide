import { HostEarningsSummary, WithdrawalRequest, Booking } from '../types';
import { apiGet, ApiResponse, adaptBackendBookingToMobile, adaptBackendHostDashboard } from './api';
import { mockHostService } from './mock/mockHostService';
import { APP_CONFIG } from '../constants/config';

export const hostService = {
  async getDashboardSummary(hostId: string): Promise<ApiResponse<HostEarningsSummary>> {
    const response = await apiGet<{ success: boolean; stats: any; recentBookings: any[] }>('/host/dashboard');

    if (response.success && response.data?.stats) {
      const summary = adaptBackendHostDashboard(response.data.stats, []);
      return {
        success: true,
        data: summary,
      };
    }

    console.warn('[hostService.getDashboardSummary] Live API failed. Falling back to mock.');
    return mockHostService.getDashboardSummary(hostId);
  },

  async getHostBookings(hostId: string): Promise<ApiResponse<Booking[]>> {
    const response = await apiGet<{ success: boolean; bookings: any[] }>('/bookings');

    if (response.success && response.data?.bookings && Array.isArray(response.data.bookings)) {
      return {
        success: true,
        data: response.data.bookings.map(adaptBackendBookingToMobile),
      };
    }

    console.warn('[hostService.getHostBookings] Live API failed. Falling back to mock.');
    return mockHostService.getHostBookings(hostId);
  },

  async getHostEarnings(hostId: string): Promise<ApiResponse<any[]>> {
    const response = await apiGet<{ success: boolean; earnings: any[] }>('/host/earnings');
    if (response.success && response.data?.earnings) {
      return {
        success: true,
        data: response.data.earnings,
      };
    }
    return {
      success: true,
      data: [],
    };
  },

  async updateBookingStatus(
    bookingId: string,
    status: 'confirmed' | 'cancelled'
  ): Promise<ApiResponse<{ bookingId: string; status: string }>> {
    return mockHostService.updateBookingStatus(bookingId, status);
  },

  async requestPayout(amount: number, upiOrAccount: string): Promise<ApiResponse<WithdrawalRequest>> {
    return mockHostService.requestPayout(amount, upiOrAccount);
  },

  calculateCommission(
    grossAmount: number,
    category: 'car' | 'bike' | 'suv' | 'ev' = 'car'
  ): {
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
