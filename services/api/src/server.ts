import { createApp } from './app';
import { connectDB } from './config/db';
import { ENV } from './config/env';

async function bootstrap() {
  console.log('🚀 Initializing MyRide Central Backend API...');
  await connectDB();

  const app = createApp();
  const PORT = ENV.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`
=====================================================
🚗 MYRIDE - Apni Ride. Apna Choice.
📍 Unified Backend API running on: http://localhost:${PORT}/api/v1
💼 Platform Commission: Configurable in DB (Default: 15%)
🩺 Health Check: http://localhost:${PORT}/api/v1/health
=====================================================
    `);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal error starting MyRide backend:', err);
  process.exit(1);
});
