import { connectDB, isUsingMemoryStore } from '../config/db';
import UserModel from '../models/User';
import VehicleModel from '../models/Vehicle';
import PlatformSettingsModel from '../models/PlatformSettings';
import BookingModel from '../models/Booking';
import HostEarningModel from '../models/HostEarning';
import { memoryStore } from '../config/store';
import { DEFAULT_PLATFORM_SETTINGS } from '@myride/constants';

async function seed() {
  console.log('🌱 Starting MyRide Database Seed...');
  await connectDB();

  if (isUsingMemoryStore()) {
    console.log('ℹ️ In-memory database store is active. Pre-populated entities:');
    console.log(`- Users: ${memoryStore.users.length}`);
    console.log(`- Vehicles: ${memoryStore.vehicles.length}`);
    console.log(`- Bookings: ${memoryStore.bookings.length}`);
    console.log(`- Platform Commission: ${memoryStore.settings.commission?.defaultPercentage || 15}%`);
    console.log('✅ In-memory database ready for development!');
    return;
  }

  // Clear existing collections if MongoDB is connected
  try {
    await PlatformSettingsModel.deleteMany({});
    await UserModel.deleteMany({});
    await VehicleModel.deleteMany({});
    await BookingModel.deleteMany({});
    await HostEarningModel.deleteMany({});

    // 1. Seed Platform Settings with 15% commission rule
    const settings = await PlatformSettingsModel.create({
      ...DEFAULT_PLATFORM_SETTINGS,
      commission: {
        defaultPercentage: 15,
        bikePercentage: 12,
        scooterPercentage: 12,
        carPercentage: 15,
        suvPercentage: 15,
        evPercentage: 10,
      },
    });
    console.log('✅ Seeded Platform Settings (15% Configurable Commission)');

    // 2. Seed Users
    const usersToInsert = memoryStore.users.map(({ _id, id, ...rest }) => rest);
    const [customer, host, admin] = await UserModel.create(usersToInsert);
    console.log(`✅ Seeded 3 Users (Customer: ${customer.name}, Host: ${host.name}, Admin: ${admin.name})`);

    // 3. Seed Vehicles
    const vehiclesWithHost = memoryStore.vehicles.map(({ _id, id, ownerId, ...v }) => ({
      ...v,
      ownerId: host._id,
      ownerName: host.name,
      verificationStatus: 'APPROVED',
    }));
    await VehicleModel.create(vehiclesWithHost);
    console.log(`✅ Seeded ${vehiclesWithHost.length} Tier-2/3 City Verified Vehicles`);

    console.log('🎉 MongoDB Seed Completed Successfully!');
  } catch (error) {
    console.error('Seed error:', error);
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed fatal failure:', err);
    process.exit(1);
  });
