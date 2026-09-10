import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HostEarningsSummary, Vehicle, Booking } from '../../types';
import { MOCK_HOST_SUMMARY, MOCK_VEHICLES, MOCK_BOOKINGS } from '../../services/mockData';

interface HostState {
  summary: HostEarningsSummary;
  hostVehicles: Vehicle[];
  hostBookings: Booking[];
  isLoading: boolean;
  error: string | null;
}

const initialState: HostState = {
  summary: MOCK_HOST_SUMMARY,
  hostVehicles: [MOCK_VEHICLES[0], MOCK_VEHICLES[2]], // Rahul & Priya vehicles
  hostBookings: MOCK_BOOKINGS,
  isLoading: false,
  error: null,
};

export const hostSlice = createSlice({
  name: 'host',
  initialState,
  reducers: {
    setHostSummary: (state, action: PayloadAction<HostEarningsSummary>) => {
      state.summary = action.payload;
    },
    addHostVehicle: (state, action: PayloadAction<Vehicle>) => {
      state.hostVehicles.unshift(action.payload);
    },
    updateHostBookingStatus: (state, action: PayloadAction<{ id: string; status: 'confirmed' | 'cancelled' }>) => {
      const bk = state.hostBookings.find(b => b.id === action.payload.id);
      if (bk) {
        bk.status = action.payload.status === 'confirmed' ? 'upcoming' : 'cancelled';
      }
    },
    hostCancelBooking: (state, action: PayloadAction<{
      id: string;
      reason: string;
      hostInformedCustomer: boolean;
    }>) => {
      const bk = state.hostBookings.find(b => b.id === action.payload.id);
      if (bk) {
        bk.status = 'cancelled';
        bk.cancellationReason = action.payload.reason;
        bk.cancelledAt = new Date().toISOString();
        bk.cancelledBy = 'host';
        bk.refundPercentage = 100; // Customer gets 100% refund when host cancels
        bk.refundAmount = bk.fare.totalPayableNow;
        bk.hostInformedCustomer = action.payload.hostInformedCustomer;
        bk.paymentStatus = 'refunded';
      }
    },
    hostRescheduleBooking: (state, action: PayloadAction<{
      id: string;
      newStartDate: string;
      newEndDate: string;
      modificationNote?: string;
      hostInformedCustomer: boolean;
    }>) => {
      const bk = state.hostBookings.find(b => b.id === action.payload.id);
      if (bk) {
        bk.startDate = action.payload.newStartDate;
        bk.endDate = action.payload.newEndDate;
        bk.modificationNote = action.payload.modificationNote;
        bk.hostInformedCustomer = action.payload.hostInformedCustomer;
      }
    },
    deductBalanceAfterPayout: (state, action: PayloadAction<number>) => {
      state.summary.availableBalance = Math.max(0, state.summary.availableBalance - action.payload);
    },
    setHostLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setHostSummary,
  addHostVehicle,
  updateHostBookingStatus,
  hostCancelBooking,
  hostRescheduleBooking,
  deductBalanceAfterPayout,
  setHostLoading,
} = hostSlice.actions;

export default hostSlice.reducer;
