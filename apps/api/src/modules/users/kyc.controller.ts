import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { ReviewKycDocumentDto } from './dto/review-kyc-document.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../rbac/roles.decorator';
import { ok } from '../../common/dto/service-result';

@ApiTags('organizations')
@ApiBearerAuth('bearer')
@Roles('staff', 'admin')
@Controller('kyc-documents')
export class KycController {
  constructor(private readonly usersService: UsersService) {}

  @Patch(':id')
  async review(
    @Param('id') id: string,
    @CurrentUser() reviewer: AuthUser,
    @Body() dto: ReviewKycDocumentDto,
  ) {
    const result = await this.usersService.reviewKycDocument(id, reviewer.userId, dto);
    return ok(result, 'KYC document reviewed successfully');
  }
}
