import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../rbac/roles.decorator';
import { CursorPaginationDto } from '../../common/dto/pagination.dto';
import { ok, paginatedFrom } from '../../common/dto/service-result';

@ApiTags('users')
@ApiBearerAuth('bearer')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: AuthUser) {
    const result = await this.usersService.getMe(user.userId);
    return ok(result, 'Profile retrieved successfully');
  }

  @Patch('me')
  async updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    const result = await this.usersService.updateMe(user.userId, dto);
    return ok(result, 'Profile updated successfully');
  }

  @Roles('staff', 'admin')
  @Get()
  async listUsers(@Query() query: CursorPaginationDto) {
    const page = await this.usersService.listUsers(query);
    return paginatedFrom(page, query.limit, 'Users retrieved successfully');
  }

  @Roles('staff', 'admin')
  @Get(':id')
  async getUser(@Param('id') id: string) {
    const result = await this.usersService.getUser(id);
    return ok(result, 'User retrieved successfully');
  }

  @Roles('admin')
  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const result = await this.usersService.updateUser(id, dto);
    return ok(result, 'User updated successfully');
  }
}
