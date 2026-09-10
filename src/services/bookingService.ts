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

    console.warn('[bookingService.getBookings] Live API unreachable. Falling back to mock.');
    return mockBookingService.getBookings(customerId);
  },

  async getBookingById(bookingId: string): Promise<ApiResponse<Booking>> {
    const response = await apiClient.get<{ success: boolean; booking: any }>(`/bookings/${bookingId}`);

    if (response.success && response.data?.booking) {
      return {
        success: true,
        data: adaptBackendBookingToMobile(response.data.booking),
      };
    }

    console.warn(`[bookingService.getBookingById] Live API failed for ${bookingId}. Using mock.`);
    return mockBookingService.getBookingById(bookingId);
  },

  async createBooking(bookingData: Omit<Booking, 'id' | 'createdAt'>): Promise<ApiResponse<Booking>> {
    const payload = {
      vehicleId: bookingData.vehicleId,
      startDateTime: bookingData.startDate,
      endDateTime: bookingData.endDate,
      durationDays: bookingData.fare.durationDays || 1,
      pickupType: bookingData.pickupMethod || 'self_pickup',
      pickupLocation: bookingData.pickupLocation || 'Hazratganj Hub',
      dropoffLocation: bookingData.dropoffLocation || 'Hazratganj Hub',
    };

    const response = await apiClient.post<{ success: boolean; booking: any; message?: string }>('/bookings', payload);

    if (response.success && response.data?.booking) {
      return {
        success: true,
        data: adaptBackendBookingToMobile(response.data.booking),
        message: response.data.message || 'Booking reserved successfully in live database',
      };
    }

    console.warn('[bookingService.createBooking] Live API failed. Using mock fallback.');
    return mockBookingService.createBooking(bookingData);
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
      };
    }

    console.warn('[bookingService.cancelBooking] Live API failed. Falling back to mock.');
    return mockBookingService.cancelBooking(
      bookingId,
      reason,
      cancelledBy,
      refundPercentage,
      refundAmount,
      hostInformedCustomer
    );
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
      };
    }

    console.warn('[bookingService.startRideInspection] Live API failed. Falling back to mock.');
    return mockBookingService.startRideInspection(bookingId, inspection);
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
      };
    }

    console.warn('[bookingService.endRideInspection] Live API failed. Falling back to mock.');
    return mockBookingService.endRideInspection(bookingId, inspection);
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
