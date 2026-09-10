import { HostEarningsSummary, WithdrawalRequest, Booking, Vehicle } from '../types';
import { apiClient, ApiResponse } from './apiClient';
import { adaptBackendBookingToMobile, adaptBackendHostDashboard, adaptBackendVehicleToMobile } from './api/adapters';
import { mockHostService } from './mock/mockHostService';
import { APP_CONFIG } from '../constants/config';

export const hostService = {
  /**
   * GET /host/dashboard
   * Fetches real-time host earnings statistics and recent bookings from live backend
   */
  async getHostDashboard(): Promise<ApiResponse<{ summary: HostEarningsSummary; recentBookings: Booking[] }>> {
    const response = await apiClient.get<{ success: boolean; stats: any; recentBookings: any[] }>('/host/dashboard');

    if (response.success && response.data?.stats) {
      const recent = (response.data.recentBookings || []).map(adaptBackendBookingToMobile);
      const summary = adaptBackendHostDashboard(response.data.stats, []);
      return {
        success: true,
        data: { summary, recentBookings: recent },
      };
    }

    return {
      success: false,
      message: response.message || 'Failed to fetch host dashboard from server',
      error: response.error,
      statusCode: response.statusCode,
    };
  },

  async getDashboardSummary(hostId?: string): Promise<ApiResponse<HostEarningsSummary>> {
    const res = await this.getHostDashboard();
    if (res.success && res.data?.summary) {
      return {
        success: true,
        data: res.data.summary,
      };
    }

    console.warn('[hostService.getDashboardSummary] Live API failed. Falling back to mock.');
    return mockHostService.getDashboardSummary(hostId || 'host-101');
  },

  /**
   * GET /host/vehicles
   * Fetches vehicles registered by the authenticated host
   */
  async getHostVehicles(): Promise<ApiResponse<Vehicle[]>> {
    const response = await apiClient.get<{ success: boolean; count: number; vehicles: any[] }>('/host/vehicles');

    if (response.success && response.data?.vehicles && Array.isArray(response.data.vehicles)) {
      return {
        success: true,
        data: response.data.vehicles.map(adaptBackendVehicleToMobile),
      };
    }

    return {
      success: false,
      message: response.message || 'Failed to fetch host vehicles from server',
      error: response.error,
      statusCode: response.statusCode,
    };
  },

  /**
   * POST /host/vehicles
   * Creates and submits a new vehicle listing through the backend API with DB persistence
   */
  async createHostVehicle(vehicleData: {
    type: 'BIKE' | 'SCOOTER' | 'CAR' | 'SUV' | 'EV';
    brand: string;
    model: string;
    variant?: string;
    year: number;
    registrationNumber: string;
    fuelType: 'Petrol' | 'Diesel' | 'Electric' | 'CNG';
    transmission: 'Manual' | 'Automatic';
    seats: number;
    dailyRate: number;
    securityDeposit: number;
    deliveryFee?: number;
    city: string;
    area: string;
    images: string[];
    features?: string[];
  }): Promise<ApiResponse<Vehicle>> {
    const response = await apiClient.post<{ success: boolean; message: string; vehicle: any }>(
      '/host/vehicles',
      vehicleData
    );

    if (response.success && response.data?.vehicle) {
      return {
        success: true,
        data: adaptBackendVehicleToMobile(response.data.vehicle),
        message: response.data.message || 'Vehicle submitted successfully for admin verification.',
      };
    }

    return {
      success: false,
      message: response.message || 'Failed to create vehicle on server',
      error: response.error,
      statusCode: response.statusCode,
    };
  },

  async getHostBookings(hostId?: string): Promise<ApiResponse<Booking[]>> {
    const response = await apiClient.get<{ success: boolean; bookings: any[] }>('/bookings');

    if (response.success && response.data?.bookings && Array.isArray(response.data.bookings)) {
      return {
        success: true,
        data: response.data.bookings.map(adaptBackendBookingToMobile),
      };
    }

    console.warn('[hostService.getHostBookings] Live API failed. Falling back to mock.');
    return mockHostService.getHostBookings(hostId || 'host-101');
  },

  /**
   * GET /host/earnings
   * Fetches historical earning statements and commission breakdown
   */
  async getHostEarnings(): Promise<ApiResponse<any[]>> {
    const response = await apiClient.get<{ success: boolean; earnings: any[] }>('/host/earnings');
    if (response.success && response.data?.earnings) {
      return {
        success: true,
        data: response.data.earnings,
      };
    }
    return {
      success: false,
      message: response.message || 'Failed to fetch host earnings from server',
      error: response.error,
      statusCode: response.statusCode,
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
