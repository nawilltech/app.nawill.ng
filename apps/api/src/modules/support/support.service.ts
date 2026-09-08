import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { assertSelfOrStaff, isStaffOrAdmin } from '../../common/auth/access.util';
import { CursorPaginationDto, cursorArgs, sliceCursorPage } from '../../common/dto/pagination.dto';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async listTicketTypes() {
    return this.prisma.ticketType.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } });
  }

  /** Ticket creation always carries its opening message — there is no separate "empty ticket" state. */
  async create(dto: CreateTicketDto, raisedBy: string) {
    const ticketNo = `TCK-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.create({
        data: {
          ticketNo,
          ticketTypeId: dto.ticketTypeId,
          raisedBy,
          subject: dto.subject,
          priority: dto.priority ?? 'medium',
        },
      });

      await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: raisedBy,
          body: dto.message,
        },
      });

      return tx.supportTicket.findFirstOrThrow({
        where: { id: ticket.id },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
    });
  }

  async list(requester: AuthUser, query: CursorPaginationDto) {
    const rows = await this.prisma.supportTicket.findMany({
      where: {
        deletedAt: null,
        ...(isStaffOrAdmin(requester) ? {} : { raisedBy: requester.userId }),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...cursorArgs(query),
    });
    return sliceCursorPage(rows, query.limit);
  }

  async getById(id: string, requester: AuthUser) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id, deletedAt: null },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ticket) throw new NotFoundException('Support ticket not found');
    assertSelfOrStaff(requester, ticket.raisedBy, 'You do not have access to this support ticket');
    return ticket;
  }

  async update(id: string, dto: UpdateTicketDto) {
    await this.getTicketOrThrow(id);
    return this.prisma.supportTicket.update({
      where: { id },
      data: {
        assignedTo: dto.assignedTo,
        ticketStatus: dto.ticketStatus,
        priority: dto.priority,
        resolvedAt: dto.ticketStatus === 'resolved' || dto.ticketStatus === 'closed' ? new Date() : undefined,
      },
    });
  }

  /** Self-service: the ticket's own raiser (or staff/admin) can close it directly, without the staff-only PATCH. */
  async close(id: string, requester: AuthUser) {
    const ticket = await this.getTicketOrThrow(id);
    assertSelfOrStaff(requester, ticket.raisedBy, 'You do not have access to this support ticket');

    return this.prisma.supportTicket.update({
      where: { id },
      data: { ticketStatus: 'closed', resolvedAt: new Date() },
    });
  }

  async addMessage(id: string, requester: AuthUser, dto: CreateTicketMessageDto) {
    const ticket = await this.getTicketOrThrow(id);
    assertSelfOrStaff(requester, ticket.raisedBy, 'You do not have access to this support ticket');

    if (dto.isInternalNote && !isStaffOrAdmin(requester)) {
      throw new ForbiddenException('Only staff can post internal notes');
    }

    return this.prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: requester.userId,
        body: dto.body,
        isInternalNote: Boolean(dto.isInternalNote) && isStaffOrAdmin(requester),
      },
    });
  }

  private async getTicketOrThrow(id: string) {
    const ticket = await this.prisma.supportTicket.findFirst({ where: { id, deletedAt: null } });
    if (!ticket) throw new NotFoundException('Support ticket not found');
    return ticket;
  }
}
