import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../rbac/roles.decorator';
import { CursorPaginationDto } from '../../common/dto/pagination.dto';
import { ok, paginatedFrom } from '../../common/dto/service-result';

@ApiTags('support')
@ApiBearerAuth('bearer')
@Controller()
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('ticket-types')
  async listTicketTypes() {
    const result = await this.supportService.listTicketTypes();
    return ok(result, 'Ticket types retrieved successfully');
  }

  @Post('support-tickets')
  async create(@Body() dto: CreateTicketDto, @CurrentUser() user: AuthUser) {
    const result = await this.supportService.create(dto, user.userId);
    return ok(result, 'Support ticket created successfully');
  }

  @Get('support-tickets')
  async list(@CurrentUser() user: AuthUser, @Query() query: CursorPaginationDto) {
    const page = await this.supportService.list(user, query);
    return paginatedFrom(page, query.limit, 'Support tickets retrieved successfully');
  }

  @Get('support-tickets/:id')
  async getById(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const result = await this.supportService.getById(id, user);
    return ok(result, 'Support ticket retrieved successfully');
  }

  @Roles('staff', 'admin')
  @Patch('support-tickets/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    const result = await this.supportService.update(id, dto);
    return ok(result, 'Support ticket updated successfully');
  }

  @Post('support-tickets/:id/close')
  @HttpCode(HttpStatus.OK)
  async close(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const result = await this.supportService.close(id, user);
    return ok(result, 'Support ticket closed successfully');
  }

  @Post('support-tickets/:id/messages')
  async addMessage(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: CreateTicketMessageDto) {
    const result = await this.supportService.addMessage(id, user, dto);
    return ok(result, 'Message added successfully');
  }
}
