import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { userInfo } from 'os';
import Redis from 'ioredis';

const TEST_DB_NAME = 'nawill_test';
const TEST_DB_URL = `postgresql://${userInfo().username}@localhost:5432/${TEST_DB_NAME}?schema=public`;
const TEST_REDIS_URL = 'redis://localhost:6379/1';
const MARKER_PATH = join(__dirname, '.test-db-url');

module.exports = async function globalSetup(): Promise<void> {
  execSync(`dropdb --if-exists ${TEST_DB_NAME}`, { stdio: 'inherit' });
  execSync(`createdb ${TEST_DB_NAME}`, { stdio: 'inherit' });

  const apiRoot = join(__dirname, '..', '..');
  const env = { ...process.env, DATABASE_URL: TEST_DB_URL };

  execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: apiRoot, env });
  execSync('npx prisma db seed', { stdio: 'inherit', cwd: apiRoot, env });

  writeFileSync(MARKER_PATH, TEST_DB_URL, 'utf-8');

  // Isolated Redis logical DB (index 1) — flushed here and in global-teardown.ts so
  // lockout counters / reset tokens / 2FA challenges never leak between runs.
  const redis = new Redis(TEST_REDIS_URL);
  await redis.flushdb();
  await redis.quit();
};
