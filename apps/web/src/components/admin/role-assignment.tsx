'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { assignRole, revokeRole } from '@/lib/actions/admin';
import { Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ui/alert';
import { ActionResult } from '@/lib/action-result';

interface Role {
  id: string;
  name: string;
}

interface AssignedRole {
  roleId: string;
  role: Role;
}

function AssignSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Assigning…' : 'Assign'}
    </Button>
  );
}

function RevokeButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50">
      {pending ? 'Revoking…' : 'Revoke'}
    </button>
  );
}

function RevokeRow({ userId, assigned }: { userId: string; assigned: AssignedRole }) {
  const [state, formAction] = useFormState<ActionResult, FormData>(revokeRole, {});

  return (
    <li className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm">
      <span className="font-medium capitalize text-neutral-800">{assigned.role.name.replace(/_/g, ' ')}</span>
      <form action={formAction}>
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="roleId" value={assigned.roleId} />
        <RevokeButton />
      </form>
      {state.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
    </li>
  );
}

export function RoleAssignment({
  userId,
  allRoles,
  assignedRoles,
}: {
  userId: string;
  allRoles: Role[];
  assignedRoles: AssignedRole[];
}) {
  const [state, formAction] = useFormState<ActionResult, FormData>(assignRole, {});
  const assignedIds = new Set(assignedRoles.map((a) => a.roleId));
  const availableRoles = allRoles.filter((r) => !assignedIds.has(r.id));

  return (
    <div className="flex flex-col gap-4">
      {assignedRoles.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {assignedRoles.map((a) => (
            <RevokeRow key={a.roleId} userId={userId} assigned={a} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-500">No roles assigned yet.</p>
      )}

      {availableRoles.length > 0 && (
        <form action={formAction} className="flex items-end gap-2">
          <input type="hidden" name="userId" value={userId} />
          <div className="flex-1">
            <Select name="roleId" required defaultValue="">
              <option value="" disabled>
                Select a role to assign
              </option>
              {availableRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
          </div>
          <AssignSubmitButton />
        </form>
      )}

      {state.error && <ErrorAlert message={state.error} />}
    </div>
  );
}
