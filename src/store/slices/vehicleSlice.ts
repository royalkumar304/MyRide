import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Vehicle, VehicleCategory, VehicleFilterParams } from '../../types';
import { vehicleService } from '../../services/vehicleService';

interface VehicleState {
  vehicles: Vehicle[];
  savedVehicleIds: string[];
  selectedCategory: VehicleCategory | 'all';
  searchQuery: string;
  selectedVehicle: Vehicle | null;
  filters: VehicleFilterParams;
  isLoading: boolean;
  error: string | null;
}

/**
 * Initial vehicle state without hardcoded mock vehicles.
 * Real vehicles are loaded dynamically from the backend API.
 */
const initialState: VehicleState = {
  vehicles: [],
  savedVehicleIds: [],
  selectedCategory: 'all',
  searchQuery: '',
  selectedVehicle: null,
  filters: {
    category: 'all',
    minPrice: 0,
    maxPrice: 5000,
    sortBy: 'rating',
  },
  isLoading: false,
  error: null,
};

/**
 * Async thunk to fetch vehicles from GET /vehicles
 */
export const fetchVehicles = createAsyncThunk(
  'vehicles/fetchVehicles',
  async (params: VehicleFilterParams | undefined, { rejectWithValue }) => {
    try {
      const response = await vehicleService.getVehicles(params);
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue(response.message || 'Failed to fetch vehicles');
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error fetching vehicles');
    }
  }
);

/**
 * Async thunk to fetch single vehicle by ID from GET /vehicles/:id
 */
export const fetchVehicleById = createAsyncThunk(
  'vehicles/fetchVehicleById',
  async (vehicleId: string, { rejectWithValue }) => {
    try {
      const response = await vehicleService.getVehicleById(vehicleId);
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue(response.message || 'Failed to fetch vehicle');
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network error fetching vehicle');
    }
  }
);

export const vehicleSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {
    setVehicles: (state, action: PayloadAction<Vehicle[]>) => {
      // Deduplicate vehicles to prevent duplicate objects
      const seen = new Set<string>();
      state.vehicles = action.payload.filter((v) => {
        if (!v?.id || seen.has(v.id)) return false;
        seen.add(v.id);
        return true;
      });
    },
    upsertVehicle: (state, action: PayloadAction<Vehicle>) => {
      const index = state.vehicles.findIndex((v) => v.id === action.payload.id);
      if (index >= 0) {
        state.vehicles[index] = action.payload;
      } else {
        state.vehicles.push(action.payload);
      }
      state.selectedVehicle = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<VehicleCategory | 'all'>) => {
      state.selectedCategory = action.payload;
      state.filters.category = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      state.filters.searchQuery = action.payload;
    },
    setFilters: (state, action: PayloadAction<VehicleFilterParams>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {
        category: 'all',
        minPrice: 0,
        maxPrice: 5000,
        sortBy: 'rating',
      };
      state.selectedCategory = 'all';
      state.searchQuery = '';
    },
    toggleSaveVehicle: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.savedVehicleIds.includes(id)) {
        state.savedVehicleIds = state.savedVehicleIds.filter((vId) => vId !== id);
      } else {
        state.savedVehicleIds.push(id);
      }
    },
    setSelectedVehicle: (state, action: PayloadAction<Vehicle | null>) => {
      state.selectedVehicle = action.payload;
    },
    setVehiclesLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchVehicles
      .addCase(fetchVehicles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.isLoading = false;
        const seen = new Set<string>();
        state.vehicles = action.payload.filter((v) => {
          if (!v?.id || seen.has(v.id)) return false;
          seen.add(v.id);
          return true;
        });
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // fetchVehicleById
      .addCase(fetchVehicleById.fulfilled, (state, action) => {
        const vehicle = action.payload;
        state.selectedVehicle = vehicle;
        const index = state.vehicles.findIndex((v) => v.id === vehicle.id);
        if (index >= 0) {
          state.vehicles[index] = vehicle;
        } else {
          state.vehicles.push(vehicle);
        }
      });
  },
});

export const {
  setVehicles,
  upsertVehicle,
  setSelectedCategory,
  setSearchQuery,
  setFilters,
  resetFilters,
  toggleSaveVehicle,
  setSelectedVehicle,
  setVehiclesLoading,
} = vehicleSlice.actions;

export default vehicleSlice.reducer;
