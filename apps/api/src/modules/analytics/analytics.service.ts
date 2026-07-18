import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyOverview(user: AuthUser) {
    const organizationId = user.organizationId ?? '__none__';

    const [projectsByPhase, wallet, invoicesByStatus, outstandingAgg, ticketsByStatus] = await Promise.all([
      this.prisma.project.groupBy({
        by: ['phase'],
        where: { organizationId, deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.wallet.findUnique({ where: { userId: user.userId } }),
      this.prisma.invoice.groupBy({
        by: ['invoiceStatus'],
        where: { organizationId, deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.invoice.aggregate({
        where: { organizationId, deletedAt: null, invoiceStatus: { notIn: ['paid', 'cancelled'] } },
        _sum: { totalMinor: true },
      }),
      this.prisma.supportTicket.groupBy({
        by: ['ticketStatus'],
        where: { raisedBy: user.userId, deletedAt: null },
        _count: { _all: true },
      }),
    ]);

    return {
      projects: {
        total: projectsByPhase.reduce((sum, p) => sum + p._count._all, 0),
        byPhase: Object.fromEntries(projectsByPhase.map((p) => [p.phase, p._count._all])),
      },
      wallet: wallet ? { balanceMinor: wallet.balanceMinor, currency: wallet.currency } : null,
      invoices: {
        total: invoicesByStatus.reduce((sum, i) => sum + i._count._all, 0),
        byStatus: Object.fromEntries(invoicesByStatus.map((i) => [i.invoiceStatus, i._count._all])),
        totalOutstandingMinor: outstandingAgg._sum.totalMinor ?? 0n,
      },
      supportTickets: {
        total: ticketsByStatus.reduce((sum, t) => sum + t._count._all, 0),
        byStatus: Object.fromEntries(ticketsByStatus.map((t) => [t.ticketStatus, t._count._all])),
      },
    };
  }
}
