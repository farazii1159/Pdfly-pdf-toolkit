import { notFound } from 'next/navigation';
import { getToolBySlug } from '@/lib/tools-config';
import ToolPageClient from '@/components/tools/ToolPageClient';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { getCurrentUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function ToolPage({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const { tool: slug } = await params;

  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader email={user?.email} />

      <main className="container-px mx-auto max-w-3xl py-10">
        <ToolPageClient slug={slug} />
      </main>
    </div>
  );
}