import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { IdempotencyKey } from '../../common/decorators/idempotency-key.decorator';
import { Roles } from '../rbac/roles.decorator';
import { CursorPaginationDto } from '../../common/dto/pagination.dto';
import { ok, paginatedFrom } from '../../common/dto/service-result';

@ApiTags('invoices')
@ApiBearerAuth('bearer')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Roles('staff', 'admin')
  @Post()
  async create(@Body() dto: CreateInvoiceDto, @CurrentUser() staff: AuthUser) {
    const result = await this.invoicesService.create(dto, staff.userId);
    return ok(result, 'Invoice created successfully');
  }

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query() query: CursorPaginationDto) {
    const page = await this.invoicesService.list(user, query);
    return paginatedFrom(page, query.limit, 'Invoices retrieved successfully');
  }

  @Get(':id')
  async getById(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const result = await this.invoicesService.getById(id, user);
    return ok(result, 'Invoice retrieved successfully');
  }

  @Post(':id/pay')
  async payWithProcessor(@Param('id') id: string, @CurrentUser() user: AuthUser, @IdempotencyKey() idempotencyKey: string) {
    const result = await this.invoicesService.payWithProcessor(id, user, idempotencyKey);
    return ok(result, 'Payment initiated successfully');
  }

  @Post(':id/pay-with-wallet')
  async payWithWallet(@Param('id') id: string, @CurrentUser() user: AuthUser, @IdempotencyKey() idempotencyKey: string) {
    const result = await this.invoicesService.payWithWallet(id, user, idempotencyKey);
    return ok(result, 'Invoice paid from wallet successfully');
  }
}
