import { Booking, BookingStatus, InspectionData, Review } from '../types';
import { MOCK_BOOKINGS, MOCK_REVIEWS } from './mockData';
import { mockApiCall, ApiResponse } from './api';

let bookingsDatabase = [...MOCK_BOOKINGS];
let reviewsDatabase = [...MOCK_REVIEWS];

export const bookingService = {
  async getBookings(customerId?: string): Promise<ApiResponse<Booking[]>> {
    return mockApiCall(bookingsDatabase, 250);
  },

  async getBookingById(bookingId: string): Promise<ApiResponse<Booking>> {
    const booking = bookingsDatabase.find(b => b.id === bookingId);
    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }
    return mockApiCall(booking, 200);
  },

  async createBooking(bookingData: Omit<Booking, 'id' | 'createdAt'>): Promise<ApiResponse<Booking>> {
    const randomIdSuffix = Math.floor(100000 + Math.random() * 900000);
    const newBooking: Booking = {
      ...bookingData,
      id: `MYR-${randomIdSuffix}`,
      createdAt: new Date().toISOString(),
    };
    bookingsDatabase = [newBooking, ...bookingsDatabase];
    return mockApiCall(newBooking, 400);
  },

  async cancelBooking(
    bookingId: string,
    reason: string,
    cancelledBy: 'customer' | 'host' = 'customer',
    refundPercentage: 100 | 0 = 100,
    refundAmount?: number,
    hostInformedCustomer?: boolean
  ): Promise<ApiResponse<Booking>> {
    const index = bookingsDatabase.findIndex(b => b.id === bookingId);
    if (index === -1) {
      return { success: false, error: 'Booking not found' };
    }
    const currentBooking = bookingsDatabase[index];
    const calculatedRefund = refundAmount !== undefined ? refundAmount : (refundPercentage === 100 ? currentBooking.fare.totalPayableNow : 0);

    bookingsDatabase[index] = {
      ...currentBooking,
      status: 'cancelled',
      cancellationReason: reason,
      cancelledAt: new Date().toISOString(),
      cancelledBy,
      refundPercentage,
      refundAmount: calculatedRefund,
      hostInformedCustomer,
      paymentStatus: refundPercentage === 100 ? 'refunded' : currentBooking.paymentStatus,
    };
    return mockApiCall(bookingsDatabase[index], 300);
  },

  async startRideInspection(bookingId: string, inspection: InspectionData): Promise<ApiResponse<Booking>> {
    const index = bookingsDatabase.findIndex(b => b.id === bookingId);
    if (index === -1) {
      return { success: false, error: 'Booking not found' };
    }
    bookingsDatabase[index] = {
      ...bookingsDatabase[index],
      status: 'active',
      startInspection: inspection,
    };
    return mockApiCall(bookingsDatabase[index], 350);
  },

  async endRideInspection(bookingId: string, inspection: InspectionData): Promise<ApiResponse<Booking>> {
    const index = bookingsDatabase.findIndex(b => b.id === bookingId);
    if (index === -1) {
      return { success: false, error: 'Booking not found' };
    }
    bookingsDatabase[index] = {
      ...bookingsDatabase[index],
      status: 'completed',
      endInspection: inspection,
    };
    return mockApiCall(bookingsDatabase[index], 350);
  },

  async submitReview(reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<ApiResponse<Review>> {
    const newReview: Review = {
      ...reviewData,
      id: 'rev-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    reviewsDatabase = [newReview, ...reviewsDatabase];
    
    // Mark booking as rated
    const bookingIndex = bookingsDatabase.findIndex(b => b.id === reviewData.bookingId);
    if (bookingIndex !== -1) {
      bookingsDatabase[bookingIndex].rated = true;
    }

    return mockApiCall(newReview, 300);
  },

  async getVehicleReviews(vehicleId: string): Promise<ApiResponse<Review[]>> {
    const reviews = reviewsDatabase.filter(r => r.vehicleId === vehicleId);
    return mockApiCall(reviews, 200);
  },
};
