import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { HostEarningsSummary, Vehicle, Booking } from '../../types';
import { MOCK_HOST_SUMMARY } from '../../services/mockData';
import { hostService } from '../../services/hostService';

interface HostState {
  summary: HostEarningsSummary;
  hostVehicles: Vehicle[];
  hostBookings: Booking[];
  isLoading: boolean;
  error: string | null;
}

const initialState: HostState = {
  summary: MOCK_HOST_SUMMARY,
  hostVehicles: [],
  hostBookings: [],
  isLoading: false,
  error: null,
};

export const fetchHostDashboard = createAsyncThunk(
  'host/fetchDashboard',
  async (_, { rejectWithValue }) => {
    const res = await hostService.getHostDashboard();
    if (!res.success || !res.data) {
      return rejectWithValue(res.message || 'Failed to fetch host dashboard');
    }
    return res.data;
  }
);

export const fetchHostVehicles = createAsyncThunk(
  'host/fetchVehicles',
  async (_, { rejectWithValue }) => {
    const res = await hostService.getHostVehicles();
    if (!res.success || !res.data) {
      return rejectWithValue(res.message || 'Failed to fetch host vehicles');
    }
    return res.data;
  }
);

export const createHostVehicleThunk = createAsyncThunk(
  'host/createVehicle',
  async (vehicleData: any, { rejectWithValue }) => {
    const res = await hostService.createHostVehicle(vehicleData);
    if (!res.success || !res.data) {
      return rejectWithValue(res.message || 'Failed to create host vehicle');
    }
    return res.data;
  }
);

export const hostSlice = createSlice({
  name: 'host',
  initialState,
  reducers: {
    setHostSummary: (state, action: PayloadAction<HostEarningsSummary>) => {
      state.summary = action.payload;
    },
    setHostVehicles: (state, action: PayloadAction<Vehicle[]>) => {
      state.hostVehicles = action.payload;
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
  extraReducers: (builder) => {
    // Dashboard
    builder
      .addCase(fetchHostDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHostDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.summary = action.payload.summary;
        if (action.payload.recentBookings && action.payload.recentBookings.length > 0) {
          state.hostBookings = action.payload.recentBookings;
        }
      })
      .addCase(fetchHostDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Host Vehicles
    builder
      .addCase(fetchHostVehicles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHostVehicles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.hostVehicles = action.payload;
      })
      .addCase(fetchHostVehicles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create Vehicle
    builder
      .addCase(createHostVehicleThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createHostVehicleThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.hostVehicles.unshift(action.payload);
      })
      .addCase(createHostVehicleThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setHostSummary,
  setHostVehicles,
  addHostVehicle,
  updateHostBookingStatus,
  hostCancelBooking,
  hostRescheduleBooking,
  deductBalanceAfterPayout,
  setHostLoading,
} = hostSlice.actions;

export default hostSlice.reducer;
