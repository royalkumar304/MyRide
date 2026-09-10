import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Booking, BookingStatus, InspectionData } from '../../types';
import { MOCK_BOOKINGS } from '../../services/mockData';

interface BookingState {
  bookings: Booking[];
  activeBooking: Booking | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: BookingState = {
  bookings: MOCK_BOOKINGS,
  activeBooking: MOCK_BOOKINGS[0],
  isLoading: false,
  error: null,
};

export const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    setBookings: (state, action: PayloadAction<Booking[]>) => {
      state.bookings = action.payload;
    },
    addBooking: (state, action: PayloadAction<Booking>) => {
      state.bookings = [action.payload, ...state.bookings];
      state.activeBooking = action.payload;
    },
    setActiveBooking: (state, action: PayloadAction<Booking | null>) => {
      state.activeBooking = action.payload;
    },
    updateBookingStatus: (state, action: PayloadAction<{ id: string; status: BookingStatus }>) => {
      const b = state.bookings.find(item => item.id === action.payload.id);
      if (b) {
        b.status = action.payload.status;
      }
      if (state.activeBooking?.id === action.payload.id) {
        state.activeBooking.status = action.payload.status;
      }
    },
    setStartInspection: (state, action: PayloadAction<{ id: string; inspection: InspectionData }>) => {
      const b = state.bookings.find(item => item.id === action.payload.id);
      if (b) {
        b.startInspection = action.payload.inspection;
        b.status = 'active';
      }
      if (state.activeBooking?.id === action.payload.id) {
        state.activeBooking.startInspection = action.payload.inspection;
        state.activeBooking.status = 'active';
      }
    },
    setEndInspection: (state, action: PayloadAction<{ id: string; inspection: InspectionData }>) => {
      const b = state.bookings.find(item => item.id === action.payload.id);
      if (b) {
        b.endInspection = action.payload.inspection;
        b.status = 'completed';
      }
      if (state.activeBooking?.id === action.payload.id) {
        state.activeBooking.endInspection = action.payload.inspection;
        state.activeBooking.status = 'completed';
      }
    },
    cancelBookingWithRefund: (state, action: PayloadAction<{
      id: string;
      reason: string;
      cancelledBy: 'customer' | 'host';
      refundPercentage: 100 | 0;
      refundAmount: number;
      hostInformedCustomer?: boolean;
    }>) => {
      const b = state.bookings.find(item => item.id === action.payload.id);
      if (b) {
        b.status = 'cancelled';
        b.cancellationReason = action.payload.reason;
        b.cancelledAt = new Date().toISOString();
        b.cancelledBy = action.payload.cancelledBy;
        b.refundPercentage = action.payload.refundPercentage;
        b.refundAmount = action.payload.refundAmount;
        b.hostInformedCustomer = action.payload.hostInformedCustomer;
        b.paymentStatus = action.payload.refundPercentage === 100 ? 'refunded' : b.paymentStatus;
      }
      if (state.activeBooking?.id === action.payload.id) {
        state.activeBooking.status = 'cancelled';
        state.activeBooking.cancellationReason = action.payload.reason;
        state.activeBooking.cancelledAt = new Date().toISOString();
        state.activeBooking.cancelledBy = action.payload.cancelledBy;
        state.activeBooking.refundPercentage = action.payload.refundPercentage;
        state.activeBooking.refundAmount = action.payload.refundAmount;
        state.activeBooking.hostInformedCustomer = action.payload.hostInformedCustomer;
        state.activeBooking.paymentStatus = action.payload.refundPercentage === 100 ? 'refunded' : state.activeBooking.paymentStatus;
      }
    },
    rescheduleBooking: (state, action: PayloadAction<{
      id: string;
      newStartDate: string;
      newEndDate: string;
      modificationNote?: string;
      hostInformedCustomer?: boolean;
    }>) => {
      const b = state.bookings.find(item => item.id === action.payload.id);
      if (b) {
        b.startDate = action.payload.newStartDate;
        b.endDate = action.payload.newEndDate;
        b.modificationNote = action.payload.modificationNote;
        if (action.payload.hostInformedCustomer !== undefined) {
          b.hostInformedCustomer = action.payload.hostInformedCustomer;
        }
      }
      if (state.activeBooking?.id === action.payload.id) {
        state.activeBooking.startDate = action.payload.newStartDate;
        state.activeBooking.endDate = action.payload.newEndDate;
        state.activeBooking.modificationNote = action.payload.modificationNote;
        if (action.payload.hostInformedCustomer !== undefined) {
          state.activeBooking.hostInformedCustomer = action.payload.hostInformedCustomer;
        }
      }
    },
    setBookingLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setBookings,
  addBooking,
  setActiveBooking,
  updateBookingStatus,
  cancelBookingWithRefund,
  rescheduleBooking,
  setStartInspection,
  setEndInspection,
  setBookingLoading,
} = bookingSlice.actions;

export default bookingSlice.reducer;
