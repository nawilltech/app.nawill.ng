import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { WalletAdjustmentDto } from './dto/wallet-adjustment.dto';
import { CursorPaginationDto, cursorArgs, sliceCursorPage } from '../../common/dto/pagination.dto';

const PRISMA_UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

@Injectable()
export class WalletsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async getOrCreateWallet(userId: string) {
    const existing = await this.prisma.wallet.findUnique({ where: { userId } });
    if (existing) return existing;
    return this.prisma.wallet.create({ data: { userId } });
  }

  async getWalletByUserId(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async listTransactions(userId: string, dto: CursorPaginationDto) {
    const wallet = await this.getWalletByUserId(userId);
    const rows = await this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id, deletedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...cursorArgs(dto),
    });
    return sliceCursorPage(rows, dto.limit);
  }

  async fund(userId: string, dto: FundWalletDto, idempotencyKey: string) {
    const wallet = await this.getOrCreateWallet(userId);
    if (wallet.walletStatus !== 'active') {
      throw new ForbiddenException('Wallet is frozen and cannot be funded');
    }

    return this.paymentsService.initiate({
      purpose: 'wallet_funding',
      walletId: wallet.id,
      amountMinor: BigInt(dto.amountMinor),
      currency: dto.currency ?? wallet.currency,
      initiatedBy: userId,
      idempotencyKey,
    });
  }

  /**
   * Synchronous debit — no processor involved. Locks the wallet row via an atomic
   * conditional UPDATE (balanceMinor >= total) so a wallet that can only cover one
   * of two concurrent pay requests grants exactly one of them, never both and
   * never a negative balance. See docs/TECHNICAL.md §2.4.
   */
  async payInvoiceWithWallet(userId: string, invoiceId: string, idempotencyKey: string) {
    const existing = await this.prisma.walletTransaction.findUnique({ where: { idempotencyKey } });
    if (existing) return existing;

    const wallet = await this.getWalletByUserId(userId);
    if (wallet.walletStatus !== 'active') {
      throw new ForbiddenException('Wallet is frozen and cannot be used for payment');
    }

    const invoice = await this.prisma.invoice.findFirst({ where: { id: invoiceId, deletedAt: null } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.invoiceStatus === 'paid') {
      throw new ConflictException('Invoice is already paid');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const { count } = await tx.wallet.updateMany({
          where: { id: wallet.id, balanceMinor: { gte: invoice.totalMinor } },
          data: { balanceMinor: { decrement: invoice.totalMinor } },
        });

        if (count === 0) {
          throw new UnprocessableEntityException('Insufficient wallet balance');
        }

        const updatedWallet = await tx.wallet.findUniqueOrThrow({ where: { id: wallet.id } });

        const walletTxn = await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            direction: 'debit',
            source: 'invoice_payment',
            amountMinor: invoice.totalMinor,
            balanceAfterMinor: updatedWallet.balanceMinor,
            idempotencyKey,
            referenceInvoiceId: invoice.id,
            description: `Payment for invoice ${invoice.invoiceNo}`,
            initiatedBy: userId,
            txnStatus: 'completed',
          },
        });

        await tx.invoice.updateMany({
          where: { id: invoice.id, invoiceStatus: { not: 'paid' } },
          data: { invoiceStatus: 'paid', paidAt: new Date() },
        });

        await tx.auditLog.create({
          data: {
            domain: 'invoices',
            entityId: invoice.id,
            action: 'pay_with_wallet',
            changedBy: userId,
            after: { invoiceStatus: 'paid', walletTransactionId: walletTxn.id },
          },
        });

        return walletTxn;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === PRISMA_UNIQUE_CONSTRAINT_VIOLATION) {
        const winner = await this.prisma.walletTransaction.findUnique({ where: { idempotencyKey } });
        if (winner) return winner;
      }
      throw error;
    }
  }

  async getWalletForStaff(targetUserId: string) {
    return this.getWalletByUserId(targetUserId);
  }

  async recordAdjustment(targetUserId: string, staffId: string, dto: WalletAdjustmentDto) {
    const wallet = await this.getWalletByUserId(targetUserId);
    const amount = BigInt(dto.amountMinor);

    if (dto.direction === 'debit') {
      return this.prisma.$transaction(async (tx) => {
        const { count } = await tx.wallet.updateMany({
          where: { id: wallet.id, balanceMinor: { gte: amount } },
          data: { balanceMinor: { decrement: amount } },
        });
        if (count === 0) throw new UnprocessableEntityException('Insufficient wallet balance for this adjustment');
        const updated = await tx.wallet.findUniqueOrThrow({ where: { id: wallet.id } });
        return tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            direction: 'debit',
            source: 'adjustment',
            amountMinor: amount,
            balanceAfterMinor: updated.balanceMinor,
            idempotencyKey: `adjustment:${staffId}:${Date.now()}:${Math.random().toString(36).slice(2)}`,
            description: dto.reason,
            initiatedBy: staffId,
            txnStatus: 'completed',
          },
        });
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balanceMinor: { increment: amount } },
      });
      return tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          direction: 'credit',
          source: 'adjustment',
          amountMinor: amount,
          balanceAfterMinor: updated.balanceMinor,
          idempotencyKey: `adjustment:${staffId}:${Date.now()}:${Math.random().toString(36).slice(2)}`,
          description: dto.reason,
          initiatedBy: staffId,
          txnStatus: 'completed',
        },
      });
    });
  }
}
