import { Request, Response, NextFunction } from 'express';
import { isUsingMemoryStore } from '../config/db';
import { memoryStore } from '../config/store';
import BookingModel from '../models/Booking';
import VehicleModel from '../models/Vehicle';
import HostEarningModel from '../models/HostEarning';
import { calculateBookingPrice } from '../services/pricingEngine';
import { isVehicleAvailableForDates } from '../services/availabilityService';
import { generateBookingId } from '@myride/utils';
import { BookingCreateSchema } from '@myride/validation';
import { VehicleType, IHostEarning } from '@myride/types';

export async function createBooking(req: any, res: Response, next: NextFunction) {
  try {
    const customerId = req.user?.userId || 'user_cust_1';
    const body = BookingCreateSchema.parse(req.body);

    const start = new Date(body.startDateTime);
    const end = new Date(body.endDateTime);

    if (end <= start) {
      res.status(400).json({ success: false, message: 'End date time must be after start date time' });
      return;
    }

    // Double-booking check
    const isAvailable = await isVehicleAvailableForDates(body.vehicleId, start, end);
    if (!isAvailable) {
      res.status(409).json({
        success: false,
        message: 'This vehicle is already reserved for the selected dates. Please pick another slot or vehicle.',
      });
      return;
    }

    // Fetch vehicle
    let vehicle: any = null;
    if (isUsingMemoryStore()) {
      vehicle = memoryStore.vehicles.find((v) => v._id === body.vehicleId);
    } else {
      vehicle = await VehicleModel.findById(body.vehicleId);
    }

    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
      return;
    }

    const durationDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const vType = (vehicle.type || 'CAR').toUpperCase() as VehicleType;

    // Server-side calculation using dynamic PlatformSettings commission
    const pricingBreakdown = await calculateBookingPrice({
      dailyRate: vehicle.pricing.dailyRate,
      durationDays,
      vehicleType: vType,
      pickupType: body.pickupType,
      discountAmount: 0,
      securityDeposit: vehicle.pricing.securityDeposit || 2000,
    });

    const bookingId = generateBookingId();
    const hostIdStr = typeof vehicle.ownerId === 'object' ? vehicle.ownerId._id : vehicle.ownerId;

    let booking: any = null;
    if (isUsingMemoryStore()) {
      booking = {
        _id: `book_${Date.now()}`,
        id: `book_${Date.now()}`,
        bookingId,
        customerId,
        customerName: req.user?.name || 'Customer User',
        customerPhone: req.user?.phone || '9876543210',
        hostId: hostIdStr,
        hostName: vehicle.ownerName || 'Amitabh Verma',
        hostPhone: vehicle.ownerPhone || '9876500001',
        vehicleId: vehicle._id,
        vehicle,
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
        durationDays,
        pickupType: body.pickupType,
        pickupLocation: body.pickupLocation || vehicle.location?.address || 'Hazratganj Hub',
        dropoffLocation: body.dropoffLocation || vehicle.location?.address || 'Hazratganj Hub',
        pricing: pricingBreakdown,
        bookingStatus: 'PAYMENT_PENDING',
        paymentStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryStore.bookings.push(booking);
    } else {
      booking = await BookingModel.create({
        bookingId,
        customerId,
        hostId: hostIdStr,
        vehicleId: vehicle._id,
        startDateTime: start,
        endDateTime: end,
        pickupType: body.pickupType,
        pickupLocation: body.pickupLocation,
        dropoffLocation: body.dropoffLocation,
        pricing: pricingBreakdown,
        bookingStatus: 'PAYMENT_PENDING',
        paymentStatus: 'pending',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Booking reserved successfully. Please proceed to payment.',
      booking,
    });
  } catch (error) {
    next(error);
  }
}

export async function getBookings(req: any, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.userId || 'user_cust_1';
    const role = req.user?.role || 'CUSTOMER';

    let bookings: any[] = [];
    if (isUsingMemoryStore()) {
      bookings = memoryStore.bookings.filter((b) => {
        if (role === 'HOST') return b.hostId === userId;
        if (role === 'ADMIN') return true;
        return b.customerId === userId;
      });

      bookings = bookings.map((b) => {
        const veh = memoryStore.vehicles.find((v) => v._id === b.vehicleId);
        return { ...b, vehicle: veh };
      });
    } else {
      const filter: any = {};
      if (role === 'HOST') filter.hostId = userId;
      else if (role !== 'ADMIN') filter.customerId = userId;

      bookings = await BookingModel.find(filter)
        .populate('vehicleId')
        .populate('customerId', 'name phone')
        .populate('hostId', 'name phone')
        .sort({ createdAt: -1 });
    }

    res.json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
}

export async function getBookingById(req: any, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    let booking: any = null;

    if (isUsingMemoryStore()) {
      booking = memoryStore.bookings.find((b) => b._id === id || b.bookingId === id);
      if (booking) {
        const veh = memoryStore.vehicles.find((v) => v._id === booking.vehicleId);
        const cust = memoryStore.users.find((u) => u._id === booking.customerId);
        const host = memoryStore.users.find((u) => u._id === booking.hostId);
        booking = { ...booking, vehicle: veh, customer: cust, host };
      }
    } else {
      booking = await BookingModel.findOne({
        $or: [{ _id: id }, { bookingId: id }],
      })
        .populate('vehicleId')
        .populate('customerId', 'name phone')
        .populate('hostId', 'name phone');
    }

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    res.json({ success: true, booking });
  } catch (error) {
    next(error);
  }
}

export async function startHandover(req: any, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { odometerReading, fuelPercent, checklist, photos } = req.body;

    let booking: any = null;
    if (isUsingMemoryStore()) {
      booking = memoryStore.bookings.find((b) => b._id === id || b.bookingId === id);
      if (booking) {
        booking.bookingStatus = 'ACTIVE';
        booking.startInspection = {
          odometerReading: odometerReading || 12000,
          fuelLevelPercentage: fuelPercent || 90,
          photos: photos || [],
          checklist: {
            lightsWorking: true,
            tyresInspected: true,
            acHeaterWorking: true,
            accessoriesPresent: true,
            documentsPresent: true,
            ...(checklist || {}),
          },
          timestamp: new Date().toISOString(),
        };
      }
    } else {
      booking = await BookingModel.findByIdAndUpdate(
        id,
        {
          bookingStatus: 'ACTIVE',
          'startInspection.odometerReading': odometerReading,
          'startInspection.fuelLevelPercentage': fuelPercent,
          'startInspection.photos': photos || [],
          'startInspection.timestamp': new Date().toISOString(),
        },
        { new: true }
      );
    }

    res.json({
      success: true,
      message: 'Trip started successfully! Digital handover inspection recorded.',
      booking,
    });
  } catch (error) {
    next(error);
  }
}

export async function completeHandover(req: any, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { odometerReading, fuelPercent, checklist, photos } = req.body;

    let booking: any = null;
    if (isUsingMemoryStore()) {
      booking = memoryStore.bookings.find((b) => b._id === id || b.bookingId === id);
      if (booking) {
        booking.bookingStatus = 'COMPLETED';
        booking.endInspection = {
          odometerReading: odometerReading || 12250,
          fuelLevelPercentage: fuelPercent || 88,
          photos: photos || [],
          checklist: {
            lightsWorking: true,
            tyresInspected: true,
            acHeaterWorking: true,
            accessoriesPresent: true,
            documentsPresent: true,
            ...(checklist || {}),
          },
          timestamp: new Date().toISOString(),
        };

        const veh = memoryStore.vehicles.find((v) => v._id === booking.vehicleId);
        const gross = booking.pricing.baseAmount;
        const commissionAmount = booking.pricing.commissionAmount;
        const netAmount = booking.pricing.hostEarnings;

        const earningRecord: IHostEarning = {
          _id: `earn_${Date.now()}`,
          id: `earn_${Date.now()}`,
          hostId: booking.hostId,
          bookingId: booking._id,
          vehicleId: booking.vehicleId,
          vehicleName: veh ? `${veh.brand} ${veh.model}` : 'Vehicle',
          grossAmount: gross,
          commissionPercentage: booking.pricing.commissionRate || 15,
          commissionAmount,
          netAmount,
          status: 'AVAILABLE',
          tripDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        memoryStore.earnings.push(earningRecord);
      }
    } else {
      booking = await BookingModel.findByIdAndUpdate(
        id,
        {
          bookingStatus: 'COMPLETED',
          'endInspection.odometerReading': odometerReading,
          'endInspection.fuelLevelPercentage': fuelPercent,
          'endInspection.photos': photos || [],
          'endInspection.timestamp': new Date().toISOString(),
        },
        { new: true }
      );
    }

    res.json({
      success: true,
      message: 'Trip completed! Handover check finished and host earnings credited after 15% platform commission.',
      booking,
    });
  } catch (error) {
    next(error);
  }
}
