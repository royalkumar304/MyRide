import { Request, Response, NextFunction } from 'express';
import { isUsingMemoryStore } from '../config/db';
import { memoryStore } from '../config/store';
import VehicleModel from '../models/Vehicle';
import { calculateBookingPrice } from '../services/pricingEngine';
import { TIER2_TIER3_CITIES } from '@myride/constants';
import { VehicleSearchQuerySchema } from '@myride/validation';
import { VehicleType } from '@myride/types';

export async function listVehicles(req: Request, res: Response, next: NextFunction) {
  try {
    const query = VehicleSearchQuerySchema.parse(req.query);
    const {
      city,
      area,
      vehicleType,
      brand,
      transmission,
      fuelType,
      minPrice,
      maxPrice,
      price,
      seats,
      rating,
      distance,
      availability,
      sortBy = 'popular',
      q,
    } = query;

    const effectiveMaxPrice = maxPrice ?? price;

    let vehicles: any[] = [];
    if (isUsingMemoryStore()) {
      vehicles = memoryStore.vehicles.filter((v) => {
        if (v.verificationStatus !== 'APPROVED') return false;
        if (city && v.location.city.toLowerCase() !== city.toLowerCase()) return false;
        if (area && v.location.area.toLowerCase() !== area.toLowerCase()) return false;
        if (vehicleType && v.type.toLowerCase() !== vehicleType.toLowerCase()) return false;
        if (brand && !v.brand.toLowerCase().includes(brand.toLowerCase())) return false;
        if (transmission && v.transmission.toLowerCase() !== transmission.toLowerCase()) return false;
        if (fuelType && v.fuelType.toLowerCase() !== fuelType.toLowerCase()) return false;
        if (minPrice && v.pricing.dailyRate < minPrice) return false;
        if (effectiveMaxPrice && v.pricing.dailyRate > effectiveMaxPrice) return false;
        if (seats && (v.seats ?? 0) < seats) return false;
        if (rating && (v.rating ?? 0) < rating) return false;
        if (distance && ((v as any).distanceKm ?? 0) > distance) return false;
        if (availability && availability !== 'all' && v.availability?.isAvailable === false) return false;
        if (q) {
          const search = q.toLowerCase();
          const matches =
            ((v as any).name?.toLowerCase().includes(search)) ||
            v.brand?.toLowerCase().includes(search) ||
            v.model?.toLowerCase().includes(search) ||
            v.location?.city?.toLowerCase().includes(search) ||
            v.location?.area?.toLowerCase().includes(search);
          if (!matches) return false;
        }
        return true;
      });

      if (sortBy === 'price_asc') {
        vehicles.sort((a, b) => a.pricing.dailyRate - b.pricing.dailyRate);
      } else if (sortBy === 'price_desc') {
        vehicles.sort((a, b) => b.pricing.dailyRate - a.pricing.dailyRate);
      } else if (sortBy === 'rating') {
        vehicles.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      }
    } else {
      const filter: any = { verificationStatus: 'APPROVED' };
      if (city) filter['location.city'] = new RegExp(`^${city}$`, 'i');
      if (area) filter['location.area'] = new RegExp(area, 'i');
      if (vehicleType) filter.type = vehicleType.toUpperCase();
      if (brand) filter.brand = new RegExp(brand, 'i');
      if (transmission) filter.transmission = new RegExp(`^${transmission}$`, 'i');
      if (fuelType) filter.fuelType = new RegExp(`^${fuelType}$`, 'i');
      if (minPrice || effectiveMaxPrice) {
        filter['pricing.dailyRate'] = {};
        if (minPrice) filter['pricing.dailyRate'].$gte = minPrice;
        if (effectiveMaxPrice) filter['pricing.dailyRate'].$lte = effectiveMaxPrice;
      }
      if (seats) filter.seats = { $gte: seats };
      if (rating) filter.rating = { $gte: rating };
      if (availability && availability !== 'all') {
        filter['availability.isAvailable'] = availability === 'true' || availability === 'available';
      }
      if (q) {
        filter.$or = [
          { name: new RegExp(q, 'i') },
          { brand: new RegExp(q, 'i') },
          { model: new RegExp(q, 'i') },
          { 'location.city': new RegExp(q, 'i') },
          { 'location.area': new RegExp(q, 'i') },
        ];
      }

      let queryBuilder = VehicleModel.find(filter);
      if (sortBy === 'price_asc') queryBuilder = queryBuilder.sort({ 'pricing.dailyRate': 1 });
      else if (sortBy === 'price_desc') queryBuilder = queryBuilder.sort({ 'pricing.dailyRate': -1 });
      else if (sortBy === 'rating') queryBuilder = queryBuilder.sort({ rating: -1 });
      else queryBuilder = queryBuilder.sort({ createdAt: -1 });

      vehicles = await queryBuilder.exec();
    }

    res.json({
      success: true,
      count: vehicles.length,
      vehicles,
    });
  } catch (error) {
    next(error);
  }
}


export async function getVehicleById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    let vehicle: any = null;

    if (isUsingMemoryStore()) {
      vehicle = memoryStore.vehicles.find((v) => v._id === id);
    } else {
      vehicle = await VehicleModel.findById(id).populate('ownerId', 'name phone rating kycStatus');
    }

    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
      return;
    }

    // Host details
    let host: any = null;
    const hostIdStr = typeof vehicle.ownerId === 'object' ? vehicle.ownerId._id : vehicle.ownerId;
    if (isUsingMemoryStore()) {
      host = memoryStore.users.find((u) => u._id === hostIdStr);
    }

    const vehicleObj = typeof vehicle.toObject === 'function' ? vehicle.toObject() : vehicle;

    res.json({
      success: true,
      vehicle: {
        ...vehicleObj,
        host: host
          ? {
              id: host._id,
              name: host.name,
              kycStatus: host.kycStatus,
              rating: host.rating || 4.9,
            }
          : vehicleObj.ownerId,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function calculateFareQuote(req: Request, res: Response, next: NextFunction) {
  try {
    const startInput = req.body.startDateTime || req.body.startDate;
    const endInput = req.body.endDateTime || req.body.endDate;
    const { vehicleId, pickupType = 'self_pickup', discountAmount = 0 } = req.body;

    if (!vehicleId || !startInput || !endInput) {
      res.status(400).json({ success: false, message: 'vehicleId, startDateTime (or startDate), and endDateTime (or endDate) are required' });
      return;
    }

    let vehicle: any = null;
    if (isUsingMemoryStore()) {
      vehicle = memoryStore.vehicles.find((v) => v._id === vehicleId);
    } else {
      vehicle = await VehicleModel.findById(vehicleId);
    }

    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
      return;
    }

    const start = new Date(startInput).getTime();
    const end = new Date(endInput).getTime();
    const durationHours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));
    const durationDays = Math.max(1, Math.ceil(durationHours / 24));

    const vType = (vehicle.type || 'CAR').toUpperCase() as VehicleType;

    const breakdown = await calculateBookingPrice({
      dailyRate: vehicle.pricing.dailyRate,
      durationDays,
      vehicleType: vType,
      pickupType: pickupType as any,
      discountAmount: Number(discountAmount) || 0,
      securityDeposit: vehicle.pricing.securityDeposit || 2000,
    });

    res.json({
      success: true,
      durationHours,
      durationDays,
      pricing: breakdown,
      breakdown,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSupportedCities(req: Request, res: Response) {
  res.json({
    success: true,
    cities: TIER2_TIER3_CITIES,
  });
}
