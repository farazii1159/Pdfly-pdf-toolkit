import { getCurrentUser } from '@/lib/supabase/server';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardClient from '@/components/dashboard/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const userLabel = user?.email ? user.email.split('@')[0] : '';

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader email={user?.email} />
      <main className="container-px mx-auto max-w-6xl py-8">
        <DashboardClient userLabel={userLabel} />
      </main>
    </div>
  );
}
