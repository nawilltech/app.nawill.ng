import { cache } from 'react';
import { apiFetch } from '@/lib/api';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  userType: 'client' | 'staff' | 'admin';
  clientType?: string | null;
  organizationId?: string | null;
  emailVerifiedAt?: string | null;
}

/** `cache()` dedupes this within a single request — layout + page can both call it for free. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  try {
    return await apiFetch<CurrentUser>('/users/me');
  } catch {
    return null;
  }
});
