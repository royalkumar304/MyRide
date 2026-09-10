import mongoose, { Schema, Document } from 'mongoose';
import { DEFAULT_PLATFORM_SETTINGS } from '@myride/constants';

export interface IPlatformSettingsDoc extends Document {
  commission: {
    defaultPercentage: number;
    bikePercentage: number;
    scooterPercentage: number;
    carPercentage: number;
    suvPercentage: number;
    evPercentage: number;
  };
  referral: {
    referrerReward: number;
    referredDiscount: number;
  };
  taxes: {
    gstPercentage: number;
  };
  delivery: {
    baseDeliveryFee: number;
    perKmFee: number;
  };
  support: {
    phone: string;
    email: string;
    emergencyPhone: string;
    roadsidePhone: string;
  };
  supportedCities: string[];
  updatedByAdminId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformSettingsSchema = new Schema<IPlatformSettingsDoc>(
  {
    commission: {
      defaultPercentage: { type: Number, default: 15 },
      bikePercentage: { type: Number, default: 12 },
      scooterPercentage: { type: Number, default: 12 },
      carPercentage: { type: Number, default: 15 },
      suvPercentage: { type: Number, default: 15 },
      evPercentage: { type: Number, default: 10 },
    },
    referral: {
      referrerReward: { type: Number, default: 200 },
      referredDiscount: { type: Number, default: 150 },
    },
    taxes: {
      gstPercentage: { type: Number, default: 18 },
    },
    delivery: {
      baseDeliveryFee: { type: Number, default: 150 },
      perKmFee: { type: Number, default: 15 },
    },
    support: {
      phone: { type: String, default: '+91 8000 123 456' },
      email: { type: String, default: 'support@myride.in' },
      emergencyPhone: { type: String, default: '112' },
      roadsidePhone: { type: String, default: '+91 1800 555 789' },
    },
    supportedCities: [{ type: String }],
    updatedByAdminId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const PlatformSettingsModel =
  mongoose.models.PlatformSettings ||
  mongoose.model<IPlatformSettingsDoc>('PlatformSettings', PlatformSettingsSchema);

import { isUsingMemoryStore } from '../config/db';
import { memoryStore } from '../config/store';

export async function getActivePlatformSettings(): Promise<any> {
  if (isUsingMemoryStore()) {
    return memoryStore.settings;
  }
  try {
    let settings = await PlatformSettingsModel.findOne();
    if (!settings) {
      settings = await PlatformSettingsModel.create(DEFAULT_PLATFORM_SETTINGS);
    }
    return settings;
  } catch (err) {
    return memoryStore.settings;
  }
}

export default PlatformSettingsModel;
