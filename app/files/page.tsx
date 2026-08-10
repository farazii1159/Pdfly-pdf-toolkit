import { getCurrentUser } from '@/lib/supabase/server';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import FilesClient from '@/components/files/FilesClient';

export const dynamic = 'force-dynamic';

export default async function FilesPage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader email={user?.email} />
      <main className="container-px mx-auto max-w-4xl py-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Files</h1>
        <p className="mt-1 text-slate-600">Your recent tool activity and downloads.</p>
        <div className="mt-6">
          <FilesClient />
        </div>
      </main>
    </div>
  );
}
