import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const MARKER_PATH = join(__dirname, '.test-db-url');

if (existsSync(MARKER_PATH)) {
  process.env.DATABASE_URL = readFileSync(MARKER_PATH, 'utf-8').trim();
}

process.env.NODE_ENV = 'test';
// Isolated Redis logical DB (index 1) so e2e runs never touch dev data (index 0) —
// flushed by test/setup/global-{setup,teardown}.ts alongside the Postgres reset.
process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379/1';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret';
process.env.JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
process.env.MOCK_PROCESSOR_WEBHOOK_SECRET =
  process.env.MOCK_PROCESSOR_WEBHOOK_SECRET || 'test-mock-processor-secret';

// Force-disabled, not defaulted — dotenv never overrides a var already present in
// process.env, so without this a developer's real Gmail credentials in .env would
// leak into e2e runs and every signup()-based test would attempt a real SMTP send.
// MailService.send() falls back to DevMailboxService-only whenever these are unset.
process.env.GMAIL_USER = '';
process.env.GMAIL_APP_PASSWORD = '';
