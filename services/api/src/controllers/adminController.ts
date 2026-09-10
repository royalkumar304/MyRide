import { Request, Response, NextFunction } from 'express';
import { isUsingMemoryStore } from '../config/db';
import { memoryStore } from '../config/store';
import PlatformSettingsModel, { getActivePlatformSettings } from '../models/PlatformSettings';
import VehicleModel from '../models/Vehicle';
import BookingModel from '../models/Booking';
import { AuditLogModel } from '../models/ReviewAndMeta';
import { PlatformSettingsUpdateSchema } from '@myride/validation';

export async function getAdminStats(req: any, res: Response, next: NextFunction) {
  try {
    let vehicles: any[] = [];
    let bookings: any[] = [];
    let earnings: any[] = [];

    if (isUsingMemoryStore()) {
      vehicles = memoryStore.vehicles;
      bookings = memoryStore.bookings;
      earnings = memoryStore.earnings;
    } else {
      vehicles = await VehicleModel.find();
      bookings = await BookingModel.find();
    }

    const totalGMV = bookings.reduce((sum, b) => sum + (b.pricingBreakdown?.totalPayable || 0), 0);
    const totalCommissionEarned = bookings.reduce(
      (sum, b) => sum + (b.pricingBreakdown?.platformCommissionAmount || 0),
      0
    );

    const pendingVehicles = vehicles.filter((v) => v.verificationStatus === 'PENDING').length;
    const approvedVehicles = vehicles.filter((v) => v.verificationStatus === 'APPROVED').length;
    const activeBookings = bookings.filter((b) => b.bookingStatus === 'ACTIVE').length;
    const completedBookings = bookings.filter((b) => b.bookingStatus === 'COMPLETED').length;

    const currentSettings = await getActivePlatformSettings();
    const defaultCommission =
      currentSettings.commission?.defaultPercentage || currentSettings.platformCommissionPercent || 15;

    res.json({
      success: true,
      stats: {
        totalGrossVolume: Math.round(totalGMV),
        totalPlatformCommissionEarned: Math.round(totalCommissionEarned),
        currentCommissionPercentage: defaultCommission,
        activeBookings,
        completedBookings,
        approvedVehicles,
        pendingVehicles,
        totalHosts: 48,
        totalCustomers: 340,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getPendingVehicles(req: any, res: Response, next: NextFunction) {
  try {
    let vehicles: any[] = [];
    if (isUsingMemoryStore()) {
      vehicles = memoryStore.vehicles.filter((v) => v.verificationStatus === 'PENDING');
    } else {
      vehicles = await VehicleModel.find({ verificationStatus: 'PENDING' }).populate('hostId', 'name phone');
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

export async function approveVehicle(req: any, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    let vehicle: any = null;

    if (isUsingMemoryStore()) {
      vehicle = memoryStore.vehicles.find((v) => v._id === id);
      if (vehicle) {
        vehicle.verificationStatus = 'APPROVED';
        memoryStore.auditLogs.push({
          action: 'VEHICLE_APPROVED',
          details: `Vehicle ${vehicle.title} (${vehicle.registrationNumber}) approved by Admin`,
          timestamp: new Date(),
        });
      }
    } else {
      vehicle = await VehicleModel.findByIdAndUpdate(
        id,
        { verificationStatus: 'APPROVED' },
        { new: true }
      );
      if (vehicle) {
        await AuditLogModel.create({
          adminId: req.user?.userId,
          action: 'VEHICLE_APPROVED',
          entityType: 'Vehicle',
          entityId: vehicle._id,
          details: { registrationNumber: vehicle.registrationNumber },
        });
      }
    }

    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Vehicle approved successfully and is now active on MyRide!',
      vehicle,
    });
  } catch (error) {
    next(error);
  }
}

export async function rejectVehicle(req: any, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    let vehicle: any = null;
    if (isUsingMemoryStore()) {
      vehicle = memoryStore.vehicles.find((v) => v._id === id);
      if (vehicle) {
        vehicle.verificationStatus = 'REJECTED';
        memoryStore.auditLogs.push({
          action: 'VEHICLE_REJECTED',
          details: `Vehicle ${vehicle.title} rejected: ${reason || 'Documents unclear'}`,
          timestamp: new Date(),
        });
      }
    } else {
      vehicle = await VehicleModel.findByIdAndUpdate(
        id,
        { verificationStatus: 'REJECTED' },
        { new: true }
      );
    }

    if (!vehicle) {
      res.status(404).json({ success: false, message: 'Vehicle not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Vehicle listing rejected.',
      vehicle,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPlatformSettings(req: any, res: Response, next: NextFunction) {
  try {
    const settings = await getActivePlatformSettings();
    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePlatformSettings(req: any, res: Response, next: NextFunction) {
  try {
    const body = PlatformSettingsUpdateSchema.parse(req.body);

    if (isUsingMemoryStore()) {
      memoryStore.settings = {
        ...memoryStore.settings,
        commission: {
          ...memoryStore.settings.commission,
          ...(body.commission || {}),
        },
        referral: {
          ...memoryStore.settings.referral,
          ...(body.referral || {}),
        },
        taxes: {
          ...memoryStore.settings.taxes,
          ...(body.taxes || {}),
        },
        delivery: {
          ...memoryStore.settings.delivery,
          ...(body.delivery || {}),
        },
        updatedAt: new Date().toISOString(),
      } as any;

      memoryStore.auditLogs.push({
        action: 'SETTINGS_COMMISSION_UPDATED',
        details: `Platform commission updated to: ${JSON.stringify(body.commission || body)}`,
        timestamp: new Date().toISOString(),
      });

      res.json({
        success: true,
        message: 'Platform settings and commission rates updated successfully!',
        settings: memoryStore.settings,
      });
      return;
    }

    let settings = await PlatformSettingsModel.findOne();
    if (!settings) {
      settings = await PlatformSettingsModel.create(body);
    } else {
      if (body.commission) {
        settings.commission = { ...settings.commission, ...body.commission };
      }
      if (body.referral) {
        settings.referral = { ...settings.referral, ...body.referral };
      }
      if (body.taxes) {
        settings.taxes = { ...settings.taxes, ...body.taxes };
      }
      if (body.delivery) {
        settings.delivery = { ...settings.delivery, ...body.delivery };
      }
      settings.updatedByAdminId = req.user?.userId;
      await settings.save();
    }

    await AuditLogModel.create({
      adminId: req.user?.userId,
      action: 'PLATFORM_SETTINGS_UPDATED',
      entityType: 'PlatformSettings',
      entityId: settings._id,
      details: body,
    });

    res.json({
      success: true,
      message: 'Platform settings and commission rates updated successfully!',
      settings,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAuditLogs(req: any, res: Response, next: NextFunction) {
  try {
    if (isUsingMemoryStore()) {
      res.json({
        success: true,
        auditLogs: memoryStore.auditLogs,
      });
      return;
    }

    const logs = await AuditLogModel.find().sort({ createdAt: -1 }).limit(50);
    res.json({
      success: true,
      auditLogs: logs,
    });
  } catch (error) {
    next(error);
  }
}
