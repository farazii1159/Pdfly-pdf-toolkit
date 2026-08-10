import { redirect } from 'next/navigation';
import { User, Calendar } from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase/server';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import LogoutButton from '@/components/dashboard/LogoutButton';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader email={user.email} />
      <main className="container-px mx-auto max-w-lg py-8">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-slate-900">Profile</h1>

        <div className="rounded-xl2 border border-slate-200 bg-white p-6 shadow-card">
          <div className="mb-6 flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600">
              <User size={26} />
            </span>
            <div>
              <p className="text-base font-semibold text-slate-900">{user.email}</p>
              <p className="text-sm text-slate-500">Signed in</p>
            </div>
          </div>

          <dl className="space-y-4 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between text-sm">
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-900">{user.email}</dd>
            </div>
            <div className="flex items-center justify-between text-sm">
              <dt className="flex items-center gap-1.5 text-slate-500">
                <Calendar size={14} />
                Account created
              </dt>
              <dd className="font-medium text-slate-900">{createdAt}</dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-slate-100 pt-4">
            <LogoutButton />
          </div>
        </div>
      </main>
    </div>
  );
}
