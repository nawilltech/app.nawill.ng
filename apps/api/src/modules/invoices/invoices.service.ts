import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { WalletsService } from '../wallets/wallets.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { assertOrgAccess, isStaffOrAdmin } from '../../common/auth/access.util';
import { CursorPaginationDto, cursorArgs, sliceCursorPage } from '../../common/dto/pagination.dto';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    private readonly walletsService: WalletsService,
  ) {}

  async create(dto: CreateInvoiceDto, issuedBy: string) {
    const items = dto.items.map((item) => ({
      ...item,
      actualAmountMinor: BigInt(item.quantity) * BigInt(item.unitAmountMinor),
    }));
    const subtotalMinor = items.reduce((sum, item) => sum + item.actualAmountMinor, 0n);
    const taxMinor = 0n;
    const totalMinor = subtotalMinor + taxMinor;
    const invoiceNo = await this.generateInvoiceNo();

    return this.prisma.invoice.create({
      data: {
        invoiceNo,
        organizationId: dto.organizationId,
        projectId: dto.projectId,
        issuedBy,
        currency: dto.currency,
        subtotalMinor,
        taxMinor,
        totalMinor,
        dueDate: new Date(dto.dueDate),
        items: {
          create: items.map((item) => ({
            itemName: item.itemName,
            serviceId: item.serviceId,
            quantity: item.quantity,
            unitAmountMinor: BigInt(item.unitAmountMinor),
            actualAmountMinor: item.actualAmountMinor,
          })),
        },
      },
      include: { items: true },
    });
  }

  async list(requester: AuthUser, query: CursorPaginationDto) {
    const rows = await this.prisma.invoice.findMany({
      where: {
        deletedAt: null,
        ...(isStaffOrAdmin(requester) ? {} : { organizationId: requester.organizationId ?? '__none__' }),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: { items: true },
      ...cursorArgs(query),
    });
    return sliceCursorPage(rows, query.limit);
  }

  async getById(id: string, requester: AuthUser) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, deletedAt: null },
      include: { items: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    assertOrgAccess(requester, invoice.organizationId, 'You do not have access to this invoice');
    return invoice;
  }

  async payWithProcessor(id: string, requester: AuthUser, idempotencyKey: string) {
    const invoice = await this.getById(id, requester);
    if (invoice.invoiceStatus === 'paid') {
      throw new ConflictException('Invoice is already paid');
    }
    return this.paymentsService.initiate({
      purpose: 'invoice_payment',
      invoiceId: invoice.id,
      amountMinor: invoice.totalMinor,
      currency: invoice.currency,
      initiatedBy: requester.userId,
      idempotencyKey,
    });
  }

  async payWithWallet(id: string, requester: AuthUser, idempotencyKey: string) {
    await this.getById(id, requester); // enforces existence + org access before touching money
    return this.walletsService.payInvoiceWithWallet(requester.userId, id, idempotencyKey);
  }

  private async generateInvoiceNo(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count();
    return `NAW-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
