import { execSync } from 'child_process';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import Redis from 'ioredis';

const TEST_DB_NAME = 'nawill_test';
const TEST_REDIS_URL = 'redis://localhost:6379/1';
const MARKER_PATH = join(__dirname, '.test-db-url');

module.exports = async function globalTeardown(): Promise<void> {
  execSync(`dropdb -h localhost --if-exists ${TEST_DB_NAME}`, { stdio: 'inherit' });
  if (existsSync(MARKER_PATH)) {
    unlinkSync(MARKER_PATH);
  }

  const redis = new Redis(TEST_REDIS_URL);
  await redis.flushdb();
  await redis.quit();
};
