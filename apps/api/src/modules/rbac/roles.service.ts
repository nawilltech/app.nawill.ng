import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async listRoles() {
    return this.prisma.role.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } });
  }

  async listUserRoles(userId: string) {
    return this.prisma.userRole.findMany({
      where: { userId, deletedAt: null },
      include: { role: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Re-assigning a previously-revoked role reactivates the same row rather than erroring on the unique constraint. */
  async assignRole(userId: string, roleId: string, assignedBy: string) {
    const [user, role] = await Promise.all([
      this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } }),
      this.prisma.role.findFirst({ where: { id: roleId, deletedAt: null } }),
    ]);
    if (!user) throw new NotFoundException('User not found');
    if (!role) throw new NotFoundException('Role not found');

    return this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: { deletedAt: null, assignedBy },
      create: { userId, roleId, assignedBy },
      include: { role: true },
    });
  }

  async revokeRole(userId: string, roleId: string): Promise<void> {
    const assignment = await this.prisma.userRole.findFirst({
      where: { userId, roleId, deletedAt: null },
    });
    if (!assignment) throw new NotFoundException('Role assignment not found');

    await this.prisma.userRole.update({ where: { id: assignment.id }, data: { deletedAt: new Date() } });
  }
}
