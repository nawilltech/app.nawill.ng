import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { SubmitKycDocumentDto } from './dto/submit-kyc-document.dto';
import { ReviewKycDocumentDto } from './dto/review-kyc-document.dto';
import { SAFE_USER_SELECT } from './user.select';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { assertOrgAccess } from '../../common/auth/access.util';
import { CursorPaginationDto, cursorArgs, sliceCursorPage } from '../../common/dto/pagination.dto';
import { ReviewStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: SAFE_USER_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: SAFE_USER_SELECT,
    });
  }

  async listUsers(dto: CursorPaginationDto) {
    const rows = await this.prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: SAFE_USER_SELECT,
      ...cursorArgs(dto),
    });
    return sliceCursorPage(rows, dto.limit);
  }

  async getOrganization(organizationId: string, requester: AuthUser) {
    assertOrgAccess(requester, organizationId, 'You do not have access to this organization');
    const org = await this.prisma.organization.findFirst({ where: { id: organizationId, deletedAt: null } });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async updateOrganization(organizationId: string, requester: AuthUser, dto: UpdateOrganizationDto) {
    await this.getOrganization(organizationId, requester); // existence + access check
    return this.prisma.organization.update({ where: { id: organizationId }, data: dto });
  }

  async submitKycDocument(organizationId: string, requester: AuthUser, dto: SubmitKycDocumentDto) {
    assertOrgAccess(requester, organizationId, 'You do not have access to this organization');

    return this.prisma.$transaction(async (tx) => {
      const doc = await tx.kycDocument.create({
        data: { organizationId, docType: dto.docType, fileId: dto.fileId },
      });

      await tx.organization.updateMany({
        where: { id: organizationId, kycStatus: 'pending' },
        data: { kycStatus: 'submitted' },
      });

      return doc;
    });
  }

  async listKycDocuments(organizationId: string, requester: AuthUser) {
    assertOrgAccess(requester, organizationId, 'You do not have access to this organization');
    return this.prisma.kycDocument.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewKycDocument(kycDocumentId: string, reviewerId: string, dto: ReviewKycDocumentDto) {
    const doc = await this.prisma.kycDocument.findFirst({ where: { id: kycDocumentId, deletedAt: null } });
    if (!doc) throw new NotFoundException('KYC document not found');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.kycDocument.update({
        where: { id: kycDocumentId },
        data: { reviewStatus: dto.reviewStatus, reviewNote: dto.reviewNote, reviewedBy: reviewerId },
      });

      await tx.organization.update({
        where: { id: doc.organizationId },
        data: { kycStatus: dto.reviewStatus === ReviewStatus.approved ? 'approved' : 'rejected' },
      });

      return updated;
    });
  }
}
