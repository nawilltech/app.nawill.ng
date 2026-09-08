import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { Roles } from './roles.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { ok } from '../../common/dto/service-result';

@ApiTags('rbac')
@ApiBearerAuth('bearer')
@Roles('admin')
@Controller()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('roles')
  async listRoles() {
    const result = await this.rolesService.listRoles();
    return ok(result, 'Roles retrieved successfully');
  }

  @Get('users/:userId/roles')
  async listUserRoles(@Param('userId') userId: string) {
    const result = await this.rolesService.listUserRoles(userId);
    return ok(result, 'User roles retrieved successfully');
  }

  @Post('users/:userId/roles')
  async assignRole(@Param('userId') userId: string, @Body() dto: AssignRoleDto, @CurrentUser() admin: AuthUser) {
    const result = await this.rolesService.assignRole(userId, dto.roleId, admin.userId);
    return ok(result, 'Role assigned successfully');
  }

  @Delete('users/:userId/roles/:roleId')
  @HttpCode(HttpStatus.OK)
  async revokeRole(@Param('userId') userId: string, @Param('roleId') roleId: string) {
    await this.rolesService.revokeRole(userId, roleId);
    return ok(null, 'Role revoked successfully');
  }
}
