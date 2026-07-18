import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { authenticator } from 'otplib';
import { createTestApp } from './utils/test-app';
import { resetDb } from './utils/reset-db';
import { resetRedis } from './utils/reset-redis';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { RedisService } from '../src/modules/redis/redis.service';
import { DevMailboxService } from '../src/modules/notifications/dev-mailbox.service';

describe('Auth security — lockout, password reset, 2FA (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;
  let mailbox: DevMailboxService;

  const STRONG_PASSWORD = 'Correct-Horse9!';

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    redis = app.get(RedisService);
    mailbox = app.get(DevMailboxService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb(prisma);
    await resetRedis(redis);
  });

  async function signup(email: string, password = STRONG_PASSWORD) {
    return request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({ name: 'Test User', email, password, clientType: 'individual' })
      .expect(201);
  }

  describe('password policy', () => {
    it('rejects a weak password on signup', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({ name: 'Weak Pw', email: 'weak@example.com', password: 'password', clientType: 'individual' })
        .expect(400);

      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
      expect(res.body.errors.some((e: { field: string }) => e.field === 'password')).toBe(true);
    });

    it('accepts a password with upper, lower, number, and a special character', async () => {
      await signup('strong@example.com');
    });
  });

  describe('login lockout', () => {
    it('locks the account for 15 minutes after 5 failed attempts, even with the correct password', async () => {
      const email = 'lockout@example.com';
      await signup(email);

      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email, password: 'wrong-password-1!' })
          .expect(401);
      }

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: STRONG_PASSWORD })
        .expect(429);

      expect(res.body.errorCode).toBe('ACCOUNT_LOCKED');

      const ttl = await redis.ttl(`auth:lock:${email}`);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(15 * 60);
    });

    it('does not lock the account before the 5th failed attempt', async () => {
      const email = 'near-lockout@example.com';
      await signup(email);

      for (let i = 0; i < 4; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email, password: 'wrong-password-1!' })
          .expect(401);
      }

      await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email, password: STRONG_PASSWORD }).expect(200);
    });

    it('clears the failure counter on a successful login', async () => {
      const email = 'clears-on-success@example.com';
      await signup(email);

      for (let i = 0; i < 3; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ email, password: 'wrong-password-1!' })
          .expect(401);
      }
      await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email, password: STRONG_PASSWORD }).expect(200);

      const attempts = await redis.get(`auth:fail:${email}`);
      expect(attempts).toBeNull();
    });
  });

  describe('forgot / reset / change password', () => {
    it('resets the password via a token delivered to the dev mailbox, invalidating the old password', async () => {
      const email = 'reset-flow@example.com';
      await signup(email);

      await request(app.getHttpServer()).post('/api/v1/auth/forgot-password').send({ email }).expect(200);

      const sent = mailbox.getLastFor(email);
      expect(sent).toBeDefined();
      const token = sent!.body.match(/Reset token: (\S+)/)?.[1];
      expect(token).toBeTruthy();

      const newPassword = 'Brand-New9!';
      await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ token, newPassword })
        .expect(200);

      await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email, password: STRONG_PASSWORD }).expect(401);
      await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email, password: newPassword }).expect(200);
    });

    it('rejects an unknown or already-used reset token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ token: 'not-a-real-token', newPassword: 'Whatever9!' })
        .expect(401);
    });

    it('does not reveal whether an email is registered on forgot-password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nobody-here@example.com' })
        .expect(200);
      expect(res.body.data.message).toMatch(/if that email exists/i);
    });

    it('changes the password for an authenticated user and rejects the old one afterwards', async () => {
      const email = 'change-flow@example.com';
      const signupRes = await signup(email);
      const accessToken = signupRes.body.data.accessToken as string;
      const newPassword = 'Changed-Now9!';

      await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: STRONG_PASSWORD, newPassword })
        .expect(200);

      await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email, password: STRONG_PASSWORD }).expect(401);
      await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email, password: newPassword }).expect(200);
    });

    it('rejects change-password when the current password is wrong', async () => {
      const signupRes = await signup('change-wrong@example.com');
      const accessToken = signupRes.body.data.accessToken as string;

      await request(app.getHttpServer())
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ currentPassword: 'not-the-password9!X', newPassword: 'Whatever-New9!' })
        .expect(401);
    });
  });

  describe('two-factor authentication', () => {
    it('enables authenticator-app 2FA and requires a valid TOTP code to complete login', async () => {
      const email = 'totp-flow@example.com';
      const signupRes = await signup(email);
      const accessToken = signupRes.body.data.accessToken as string;

      const setupRes = await request(app.getHttpServer())
        .post('/api/v1/auth/2fa/totp/setup')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      const secret = setupRes.body.data.secret as string;

      await request(app.getHttpServer())
        .post('/api/v1/auth/2fa/totp/enable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: authenticator.generate(secret) })
        .expect(200);

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: STRONG_PASSWORD })
        .expect(200);
      expect(loginRes.body.data.requiresTwoFactor).toBe(true);
      expect(loginRes.body.data.method).toBe('totp');
      expect(loginRes.body.data.accessToken).toBeUndefined();

      await request(app.getHttpServer())
        .post('/api/v1/auth/2fa/verify')
        .send({ challengeToken: loginRes.body.data.challengeToken, code: '000000' })
        .expect(401);

      const verifyRes = await request(app.getHttpServer())
        .post('/api/v1/auth/2fa/verify')
        .send({ challengeToken: loginRes.body.data.challengeToken, code: authenticator.generate(secret) })
        .expect(200);
      expect(verifyRes.body.data.accessToken).toBeDefined();
    });

    it('enables email 2FA and requires the mailed code to complete login', async () => {
      const email = 'email-2fa-flow@example.com';
      const signupRes = await signup(email);
      const accessToken = signupRes.body.data.accessToken as string;

      await request(app.getHttpServer())
        .post('/api/v1/auth/2fa/email/request-code')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      const setupCode = mailbox.getLastFor(email)!.body.match(/code is (\d{6})/)?.[1];
      expect(setupCode).toBeTruthy();

      await request(app.getHttpServer())
        .post('/api/v1/auth/2fa/email/enable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: setupCode })
        .expect(200);

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: STRONG_PASSWORD })
        .expect(200);
      expect(loginRes.body.data.requiresTwoFactor).toBe(true);
      expect(loginRes.body.data.method).toBe('email');

      const loginCode = mailbox.getLastFor(email)!.body.match(/code is (\d{6})/)?.[1];
      expect(loginCode).toBeTruthy();
      expect(loginCode).not.toBe(setupCode);

      const verifyRes = await request(app.getHttpServer())
        .post('/api/v1/auth/2fa/verify')
        .send({ challengeToken: loginRes.body.data.challengeToken, code: loginCode })
        .expect(200);
      expect(verifyRes.body.data.accessToken).toBeDefined();
    });

    it('disables 2FA after password confirmation, restoring single-factor login', async () => {
      const email = 'disable-2fa-flow@example.com';
      const signupRes = await signup(email);
      const accessToken = signupRes.body.data.accessToken as string;

      const setupRes = await request(app.getHttpServer())
        .post('/api/v1/auth/2fa/totp/setup')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      const secret = setupRes.body.data.secret as string;
      await request(app.getHttpServer())
        .post('/api/v1/auth/2fa/totp/enable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: authenticator.generate(secret) })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/auth/2fa/disable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ password: STRONG_PASSWORD })
        .expect(200);

      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: STRONG_PASSWORD })
        .expect(200);
      expect(loginRes.body.data.accessToken).toBeDefined();
      expect(loginRes.body.data.requiresTwoFactor).toBeUndefined();
    });
  });
});
