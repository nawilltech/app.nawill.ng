import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { ok } from '../../common/dto/service-result';

@ApiTags('analytics')
@ApiBearerAuth('bearer')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('me/overview')
  async getMyOverview(@CurrentUser() user: AuthUser) {
    const result = await this.analyticsService.getMyOverview(user);
    return ok(result, 'Analytics overview retrieved successfully');
  }
}
