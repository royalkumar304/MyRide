import { Request, Response, NextFunction } from 'express';
import { isUsingMemoryStore } from '../config/db';
import { memoryStore } from '../config/store';
import VehicleModel from '../models/Vehicle';
import BookingModel from '../models/Booking';
import HostEarningModel from '../models/HostEarning';
import { VehicleCreateSchema } from '@myride/validation';

export async function getHostDashboard(req: any, res: Response, next: NextFunction) {
  try {
    const hostId = req.user?.userId || 'user_host_1';

    let vehicles: any[] = [];
    let bookings: any[] = [];
    let earnings: any[] = [];

    if (isUsingMemoryStore()) {
      vehicles = memoryStore.vehicles.filter((v) => v.ownerId === hostId);
      bookings = memoryStore.bookings.filter((b) => b.hostId === hostId);
      earnings = memoryStore.earnings.filter((e) => e.hostId === hostId);
    } else {
      vehicles = await VehicleModel.find({ ownerId: hostId });
      bookings = await BookingModel.find({ hostId }).populate('vehicleId').sort({ createdAt: -1 });
      earnings = await HostEarningModel.find({ hostId }).sort({ createdAt: -1 });
    }

    const totalGross = earnings.reduce((acc, e) => acc + (e.grossAmount || 0), 0);
    const totalCommissionDeducted = earnings.reduce((acc, e) => acc + (e.commissionAmount || 0), 0);
    const totalNetEarnings = earnings.reduce((acc, e) => acc + (e.netAmount || 0), 0);
    const activeRentals = bookings.filter((b) => b.bookingStatus === 'ACTIVE').length;

    res.json({
      success: true,
      stats: {
        totalVehicles: vehicles.length,
        activeRentals,
        completedBookings: bookings.filter((b) => b.bookingStatus === 'COMPLETED').length,
        totalGrossEarnings: Math.round(totalGross),
        totalCommissionPaid: Math.round(totalCommissionDeducted),
        netEarnings: Math.round(totalNetEarnings),
        averageCommissionRate: 15,
      },
      recentBookings: bookings.slice(0, 5),
    });
  } catch (error) {
    next(error);
  }
}

export async function getHostVehicles(req: any, res: Response, next: NextFunction) {
  try {
    const hostId = req.user?.userId || 'user_host_1';

    let vehicles: any[] = [];
    if (isUsingMemoryStore()) {
      vehicles = memoryStore.vehicles.filter((v) => v.ownerId === hostId);
    } else {
      vehicles = await VehicleModel.find({ ownerId: hostId }).sort({ createdAt: -1 });
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

export async function createHostVehicle(req: any, res: Response, next: NextFunction) {
  try {
    const hostId = req.user?.userId || 'user_host_1';
    const body = VehicleCreateSchema.parse(req.body);

    let vehicle: any = null;
    if (isUsingMemoryStore()) {
      vehicle = {
        _id: `veh_${Date.now()}`,
        id: `veh_${Date.now()}`,
        ownerId: hostId,
        ownerName: req.user?.name || 'Host User',
        ownerRating: 5.0,
        isHostVerified: true,
        type: body.type,
        brand: body.brand,
        model: body.model,
        variant: body.variant,
        year: body.year,
        registrationNumber: body.registrationNumber,
        fuelType: body.fuelType,
        transmission: body.transmission,
        seats: body.seats,
        pricing: {
          dailyRate: body.dailyRate,
          securityDeposit: body.securityDeposit,
          deliveryFee: body.deliveryFee || 150,
        },
        securityDeposit: body.securityDeposit,
        location: {
          type: 'Point' as const,
          coordinates: [80.9462, 26.8467] as [number, number],
          address: `${body.area}, ${body.city}`,
          area: body.area,
          city: body.city,
          state: 'Uttar Pradesh',
        },
        images: body.images,
        features: body.features || [],
        guidelines: ['Standard vehicle guidelines apply.'],
        availability: {
          isAvailable: true,
        },
        verificationStatus: 'PENDING' as const,
        rating: 5.0,
        totalTrips: 0,
        deliveryAvailable: true,
        instantBooking: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryStore.vehicles.push(vehicle);
    } else {
      vehicle = await VehicleModel.create({
        ownerId: hostId,
        ownerName: req.user?.name || 'Host User',
        ...body,
        verificationStatus: 'PENDING',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Vehicle submitted successfully for admin verification.',
      vehicle,
    });
  } catch (error) {
    next(error);
  }
}

export async function getHostEarnings(req: any, res: Response, next: NextFunction) {
  try {
    const hostId = req.user?.userId || 'user_host_1';

    let earnings: any[] = [];
    if (isUsingMemoryStore()) {
      earnings = memoryStore.earnings.filter((e) => e.hostId === hostId);
    } else {
      earnings = await HostEarningModel.find({ hostId }).populate('bookingId').sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      count: earnings.length,
      earnings,
    });
  } catch (error) {
    next(error);
  }
}
