import { SetMetadata } from '@nestjs/common';
import { UserType } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Coarse role guard on `users.userType`. The full (domain, action) permission
 * matrix schema exists (roles/permissions/role_permissions/user_roles) but
 * isn't enforced yet — see docs/QA.md §7.
 */
export const Roles = (...roles: UserType[]) => SetMetadata(ROLES_KEY, roles);
