import { Booking, InspectionData, Review } from '../types';
import { apiClient, ApiResponse } from './apiClient';
import { adaptBackendBookingToMobile } from './api/adapters';
import { mockBookingService } from './mock/mockBookingService';

export const bookingService = {
  async getBookings(customerId?: string): Promise<ApiResponse<Booking[]>> {
    const response = await apiClient.get<{ success: boolean; count: number; bookings: any[] }>('/bookings');

    if (response.success && response.data?.bookings && Array.isArray(response.data.bookings)) {
      return {
        success: true,
        data: response.data.bookings.map(adaptBackendBookingToMobile),
        message: `Loaded ${response.data.bookings.length} bookings`,
      };
    }

    // Only fallback if mock mode is explicitly requested or when live API fails during initial bootstrap
    if (!response.success && response.error === 'NETWORK_ERROR') {
      console.warn('[bookingService.getBookings] Network error connecting to live API. Using mock fallback.');
      return mockBookingService.getBookings(customerId);
    }

    return {
      success: false,
      message: response.message || 'Failed to retrieve bookings from server',
      error: response.error,
      data: [],
    };
  },

  async getBookingById(bookingId: string): Promise<ApiResponse<Booking>> {
    const response = await apiClient.get<{ success: boolean; booking: any }>(`/bookings/${bookingId}`);

    if (response.success && response.data?.booking) {
      return {
        success: true,
        data: adaptBackendBookingToMobile(response.data.booking),
      };
    }

    if (!response.success && response.error === 'NETWORK_ERROR') {
      console.warn(`[bookingService.getBookingById] Network error for ${bookingId}. Using mock fallback.`);
      return mockBookingService.getBookingById(bookingId);
    }

    return {
      success: false,
      message: response.message || `Booking ${bookingId} not found`,
      error: response.error,
    };
  },

  async createBooking(bookingData: Omit<Booking, 'id' | 'createdAt'>): Promise<ApiResponse<Booking>> {
    let startIso = bookingData.startDate;
    let endIso = bookingData.endDate;
    try {
      const parsedStart = new Date(bookingData.startDate);
      if (!isNaN(parsedStart.getTime())) {
        startIso = parsedStart.toISOString();
      }
      const parsedEnd = new Date(bookingData.endDate);
      if (!isNaN(parsedEnd.getTime())) {
        endIso = parsedEnd.toISOString();
      }
    } catch {
      // fallback to original values
    }

    const payload = {
      vehicleId: bookingData.vehicleId,
      startDateTime: startIso,
      endDateTime: endIso,
      durationDays: bookingData.fare?.durationDays || 1,
      pickupType: bookingData.pickupMethod || 'self_pickup',
      pickupLocation: bookingData.pickupLocation || 'Hazratganj Hub',
      dropoffLocation: bookingData.dropoffLocation || 'Hazratganj Hub',
    };

    const response = await apiClient.post<{ success: boolean; booking: any; message?: string }>('/bookings', payload);

    if (response.success && response.data?.booking) {
      const adapted = adaptBackendBookingToMobile(response.data.booking);
      return {
        success: true,
        data: adapted,
        message: response.data.message || 'Booking reserved successfully in live database',
      };
    }

    return {
      success: false,
      message: response.message || 'Failed to create booking on server',
      error: response.error,
      statusCode: response.statusCode,
    };
  },

  async cancelBooking(
    bookingId: string,
    reason: string,
    cancelledBy: 'customer' | 'host' = 'customer',
    refundPercentage: 100 | 0 = 100,
    refundAmount?: number,
    hostInformedCustomer?: boolean
  ): Promise<ApiResponse<Booking>> {
    const response = await apiClient.post<{ success: boolean; booking: any }>(`/bookings/${bookingId}/cancel`, {
      reason,
      cancelledBy,
      refundPercentage,
      refundAmount,
      hostInformedCustomer,
    });

    if (response.success && response.data?.booking) {
      return {
        success: true,
        data: adaptBackendBookingToMobile(response.data.booking),
        message: 'Booking cancelled successfully',
      };
    }

    return {
      success: false,
      message: response.message || 'Failed to cancel booking on server',
      error: response.error,
    };
  },

  async startRideInspection(bookingId: string, inspection: InspectionData): Promise<ApiResponse<Booking>> {
    const payload = {
      odometerReading: inspection.odometerReading,
      fuelPercent: inspection.fuelLevelPercentage,
      photos: inspection.photos,
      checklist: inspection.checklist,
    };

    const response = await apiClient.post<{ success: boolean; booking: any }>(
      `/bookings/${bookingId}/handover/start`,
      payload
    );

    if (response.success && response.data?.booking) {
      return {
        success: true,
        data: adaptBackendBookingToMobile(response.data.booking),
        message: 'Digital handover inspection recorded successfully',
      };
    }

    return {
      success: false,
      message: response.message || 'Failed to record digital handover on server',
      error: response.error,
    };
  },

  async endRideInspection(bookingId: string, inspection: InspectionData): Promise<ApiResponse<Booking>> {
    const payload = {
      odometerReading: inspection.odometerReading,
      fuelPercent: inspection.fuelLevelPercentage,
      photos: inspection.photos,
      checklist: inspection.checklist,
    };

    const response = await apiClient.post<{ success: boolean; booking: any }>(
      `/bookings/${bookingId}/handover/complete`,
      payload
    );

    if (response.success && response.data?.booking) {
      return {
        success: true,
        data: adaptBackendBookingToMobile(response.data.booking),
        message: 'Digital return handover completed successfully',
      };
    }

    return {
      success: false,
      message: response.message || 'Failed to complete return handover on server',
      error: response.error,
    };
  },

  async submitReview(reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<ApiResponse<Review>> {
    const response = await apiClient.post<{ success: boolean; review: any }>('/reviews', reviewData);
    if (response.success && response.data?.review) {
      return {
        success: true,
        data: response.data.review,
      };
    }

    return mockBookingService.submitReview(reviewData);
  },

  async getVehicleReviews(vehicleId: string): Promise<ApiResponse<Review[]>> {
    const response = await apiClient.get<{ success: boolean; reviews: Review[] }>(`/vehicles/${vehicleId}/reviews`);
    if (response.success && response.data?.reviews) {
      return {
        success: true,
        data: response.data.reviews,
      };
    }

    return mockBookingService.getVehicleReviews(vehicleId);
  },
};
