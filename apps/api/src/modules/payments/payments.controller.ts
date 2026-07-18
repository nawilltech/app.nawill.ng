import { Controller, Get, Headers, Param, Post, RawBodyRequest, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { ok } from '../../common/dto/service-result';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../rbac/roles.decorator';

@ApiTags('payments')
@ApiBearerAuth('bearer')
@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('payments/:id')
  async getById(@Param('id') id: string) {
    const result = await this.paymentsService.getById(id);
    return ok(result, 'Payment retrieved successfully');
  }

  @Roles('staff', 'admin')
  @Post('payments/:id/requery')
  async requery(@Param('id') id: string) {
    const result = await this.paymentsService.requery(id);
    return ok(result, 'Payment requeried successfully');
  }

  @Public()
  @Post('webhooks/payments/:processor')
  async webhook(
    @Param('processor') processor: string,
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-mock-signature') signature?: string,
  ) {
    const rawBody = req.rawBody?.toString('utf8') ?? '';
    const result = await this.paymentsService.handleWebhook(processor, rawBody, signature);
    return ok(result, 'Webhook received');
  }
}
