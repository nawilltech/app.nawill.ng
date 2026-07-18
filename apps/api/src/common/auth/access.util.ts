import { ForbiddenException } from '@nestjs/common';
import { AuthUser } from '../decorators/current-user.decorator';

export function isStaffOrAdmin(user: AuthUser): boolean {
  return user.userType === 'staff' || user.userType === 'admin';
}

/** Throws unless `requester` is staff/admin or belongs to `organizationId`. */
export function assertOrgAccess(requester: AuthUser, organizationId: string, message: string): void {
  if (!isStaffOrAdmin(requester) && requester.organizationId !== organizationId) {
    throw new ForbiddenException(message);
  }
}

/** Throws unless `requester` is staff/admin or is the resource's own owner. */
export function assertSelfOrStaff(requester: AuthUser, ownerUserId: string, message: string): void {
  if (!isStaffOrAdmin(requester) && requester.userId !== ownerUserId) {
    throw new ForbiddenException(message);
  }
}
