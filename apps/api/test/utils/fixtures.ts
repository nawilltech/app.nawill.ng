import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserType } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../../src/modules/prisma/prisma.service';

export interface TestUser {
  user: { id: string; email: string; userType: UserType; organizationId: string | null };
  accessToken: string;
}

export async function createUserWithToken(
  app: INestApplication,
  prisma: PrismaService,
  opts: { userType: UserType; email?: string; organizationId?: string | null },
): Promise<TestUser> {
  let organizationId = opts.organizationId;
  if (organizationId === undefined) {
    const org = await prisma.organization.create({
      data: { name: `Test Org ${Math.random().toString(36).slice(2)}`, sector: 'individual', headOffice: '', sizeRange: 's1_10' },
    });
    organizationId = org.id;
  }

  const email = opts.email ?? `${opts.userType}-${Math.random().toString(36).slice(2)}@example.com`;
  const passwordHash = await argon2.hash('password123');

  const user = await prisma.user.create({
    data: {
      name: `Test ${opts.userType}`,
      email,
      passwordHash,
      userType: opts.userType,
      clientType: opts.userType === 'client' ? 'individual' : undefined,
      organizationId,
    },
  });

  if (opts.userType === 'client') {
    await prisma.wallet.create({ data: { userId: user.id } });
  }

  const jwt = app.get(JwtService);
  const config = app.get(ConfigService);
  const payload = { sub: user.id, email: user.email, userType: user.userType, organizationId: user.organizationId };
  const accessToken = jwt.sign(payload, {
    secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    expiresIn: '15m',
  });

  return { user: { id: user.id, email: user.email, userType: user.userType, organizationId: user.organizationId }, accessToken };
}

export async function creditWallet(prisma: PrismaService, userId: string, amountMinor: bigint): Promise<void> {
  const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId } });
  const updated = await prisma.wallet.update({
    where: { id: wallet.id },
    data: { balanceMinor: { increment: amountMinor } },
  });
  await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      direction: 'credit',
      source: 'adjustment',
      amountMinor,
      balanceAfterMinor: updated.balanceMinor,
      idempotencyKey: `test-seed:${wallet.id}:${Date.now()}:${Math.random()}`,
      description: 'Test fixture seed credit',
      initiatedBy: userId,
      txnStatus: 'completed',
    },
  });
}

export async function createInvoice(
  prisma: PrismaService,
  params: { organizationId: string; issuedBy: string; totalMinor: bigint; currency?: string },
): Promise<{ id: string; totalMinor: bigint; invoiceNo: string }> {
  const invoiceNo = `TEST-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNo,
      organizationId: params.organizationId,
      issuedBy: params.issuedBy,
      currency: params.currency ?? 'NGN',
      subtotalMinor: params.totalMinor,
      totalMinor: params.totalMinor,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      items: {
        create: [{ itemName: 'Test service', quantity: 1, unitAmountMinor: params.totalMinor, actualAmountMinor: params.totalMinor }],
      },
    },
  });
  return { id: invoice.id, totalMinor: invoice.totalMinor, invoiceNo: invoice.invoiceNo };
}
