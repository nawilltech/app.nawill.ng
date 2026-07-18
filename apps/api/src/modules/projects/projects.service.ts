import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { assertOrgAccess, isStaffOrAdmin } from '../../common/auth/access.util';
import { CursorPaginationDto, cursorArgs, sliceCursorPage } from '../../common/dto/pagination.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        organizationId: dto.organizationId,
        ownerId: dto.ownerId,
        serviceId: dto.serviceId,
        engagementModel: dto.engagementModel,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async list(requester: AuthUser, query: CursorPaginationDto) {
    const rows = await this.prisma.project.findMany({
      where: {
        deletedAt: null,
        ...(isStaffOrAdmin(requester) ? {} : { organizationId: requester.organizationId ?? '__none__' }),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...cursorArgs(query),
    });
    return sliceCursorPage(rows, query.limit);
  }

  async getById(id: string, requester: AuthUser) {
    const project = await this.getByIdOrThrow(id);
    assertOrgAccess(requester, project.organizationId, 'You do not have access to this project');
    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.getByIdOrThrow(id);
    // organizationId/ownerId/serviceId/engagementModel/startDate are part of UpdateProjectDto
    // (via PartialType(CreateProjectDto)) but deliberately not writable through this endpoint —
    // reassigning a project's owning org/PM isn't a "field edit", it's a distinct operation this
    // build doesn't expose. Silently accepting-but-ignoring them here, rather than validating
    // them away in the DTO, keeps the DTO a true partial of Create for reuse elsewhere.
    return this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        phase: dto.phase,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        completedAt: dto.phase === 'post_project' ? new Date() : undefined,
      },
    });
  }

  private async getByIdOrThrow(id: string) {
    const project = await this.prisma.project.findFirst({ where: { id, deletedAt: null } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }
}
