import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { SubmitKycDocumentDto } from './dto/submit-kyc-document.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { ok } from '../../common/dto/service-result';

@ApiTags('organizations')
@ApiBearerAuth('bearer')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async getOrganization(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const result = await this.usersService.getOrganization(id, user);
    return ok(result, 'Organization retrieved successfully');
  }

  @Patch(':id')
  async updateOrganization(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateOrganizationDto) {
    const result = await this.usersService.updateOrganization(id, user, dto);
    return ok(result, 'Organization updated successfully');
  }

  @Post(':id/kyc-documents')
  async submitKycDocument(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: SubmitKycDocumentDto,
  ) {
    const result = await this.usersService.submitKycDocument(id, user, dto);
    return ok(result, 'KYC document submitted successfully');
  }

  @Get(':id/kyc-documents')
  async listKycDocuments(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const result = await this.usersService.listKycDocuments(id, user);
    return ok(result, 'KYC documents retrieved successfully');
  }
}
