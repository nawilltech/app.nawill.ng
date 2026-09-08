import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { WalletsService } from '../wallets/wallets.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
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
      // A cancelled line is waived — it contributes nothing to the total — but unitAmountMinor is
      // preserved so the PDF can still show the original amount struck through.
      actualAmountMinor: item.isCancelled ? 0n : BigInt(item.quantity) * BigInt(item.unitAmountMinor),
    }));
    const subtotalMinor = items.reduce((sum, item) => sum + item.actualAmountMinor, 0n);

    const discountMinor = BigInt(dto.discountMinor ?? 0);
    if (discountMinor > subtotalMinor) {
      throw new BadRequestException('discountMinor cannot exceed the items subtotal');
    }
    const taxableMinor = subtotalMinor - discountMinor;

    const vatEnabled = Boolean(dto.vatEnabled);
    const vatRate = vatEnabled ? dto.vatRate! : null;
    // BigInt has no fractional math — Number() is safe here, invoice amounts are nowhere
    // near Number.MAX_SAFE_INTEGER.
    const taxMinor = vatEnabled ? BigInt(Math.round(Number(taxableMinor) * (vatRate! / 100))) : 0n;
    const totalMinor = taxableMinor + taxMinor;

    const invoiceNo = await this.generateInvoiceNo();

    return this.prisma.invoice.create({
      data: {
        invoiceNo,
        organizationId: dto.organizationId,
        projectId: dto.projectId,
        issuedBy,
        currency: dto.currency,
        subtotalMinor,
        discountMinor,
        vatEnabled,
        vatRate,
        taxMinor,
        totalMinor,
        dueDate: new Date(dto.dueDate),
        notes: dto.notes,
        items: {
          create: items.map((item) => ({
            itemName: item.itemName,
            serviceId: item.serviceId,
            period: item.period,
            quantity: item.quantity,
            unitAmountMinor: BigInt(item.unitAmountMinor),
            isCancelled: Boolean(item.isCancelled),
            actualAmountMinor: item.actualAmountMinor,
          })),
        },
      },
      include: { items: true, organization: { select: { name: true, headOffice: true } } },
    });
  }

  async list(requester: AuthUser, query: CursorPaginationDto) {
    const rows = await this.prisma.invoice.findMany({
      where: {
        deletedAt: null,
        ...(isStaffOrAdmin(requester) ? {} : { organizationId: requester.organizationId ?? '__none__' }),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: { items: true, organization: { select: { name: true, headOffice: true } } },
      ...cursorArgs(query),
    });
    return sliceCursorPage(rows, query.limit);
  }

  async getById(id: string, requester: AuthUser) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, deletedAt: null },
      include: { items: true, organization: { select: { name: true, headOffice: true } } },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    assertOrgAccess(requester, invoice.organizationId, 'You do not have access to this invoice');
    return invoice;
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    const invoice = await this.prisma.invoice.findFirst({ where: { id, deletedAt: null } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    return this.prisma.invoice.update({
      where: { id },
      data: {
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        invoiceStatus: dto.invoiceStatus,
        notes: dto.notes,
      },
      include: { items: true, organization: { select: { name: true, headOffice: true } } },
    });
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
