import { apiFetch } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { ErrorAlert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { UserEditForm } from '@/components/admin/user-edit-form';
import { RoleAssignment } from '@/components/admin/role-assignment';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  userType: string;
  status: boolean;
  organizationId: string | null;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
}

interface AssignedRole {
  roleId: string;
  role: Role;
}

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  let user: AdminUser | null = null;
  let allRoles: Role[] = [];
  let assignedRoles: AssignedRole[] = [];
  let error: string | null = null;

  try {
    [user, allRoles, assignedRoles] = await Promise.all([
      apiFetch<AdminUser>(`/users/${params.id}`),
      apiFetch<Role[]>('/roles'),
      apiFetch<AssignedRole[]>(`/users/${params.id}/roles`),
    ]);
  } catch (e) {
    error = e instanceof ApiError ? e.message : 'Could not reach the API';
  }

  if (error || !user) {
    return <ErrorAlert message={error ?? 'User not found'} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-neutral-900">{user.name}</h1>
        <p className="text-sm text-neutral-600">{user.email}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <p className="mb-4 font-heading text-lg font-semibold text-neutral-900">Account</p>
          <UserEditForm userId={user.id} userType={user.userType} status={user.status} />
        </Card>

        <Card>
          <p className="mb-4 font-heading text-lg font-semibold text-neutral-900">Roles</p>
          <RoleAssignment userId={user.id} allRoles={allRoles} assignedRoles={assignedRoles} />
        </Card>
      </div>
    </div>
  );
}
