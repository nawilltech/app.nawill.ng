import { ConflictException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ClientType, User } from '@prisma/client';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MailService } from '../notifications/mail.service';
import { renderEmailTemplate } from '../notifications/email-template';
import { SAFE_USER_SELECT } from '../users/user.select';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyTwoFactorDto } from './dto/two-factor.dto';
import { JwtPayload } from './jwt-payload.interface';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}


const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCKOUT_SECONDS = 15 * 60;
const RESET_TOKEN_TTL_SECONDS = 30 * 60;
const VERIFY_EMAIL_TTL_SECONDS = 24 * 60 * 60;
const TOTP_SETUP_TTL_SECONDS = 10 * 60;
const EMAIL_OTP_TTL_SECONDS = 5 * 60;
const TWO_FA_CHALLENGE_TTL_SECONDS = 5 * 60;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly mail: MailService,
  ) {}

  async signup(dto: SignupDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: dto.clientType === ClientType.corporate ? (dto.organizationName as string) : dto.name,
          sector: dto.clientType === ClientType.corporate ? 'unspecified' : 'individual',
          headOffice: '',
          sizeRange: 's1_10',
        },
      });

      const created = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash,
          userType: 'client',
          clientType: dto.clientType,
          organizationId: organization.id,
          phoneNo: dto.phoneNo,
        },
        select: SAFE_USER_SELECT,
      });

      await tx.wallet.create({ data: { userId: created.id } });

      return created;
    });

    await this.sendVerificationEmail(user.id, user.email, user.name);

    const tokens = this.issueTokens(user as Pick<User, 'id' | 'email' | 'userType' | 'organizationId'>);
    return { user, ...tokens };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    const userId = await this.redis.get(this.verifyEmailKey(dto.token));
    if (!userId) throw new UnauthorizedException('Invalid or expired verification link');

    await this.prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
    await this.redis.del(this.verifyEmailKey(dto.token));
    return { message: 'Email verified successfully' };
  }

  async resendVerification(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.emailVerifiedAt) {
      return { message: 'Email is already verified' };
    }

    await this.sendVerificationEmail(user.id, user.email, user.name);
    return { message: 'Verification email sent' };
  }

  private async sendVerificationEmail(userId: string, email: string, name: string): Promise<void> {
    const token = randomUUID();
    await this.redis.set(this.verifyEmailKey(token), userId, 'EX', VERIFY_EMAIL_TTL_SECONDS);
    const link = `${this.webAppUrl()}/verify-email?token=${token}`;
    await this.mail.send(
      email,
      'Verify your Nawill email',
      renderEmailTemplate({
        heading: `Welcome, ${name}!`,
        bodyLines: ['Please verify your email address to finish setting up your Nawill account.'],
        cta: { label: 'Verify email', url: link },
        footerNote: "This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.",
      }),
    );
  }

  private webAppUrl(): string {
    return this.config.get<string>('WEB_APP_URL', 'http://localhost:3000');
  }

  /** Returns tokens directly, or `{ requiresTwoFactor: true, method, challengeToken }` if 2FA is enabled. */
  async login(dto: LoginDto) {
    const lockKey = this.lockKey(dto.email);
    const locked = await this.redis.get(lockKey);
    if (locked) {
      const ttl = await this.redis.ttl(lockKey);
      throw new HttpException(
        { message: `Too many failed login attempts. Try again in ${Math.max(1, Math.ceil(ttl / 60))} minute(s).`, errorCode: 'ACCOUNT_LOCKED' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.prisma.user.findFirst({ where: { email: dto.email, deletedAt: null } });
    const passwordValid = user ? await argon2.verify(user.passwordHash, dto.password) : false;

    if (!user || !passwordValid) {
      await this.registerFailedAttempt(dto.email);
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.clearFailedAttempts(dto.email);
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    if (user.twoFactorMethod !== 'none') {
      return this.beginTwoFactorChallenge(user);
    }

    const { passwordHash: _passwordHash, twoFactorSecret: _twoFactorSecret, ...safeUser } = user;
    const tokens = this.issueTokens(user);
    return { user: safeUser, ...tokens };
  }

  async verifyTwoFactor(dto: VerifyTwoFactorDto) {
    const raw = await this.redis.get(this.challengeKey(dto.challengeToken));
    if (!raw) throw new UnauthorizedException('Invalid or expired two-factor challenge');

    const challenge = JSON.parse(raw) as { userId: string; method: 'email' | 'totp'; otpHash?: string };
    const user = await this.prisma.user.findFirst({ where: { id: challenge.userId, deletedAt: null } });
    if (!user) throw new UnauthorizedException('Invalid or expired two-factor challenge');

    const valid =
      challenge.method === 'totp'
        ? authenticator.verify({ token: dto.code, secret: user.twoFactorSecret as string })
        : challenge.otpHash === this.hashCode(dto.code);

    if (!valid) throw new UnauthorizedException('Invalid two-factor code');

    await this.redis.del(this.challengeKey(dto.challengeToken));
    const { passwordHash: _passwordHash, twoFactorSecret: _twoFactorSecret, ...safeUser } = user;
    const tokens = this.issueTokens(user);
    return { user: safeUser, ...tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findFirst({ where: { id: payload.sub, deletedAt: null } });
    if (!user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return this.issueTokens(user);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const genericResponse = { message: 'If that email exists, a password reset link has been sent' };
    const user = await this.prisma.user.findFirst({ where: { email: dto.email, deletedAt: null } });
    if (!user) return genericResponse; // don't leak which emails are registered

    const token = randomUUID();
    await this.redis.set(this.resetKey(token), user.id, 'EX', RESET_TOKEN_TTL_SECONDS);
    const link = `${this.webAppUrl()}/reset-password?token=${token}`;
    await this.mail.send(
      user.email,
      'Reset your Nawill password',
      renderEmailTemplate({
        heading: 'Reset your password',
        bodyLines: ['We received a request to reset the password on your Nawill account.'],
        cta: { label: 'Reset password', url: link },
        footerNote: "This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.",
      }),
    );
    return genericResponse;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const userId = await this.redis.get(this.resetKey(dto.token));
    if (!userId) throw new UnauthorizedException('Invalid or expired reset token');

    const user = await this.prisma.user.findFirstOrThrow({ where: { id: userId } });
    const passwordHash = await argon2.hash(dto.newPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await this.redis.del(this.resetKey(dto.token));
    await this.clearFailedAttempts(user.email);

    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const valid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await argon2.hash(dto.newPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { message: 'Password changed successfully' };
  }

  async setupTotp(userId: string): Promise<{ secret: string; otpauthUrl: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const secret = authenticator.generateSecret();
    await this.redis.set(this.totpSetupKey(userId), secret, 'EX', TOTP_SETUP_TTL_SECONDS);
    const otpauthUrl = authenticator.keyuri(user.email, 'Nawill App', secret);
    return { secret, otpauthUrl };
  }

  async confirmTotp(userId: string, code: string): Promise<{ message: string }> {
    const secret = await this.redis.get(this.totpSetupKey(userId));
    if (!secret) throw new UnauthorizedException('No pending authenticator setup found, or it has expired — start over');

    const valid = authenticator.verify({ token: code, secret });
    if (!valid) throw new UnauthorizedException('Invalid authenticator code');

    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorMethod: 'totp', twoFactorSecret: secret } });
    await this.redis.del(this.totpSetupKey(userId));
    return { message: 'Authenticator app two-factor authentication enabled' };
  }

  async requestEmailTwoFactorCode(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const code = this.generateOtp();
    await this.redis.set(this.emailSetupOtpKey(userId), this.hashCode(code), 'EX', EMAIL_OTP_TTL_SECONDS);
    await this.mail.send(
      user.email,
      'Confirm email two-factor authentication',
      renderEmailTemplate({
        heading: 'Confirm email two-factor authentication',
        bodyLines: ['Enter this code to turn on email-based two-factor authentication for your Nawill account.'],
        code,
        footerNote: 'This code expires in 5 minutes.',
      }),
    );
    return { message: 'Confirmation code sent to your email' };
  }

  async enableEmailTwoFactor(userId: string, code: string): Promise<{ message: string }> {
    const storedHash = await this.redis.get(this.emailSetupOtpKey(userId));
    if (!storedHash || storedHash !== this.hashCode(code)) {
      throw new UnauthorizedException('Invalid or expired confirmation code');
    }

    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorMethod: 'email', twoFactorSecret: null } });
    await this.redis.del(this.emailSetupOtpKey(userId));
    return { message: 'Email two-factor authentication enabled' };
  }

  async disableTwoFactor(userId: string, password: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) throw new UnauthorizedException('Incorrect password');

    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorMethod: 'none', twoFactorSecret: null } });
    return { message: 'Two-factor authentication disabled' };
  }

  private async beginTwoFactorChallenge(user: User) {
    const challengeToken = randomUUID();
    const payload: { userId: string; method: string; otpHash?: string } = {
      userId: user.id,
      method: user.twoFactorMethod,
    };

    if (user.twoFactorMethod === 'email') {
      const code = this.generateOtp();
      payload.otpHash = this.hashCode(code);
      await this.mail.send(
        user.email,
        'Your Nawill login code',
        renderEmailTemplate({
          heading: 'Your login code',
          bodyLines: ['Enter this code to finish logging in to your Nawill account.'],
          code,
          footerNote: "This code expires in 5 minutes. If you didn't try to log in, you can safely ignore this email.",
        }),
      );
    }

    await this.redis.set(this.challengeKey(challengeToken), JSON.stringify(payload), 'EX', TWO_FA_CHALLENGE_TTL_SECONDS);
    return { requiresTwoFactor: true as const, method: user.twoFactorMethod, challengeToken };
  }

  private async registerFailedAttempt(email: string): Promise<void> {
    const failKey = this.failKey(email);
    const attempts = await this.redis.incr(failKey);
    if (attempts === 1) {
      await this.redis.expire(failKey, LOGIN_LOCKOUT_SECONDS);
    }
    if (attempts >= LOGIN_MAX_ATTEMPTS) {
      await this.redis.set(this.lockKey(email), '1', 'EX', LOGIN_LOCKOUT_SECONDS);
    }
  }

  private async clearFailedAttempts(email: string): Promise<void> {
    await this.redis.del(this.failKey(email), this.lockKey(email));
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  private failKey(email: string) {
    return `auth:fail:${email}`;
  }
  private lockKey(email: string) {
    return `auth:lock:${email}`;
  }
  private resetKey(token: string) {
    return `auth:reset:${token}`;
  }
  private verifyEmailKey(token: string) {
    return `auth:verify-email:${token}`;
  }
  private totpSetupKey(userId: string) {
    return `auth:totp-setup:${userId}`;
  }
  private emailSetupOtpKey(userId: string) {
    return `auth:email-2fa-setup:${userId}`;
  }
  private challengeKey(token: string) {
    return `auth:2fa-challenge:${token}`;
  }

  private issueTokens(user: Pick<User, 'id' | 'email' | 'userType' | 'organizationId'>): AuthTokens {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      userType: user.userType,
      organizationId: user.organizationId,
    };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return { accessToken, refreshToken };
  }
}
