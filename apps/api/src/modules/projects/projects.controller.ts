import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../rbac/roles.decorator';
import { CursorPaginationDto } from '../../common/dto/pagination.dto';
import { ok, paginatedFrom } from '../../common/dto/service-result';

@ApiTags('projects')
@ApiBearerAuth('bearer')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Roles('staff', 'admin')
  @Post()
  async create(@Body() dto: CreateProjectDto) {
    const result = await this.projectsService.create(dto);
    return ok(result, 'Project created successfully');
  }

  @Get()
  async list(@CurrentUser() user: AuthUser, @Query() query: CursorPaginationDto) {
    const page = await this.projectsService.list(user, query);
    return paginatedFrom(page, query.limit, 'Projects retrieved successfully');
  }

  @Get(':id')
  async getById(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const result = await this.projectsService.getById(id, user);
    return ok(result, 'Project retrieved successfully');
  }

  @Roles('staff', 'admin')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    const result = await this.projectsService.update(id, dto);
    return ok(result, 'Project updated successfully');
  }

  @Roles('staff', 'admin')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.projectsService.remove(id);
    return ok(null, 'Project removed successfully');
  }
}
