import { Vehicle, VehicleFilterParams } from '../types';
import { apiClient, ApiResponse } from './apiClient';
import { adaptBackendVehicleToMobile } from './api/adapters';
import { mockVehicleService } from './mock/mockVehicleService';

export interface FareQuoteResponse {
  durationHours: number;
  durationDays: number;
  breakdown: {
    baseAmount: number;
    durationDays: number;
    deliveryFee: number;
    commissionRate: number;
    commissionAmount: number;
    taxes: number;
    discount: number;
    securityDeposit: number;
    totalAmount: number;
    hostEarnings: number;
  };
}

/**
 * Live Vehicle Service
 * Connects the mobile app to backend endpoints:
 * - GET  /vehicles
 * - GET  /vehicles/:id
 * - GET  /vehicles/cities
 * - POST /vehicles/quote
 */
export const vehicleService = {
  /**
   * Fetches vehicles matching filter criteria from GET /vehicles.
   * Maps backend data to mobile Vehicle model and prevents duplicate vehicle objects.
   */
  async getVehicles(params?: VehicleFilterParams): Promise<ApiResponse<Vehicle[]>> {
    const queryParts: string[] = [];

    if (params) {
      if (params.city && params.city !== 'All Cities') {
        queryParts.push(`city=${encodeURIComponent(params.city)}`);
      }
      if (params.area) {
        queryParts.push(`area=${encodeURIComponent(params.area)}`);
      }
      if (params.vehicleType) {
        queryParts.push(`vehicleType=${encodeURIComponent(params.vehicleType.toUpperCase())}`);
      } else if (params.category && params.category !== 'all') {
        queryParts.push(`vehicleType=${encodeURIComponent(params.category.toUpperCase())}`);
      }
      if (params.brand) {
        queryParts.push(`brand=${encodeURIComponent(params.brand)}`);
      }
      if (params.minPrice !== undefined) {
        queryParts.push(`minPrice=${encodeURIComponent(params.minPrice.toString())}`);
      }
      if (params.maxPrice !== undefined) {
        queryParts.push(`maxPrice=${encodeURIComponent(params.maxPrice.toString())}`);
      } else if (params.price !== undefined) {
        queryParts.push(`price=${encodeURIComponent(params.price.toString())}`);
      }
      if (params.fuelType) {
        queryParts.push(`fuelType=${encodeURIComponent(params.fuelType)}`);
      } else if (params.fuelTypes && params.fuelTypes.length === 1) {
        queryParts.push(`fuelType=${encodeURIComponent(params.fuelTypes[0])}`);
      }
      if (params.transmission) {
        queryParts.push(`transmission=${encodeURIComponent(params.transmission)}`);
      } else if (params.transmissions && params.transmissions.length === 1) {
        queryParts.push(`transmission=${encodeURIComponent(params.transmissions[0])}`);
      }
      if (params.seats !== undefined) {
        queryParts.push(`seats=${encodeURIComponent(params.seats.toString())}`);
      } else if (params.seatingCapacity && params.seatingCapacity.length === 1) {
        queryParts.push(`seats=${encodeURIComponent(params.seatingCapacity[0].toString())}`);
      }
      if (params.rating !== undefined) {
        queryParts.push(`rating=${encodeURIComponent(params.rating.toString())}`);
      } else if (params.minRating !== undefined) {
        queryParts.push(`rating=${encodeURIComponent(params.minRating.toString())}`);
      }
      if (params.distance !== undefined) {
        queryParts.push(`distance=${encodeURIComponent(params.distance.toString())}`);
      }
      if (params.availability !== undefined) {
        queryParts.push(`availability=${encodeURIComponent(String(params.availability))}`);
      }
      if (params.sortBy) {
        queryParts.push(`sortBy=${encodeURIComponent(params.sortBy)}`);
      }
      if (params.q) {
        queryParts.push(`q=${encodeURIComponent(params.q)}`);
      } else if (params.searchQuery) {
        queryParts.push(`q=${encodeURIComponent(params.searchQuery)}`);
      }
    }


    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const response = await apiClient.get<{ success: boolean; count: number; vehicles: any[] }>(
      `/vehicles${queryString}`
    );

    if (response.success && response.data?.vehicles && Array.isArray(response.data.vehicles)) {
      // Deduplicate vehicles by ID to prevent duplicate vehicle objects
      const vehicleMap = new Map<string, Vehicle>();

      for (const raw of response.data.vehicles) {
        const vehicle = adaptBackendVehicleToMobile(raw);
        if (vehicle.id && !vehicleMap.has(vehicle.id)) {
          vehicleMap.set(vehicle.id, vehicle);
        }
      }

      let list = Array.from(vehicleMap.values());

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

  /**
   * Fetches single vehicle details from GET /vehicles/:id.
   */
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

  /**
   * Calculates dynamic pricing and platform commission quote via POST /vehicles/quote.
   */
  async calculateFareQuote(payload: {
    vehicleId: string;
    startDateTime: string;
    endDateTime: string;
    pickupType?: 'self_pickup' | 'home_delivery';
    discountAmount?: number;
  }): Promise<ApiResponse<FareQuoteResponse>> {
    const response = await apiClient.post<FareQuoteResponse>('/vehicles/quote', {
      vehicleId: payload.vehicleId,
      startDateTime: payload.startDateTime,
      endDateTime: payload.endDateTime,
      pickupType: payload.pickupType || 'self_pickup',
      discountAmount: payload.discountAmount || 0,
    });

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

  /**
   * Retrieves list of supported cities from GET /vehicles/cities.
   */
  async getSupportedCities(): Promise<ApiResponse<string[]>> {
    const response = await apiClient.get<{ success: boolean; cities: any[] }>('/vehicles/cities');
    if (response.success && response.data?.cities && Array.isArray(response.data.cities)) {
      const cityNames: string[] = response.data.cities.map((c) =>
        typeof c === 'string' ? c : c.name
      );
      return {
        success: true,
        data: cityNames,
      };
    }

    return {
      success: true,
      data: ['Lucknow', 'Jaipur', 'Indore', 'Bhopal', 'Patna', 'Agra', 'Varanasi', 'Kanpur'],
    };
  },

  /**
   * Fetches host vehicles from GET /host/vehicles.
   */
  async getHostVehicles(hostId: string): Promise<ApiResponse<Vehicle[]>> {
    const response = await apiClient.get<{ success: boolean; vehicles: any[] }>('/host/vehicles');
    if (response.success && response.data?.vehicles && Array.isArray(response.data.vehicles)) {
      const vehicleMap = new Map<string, Vehicle>();
      for (const raw of response.data.vehicles) {
        const vehicle = adaptBackendVehicleToMobile(raw);
        if (vehicle.id && !vehicleMap.has(vehicle.id)) {
          vehicleMap.set(vehicle.id, vehicle);
        }
      }
      return {
        success: true,
        data: Array.from(vehicleMap.values()),
      };
    }

    console.warn('[vehicleService.getHostVehicles] Live API unreachable. Falling back to mock.');
    return mockVehicleService.getHostVehicles(hostId);
  },

  /**
   * Host adds a new vehicle via POST /host/vehicles.
   */
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

export default vehicleService;
