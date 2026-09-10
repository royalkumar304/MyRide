import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Vehicle, VehicleCategory, VehicleFilterParams } from '../../types';
import { MOCK_VEHICLES } from '../../services/mockData';

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

const initialState: VehicleState = {
  vehicles: MOCK_VEHICLES,
  savedVehicleIds: ['veh-001', 'veh-003'],
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

export const vehicleSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {
    setVehicles: (state, action: PayloadAction<Vehicle[]>) => {
      state.vehicles = action.payload;
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
        state.savedVehicleIds = state.savedVehicleIds.filter(vId => vId !== id);
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
});

export const {
  setVehicles,
  setSelectedCategory,
  setSearchQuery,
  setFilters,
  resetFilters,
  toggleSaveVehicle,
  setSelectedVehicle,
  setVehiclesLoading,
} = vehicleSlice.actions;

export default vehicleSlice.reducer;
