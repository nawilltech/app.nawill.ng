import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/current-user';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user?.userType !== 'admin') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
