import { Vehicle, VehicleFilterParams } from '../../types';
import { MOCK_VEHICLES } from '../mockData';
import { mockApiCall, ApiResponse } from '../api';

let vehiclesDatabase = [...MOCK_VEHICLES];

export const mockVehicleService = {
  async getVehicles(params?: VehicleFilterParams): Promise<ApiResponse<Vehicle[]>> {
    let filtered = [...vehiclesDatabase];

    if (params) {
      if (params.category && params.category !== 'all') {
        filtered = filtered.filter(v => v.category === params.category);
      }
      if (params.city) {
        filtered = filtered.filter(v => v.city.toLowerCase() === params.city?.toLowerCase());
      }
      if (params.searchQuery) {
        const q = params.searchQuery.toLowerCase();
        filtered = filtered.filter(v => 
          v.name.toLowerCase().includes(q) || 
          v.brand.toLowerCase().includes(q) || 
          v.area.toLowerCase().includes(q) ||
          v.city.toLowerCase().includes(q)
        );
      }
      if (params.minPrice) {
        filtered = filtered.filter(v => v.pricePerDay >= (params.minPrice || 0));
      }
      if (params.maxPrice) {
        filtered = filtered.filter(v => v.pricePerDay <= (params.maxPrice || 99999));
      }
      if (params.fuelTypes && params.fuelTypes.length > 0) {
        filtered = filtered.filter(v => params.fuelTypes?.includes(v.fuelType));
      }
      if (params.transmissions && params.transmissions.length > 0) {
        filtered = filtered.filter(v => params.transmissions?.includes(v.transmission));
      }
      if (params.deliveryOnly) {
        filtered = filtered.filter(v => v.deliveryAvailable);
      }
      if (params.instantBookingOnly) {
        filtered = filtered.filter(v => v.instantBooking);
      }
      if (params.verifiedOnly) {
        filtered = filtered.filter(v => v.isHostVerified);
      }

      // Sort
      if (params.sortBy === 'price_asc') {
        filtered.sort((a, b) => a.pricePerDay - b.pricePerDay);
      } else if (params.sortBy === 'price_desc') {
        filtered.sort((a, b) => b.pricePerDay - a.pricePerDay);
      } else if (params.sortBy === 'rating') {
        filtered.sort((a, b) => b.rating - a.rating);
      } else if (params.sortBy === 'nearest') {
        filtered.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
      } else if (params.sortBy === 'popularity') {
        filtered.sort((a, b) => b.tripsCount - a.tripsCount);
      }
    }

    return mockApiCall(filtered, 300);
  },

  async getVehicleById(id: string): Promise<ApiResponse<Vehicle>> {
    const found = vehiclesDatabase.find(v => v.id === id);
    if (!found) {
      return { success: false, error: 'Vehicle not found' };
    }
    return mockApiCall(found, 200);
  },

  async addVehicle(vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'tripsCount' | 'rating'>): Promise<ApiResponse<Vehicle>> {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: 'veh-' + Date.now(),
      rating: 5.0,
      tripsCount: 0,
      createdAt: new Date().toISOString(),
    };
    vehiclesDatabase = [newVehicle, ...vehiclesDatabase];
    return mockApiCall(newVehicle, 400);
  },

  async getHostVehicles(hostId: string): Promise<ApiResponse<Vehicle[]>> {
    const hostVehicles = vehiclesDatabase.filter(v => v.hostId === hostId || v.hostId === 'host-101');
    return mockApiCall(hostVehicles, 250);
  },
};
