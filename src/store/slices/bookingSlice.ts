import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Booking, BookingStatus, InspectionData } from '../../types';
import { bookingService } from '../../services/bookingService';

interface BookingState {
  bookings: Booking[];
  activeBooking: Booking | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Redux represents server state, not the source of truth.
 * Initial bookings array is empty until fetched from the live backend API.
 */
const initialState: BookingState = {
  bookings: [],
  activeBooking: null,
  isLoading: false,
  error: null,
};

export const fetchBookings = createAsyncThunk(
  'bookings/fetchBookings',
  async (customerId: string | undefined, { rejectWithValue }) => {
    try {
      const res = await bookingService.getBookings(customerId);
      if (!res.success) {
        return rejectWithValue(res.message || 'Failed to fetch bookings from server');
      }
      return res.data || [];
    } catch (err: any) {
      return rejectWithValue(err.message || 'Error communicating with booking server');
    }
  }
);

export const fetchBookingById = createAsyncThunk(
  'bookings/fetchBookingById',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const res = await bookingService.getBookingById(bookingId);
      if (!res.success || !res.data) {
        return rejectWithValue(res.message || `Booking ${bookingId} not found`);
      }
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Error fetching booking details');
    }
  }
);

export const createBookingThunk = createAsyncThunk(
  'bookings/createBookingThunk',
  async (bookingData: Omit<Booking, 'id' | 'createdAt'>, { rejectWithValue }) => {
    try {
      const res = await bookingService.createBooking(bookingData);
      if (!res.success || !res.data) {
        return rejectWithValue(res.message || 'Failed to create booking on backend');
      }
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to create booking');
    }
  }
);

export const startHandoverThunk = createAsyncThunk(
  'bookings/startHandoverThunk',
  async ({ bookingId, inspection }: { bookingId: string; inspection: InspectionData }, { rejectWithValue }) => {
    try {
      const res = await bookingService.startRideInspection(bookingId, inspection);
      if (!res.success || !res.data) {
        return rejectWithValue(res.message || 'Failed to start handover on server');
      }
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Handover inspection request failed');
    }
  }
);

export const completeHandoverThunk = createAsyncThunk(
  'bookings/completeHandoverThunk',
  async ({ bookingId, inspection }: { bookingId: string; inspection: InspectionData }, { rejectWithValue }) => {
    try {
      const res = await bookingService.endRideInspection(bookingId, inspection);
      if (!res.success || !res.data) {
        return rejectWithValue(res.message || 'Failed to complete handover on server');
      }
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'End handover inspection request failed');
    }
  }
);

export const cancelBookingThunk = createAsyncThunk(
  'bookings/cancelBookingThunk',
  async (
    payload: {
      bookingId: string;
      reason: string;
      cancelledBy: 'customer' | 'host';
      refundPercentage: 100 | 0;
      refundAmount?: number;
      hostInformedCustomer?: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await bookingService.cancelBooking(
        payload.bookingId,
        payload.reason,
        payload.cancelledBy,
        payload.refundPercentage,
        payload.refundAmount,
        payload.hostInformedCustomer
      );
      if (!res.success || !res.data) {
        return rejectWithValue(res.message || 'Failed to cancel booking on server');
      }
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to cancel booking');
    }
  }
);

export const bookingSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    setBookings: (state, action: PayloadAction<Booking[]>) => {
      state.bookings = action.payload;
    },
    addBooking: (state, action: PayloadAction<Booking>) => {
      // Upsert server-confirmed booking by backend ID
      const existsIndex = state.bookings.findIndex((b) => b.id === action.payload.id);
      if (existsIndex >= 0) {
        state.bookings[existsIndex] = action.payload;
      } else {
        state.bookings = [action.payload, ...state.bookings];
      }
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
    clearBookingError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchBookings
    builder.addCase(fetchBookings.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchBookings.fulfilled, (state, action) => {
      state.isLoading = false;
      state.bookings = action.payload;
      if (!state.activeBooking && action.payload.length > 0) {
        state.activeBooking = action.payload[0];
      }
    });
    builder.addCase(fetchBookings.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // fetchBookingById
    builder.addCase(fetchBookingById.fulfilled, (state, action) => {
      state.activeBooking = action.payload;
      const index = state.bookings.findIndex((b) => b.id === action.payload.id);
      if (index >= 0) {
        state.bookings[index] = action.payload;
      } else {
        state.bookings.push(action.payload);
      }
    });

    // createBookingThunk
    builder.addCase(createBookingThunk.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(createBookingThunk.fulfilled, (state, action) => {
      state.isLoading = false;
      const existsIndex = state.bookings.findIndex((b) => b.id === action.payload.id);
      if (existsIndex >= 0) {
        state.bookings[existsIndex] = action.payload;
      } else {
        state.bookings = [action.payload, ...state.bookings];
      }
      state.activeBooking = action.payload;
    });
    builder.addCase(createBookingThunk.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // startHandoverThunk
    builder.addCase(startHandoverThunk.fulfilled, (state, action) => {
      state.activeBooking = action.payload;
      const index = state.bookings.findIndex((b) => b.id === action.payload.id);
      if (index >= 0) {
        state.bookings[index] = action.payload;
      }
    });

    // completeHandoverThunk
    builder.addCase(completeHandoverThunk.fulfilled, (state, action) => {
      state.activeBooking = action.payload;
      const index = state.bookings.findIndex((b) => b.id === action.payload.id);
      if (index >= 0) {
        state.bookings[index] = action.payload;
      }
    });

    // cancelBookingThunk
    builder.addCase(cancelBookingThunk.fulfilled, (state, action) => {
      const index = state.bookings.findIndex((b) => b.id === action.payload.id);
      if (index >= 0) {
        state.bookings[index] = action.payload;
      } else {
        state.bookings.unshift(action.payload);
      }
      if (state.activeBooking?.id === action.payload.id) {
        state.activeBooking = action.payload;
      }
    });
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
  clearBookingError,
} = bookingSlice.actions;

export default bookingSlice.reducer;
