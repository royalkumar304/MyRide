import { Vehicle, VehicleFilterParams } from '../types';
import { apiClient, ApiResponse } from './apiClient';
import { adaptBackendVehicleToMobile } from './api/adapters';
import { mockVehicleService } from './mock/mockVehicleService';

export const vehicleService = {
  async getVehicles(params?: VehicleFilterParams): Promise<ApiResponse<Vehicle[]>> {
    const queryParts: string[] = [];

    if (params) {
      if (params.city && params.city !== 'All Cities') {
        queryParts.push(`city=${encodeURIComponent(params.city)}`);
      }
      if (params.category && params.category !== 'all') {
        queryParts.push(`vehicleType=${encodeURIComponent(params.category.toUpperCase())}`);
      }
      if (params.minPrice) {
        queryParts.push(`minPrice=${encodeURIComponent(params.minPrice.toString())}`);
      }
      if (params.maxPrice) {
        queryParts.push(`maxPrice=${encodeURIComponent(params.maxPrice.toString())}`);
      }
      if (params.fuelTypes && params.fuelTypes.length === 1) {
        queryParts.push(`fuelType=${encodeURIComponent(params.fuelTypes[0])}`);
      }
      if (params.transmissions && params.transmissions.length === 1) {
        queryParts.push(`transmission=${encodeURIComponent(params.transmissions[0])}`);
      }
      if (params.sortBy) {
        queryParts.push(`sortBy=${encodeURIComponent(params.sortBy)}`);
      }
    }

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const response = await apiClient.get<{ success: boolean; count: number; vehicles: any[] }>(`/vehicles${queryString}`);

    if (response.success && response.data?.vehicles && Array.isArray(response.data.vehicles)) {
      let list = response.data.vehicles.map(adaptBackendVehicleToMobile);

      // Client-side text search & multi-select refinements
      if (params?.searchQuery) {
        const q = params.searchQuery.toLowerCase();
        list = list.filter(
          (v) =>
            v.name.toLowerCase().includes(q) ||
            v.brand.toLowerCase().includes(q) ||
            v.area.toLowerCase().includes(q) ||
            v.city.toLowerCase().includes(q)
        );
      }
      if (params?.deliveryOnly) {
        list = list.filter((v) => v.deliveryAvailable);
      }
      if (params?.instantBookingOnly) {
        list = list.filter((v) => v.instantBooking);
      }
      if (params?.verifiedOnly) {
        list = list.filter((v) => v.isHostVerified);
      }

      return {
        success: true,
        data: list,
        message: `Fetched ${list.length} vehicles from live backend`,
      };
    }

    console.warn('[vehicleService.getVehicles] Live API unreachable or empty. Using mockVehicleService.');
    return mockVehicleService.getVehicles(params);
  },

  async getVehicleById(id: string): Promise<ApiResponse<Vehicle>> {
    const response = await apiClient.get<{ success: boolean; vehicle: any }>(`/vehicles/${id}`);
    if (response.success && response.data?.vehicle) {
      return {
        success: true,
        data: adaptBackendVehicleToMobile(response.data.vehicle),
      };
    }

    console.warn(`[vehicleService.getVehicleById] Live API failed for vehicle ${id}. Using mock fallback.`);
    return mockVehicleService.getVehicleById(id);
  },

  async calculateFareQuote(payload: {
    vehicleId: string;
    startDateTime: string;
    endDateTime: string;
    pickupType?: 'self_pickup' | 'home_delivery';
    discountAmount?: number;
  }): Promise<ApiResponse<{ durationHours: number; durationDays: number; breakdown: any }>> {
    const response = await apiClient.post<{
      success: boolean;
      durationHours: number;
      durationDays: number;
      breakdown: any;
    }>('/vehicles/quote', payload);

    if (response.success && response.data) {
      return {
        success: true,
        data: response.data,
      };
    }

    return {
      success: false,
      message: response.message || 'Failed to calculate quote from server',
    };
  },

  async getSupportedCities(): Promise<ApiResponse<string[]>> {
    const response = await apiClient.get<{ success: boolean; cities: string[] }>('/vehicles/cities');
    if (response.success && response.data?.cities) {
      return {
        success: true,
        data: response.data.cities,
      };
    }
    return {
      success: true,
      data: ['Lucknow', 'Jaipur', 'Indore', 'Bhopal', 'Patna', 'Agra', 'Varanasi', 'Kanpur'],
    };
  },

  async getHostVehicles(hostId: string): Promise<ApiResponse<Vehicle[]>> {
    const response = await apiClient.get<{ success: boolean; vehicles: any[] }>('/host/vehicles');
    if (response.success && response.data?.vehicles && Array.isArray(response.data.vehicles)) {
      return {
        success: true,
        data: response.data.vehicles.map(adaptBackendVehicleToMobile),
      };
    }

    console.warn('[vehicleService.getHostVehicles] Live API unreachable. Falling back to mock.');
    return mockVehicleService.getHostVehicles(hostId);
  },

  async addVehicle(vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'tripsCount' | 'rating'>): Promise<ApiResponse<Vehicle>> {
    const payload = {
      type: vehicleData.category.toUpperCase(),
      brand: vehicleData.brand,
      model: vehicleData.model,
      variant: vehicleData.variant || '',
      year: vehicleData.year,
      registrationNumber: vehicleData.registrationNumber,
      fuelType: vehicleData.fuelType,
      transmission: vehicleData.transmission,
      seats: vehicleData.seatingCapacity,
      dailyRate: vehicleData.pricePerDay,
      securityDeposit: vehicleData.securityDeposit,
      deliveryFee: vehicleData.deliveryFee || 150,
      city: vehicleData.city,
      area: vehicleData.area,
      images: vehicleData.images,
      features: vehicleData.features,
    };

    const response = await apiClient.post<{ success: boolean; vehicle: any }>('/host/vehicles', payload);
    if (response.success && response.data?.vehicle) {
      return {
        success: true,
        data: adaptBackendVehicleToMobile(response.data.vehicle),
        message: 'Vehicle added successfully and submitted for verification',
      };
    }

    console.warn('[vehicleService.addVehicle] Live API failed. Falling back to mock.');
    return mockVehicleService.addVehicle(vehicleData);
  },
};
