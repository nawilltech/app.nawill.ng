import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackAccountVerificationProvider } from '../external-services/paystack/paystack-account-verification.provider';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';

const PRISMA_UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

@Injectable()
export class BankAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paystack: PaystackAccountVerificationProvider,
  ) {}

  async listBanks() {
    return this.paystack.listBanks();
  }

  async create(userId: string, dto: CreateBankAccountDto) {
    const resolved = await this.paystack.resolveAccount(dto.accountNumber, dto.bankCode);
    const isFirstAccount = (await this.prisma.bankAccount.count({ where: { userId, deletedAt: null } })) === 0;

    try {
      return await this.prisma.bankAccount.create({
        data: {
          userId,
          bankCode: dto.bankCode,
          bankName: dto.bankName,
          accountNumber: resolved.accountNumber,
          accountName: resolved.accountName,
          currency: dto.currency ?? 'NGN',
          isVerified: true,
          isDefault: isFirstAccount,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === PRISMA_UNIQUE_CONSTRAINT_VIOLATION) {
        throw new ConflictException('This bank account has already been added');
      }
      throw error;
    }
  }

  async listMine(userId: string) {
    return this.prisma.bankAccount.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async setDefault(userId: string, id: string) {
    await this.getOwned(userId, id);
    await this.prisma.$transaction([
      this.prisma.bankAccount.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } }),
      this.prisma.bankAccount.update({ where: { id }, data: { isDefault: true } }),
    ]);
    return this.getOwned(userId, id);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.getOwned(userId, id);
    await this.prisma.bankAccount.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private async getOwned(userId: string, id: string) {
    const account = await this.prisma.bankAccount.findFirst({ where: { id, userId, deletedAt: null } });
    if (!account) throw new NotFoundException('Bank account not found');
    return account;
  }
}
