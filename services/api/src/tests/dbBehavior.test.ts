import { isProduction, isMemoryStoreAllowed, isUsingMemoryStore, connectDB, disconnectDB, getDatabaseStatus } from '../config/db';
import { ENV } from '../config/env';

async function runDatabaseBehaviorTests() {
  console.log('🧪 Starting Backend Database Behavior & Safety Unit Tests...\n');

  // Test 1: Production safety guarantees
  console.log('Test 1: Verify Production Strict Memory Store Prohibition');
  ENV.NODE_ENV = 'production';
  ENV.USE_MEMORY_STORE = true;
  ENV.MONGODB_URI = 'mongodb://127.0.0.1:27019/unreachable_db';

  if (!isProduction()) {
    throw new Error('FAILED: isProduction() should be true when NODE_ENV=production');
  }
  if (isMemoryStoreAllowed()) {
    throw new Error('FAILED: isMemoryStoreAllowed() MUST be false in production!');
  }
  if (isUsingMemoryStore()) {
    throw new Error('FAILED: isUsingMemoryStore() MUST be false in production!');
  }
  console.log('  ✅ Production environment strictly disallows memory store even if USE_MEMORY_STORE=true');

  // Test 2: Production failure throws error and reports unhealthy
  console.log('\nTest 2: Verify Production Database Connection Failure Throws & Reports Unhealthy');
  let prodErrorCaught = false;
  try {
    await connectDB();
  } catch (err: any) {
    prodErrorCaught = true;
    console.log('  ✅ Production connection failure threw safely:', err.message);
  }

  if (!prodErrorCaught) {
    throw new Error('FAILED: connectDB() MUST throw on failed connection in production!');
  }
  if (isUsingMemoryStore()) {
    throw new Error('FAILED: Production MUST NOT silently fall back to memory store!');
  }

  const prodStatus = getDatabaseStatus();
  if (prodStatus.isHealthy) {
    throw new Error('FAILED: Database status should be unhealthy when connection fails in production!');
  }
  console.log('  ✅ Production status correctly reports unhealthy (healthy =', prodStatus.isHealthy, ', mode =', prodStatus.mode, ')');

  // Test 3: Development mode with explicit USE_MEMORY_STORE=true
  console.log('\nTest 3: Verify Development Mode with Explicit USE_MEMORY_STORE=true');
  ENV.NODE_ENV = 'development';
  ENV.USE_MEMORY_STORE = true;

  if (!isMemoryStoreAllowed()) {
    throw new Error('FAILED: isMemoryStoreAllowed() should be true in development with USE_MEMORY_STORE=true');
  }

  await connectDB();
  if (!isUsingMemoryStore()) {
    throw new Error('FAILED: isUsingMemoryStore() should be true after connectDB() with USE_MEMORY_STORE=true in development');
  }

  const devStatus = getDatabaseStatus();
  if (!devStatus.isHealthy || devStatus.mode !== 'memory') {
    throw new Error('FAILED: getDatabaseStatus() should be healthy with mode=memory in development');
  }
  console.log('  ✅ Development correctly activated in-memory store with explicit USE_MEMORY_STORE=true');

  // Test 4: Development mode without USE_MEMORY_STORE=true and unreachable MongoDB throws (no silent fallback)
  console.log('\nTest 4: Verify Development Mode Without USE_MEMORY_STORE Does Not Silently Fallback');
  await disconnectDB();
  ENV.NODE_ENV = 'development';
  ENV.USE_MEMORY_STORE = false;
  ENV.MONGODB_URI = 'mongodb://127.0.0.1:27019/unreachable_db';

  let devErrorCaught = false;
  try {
    await connectDB();
  } catch (err: any) {
    devErrorCaught = true;
    console.log('  ✅ Development connection failure threw safely without fallback:', err.message);
  }

  if (!devErrorCaught) {
    throw new Error('FAILED: connectDB() MUST throw when MongoDB is unreachable and USE_MEMORY_STORE is not set!');
  }
  console.log('  ✅ Development correctly refuses to silently fallback to in-memory store');

  console.log('\n🎉 ALL DATABASE BEHAVIOR & PRODUCTION SAFETY TESTS PASSED!\n');
}

runDatabaseBehaviorTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
