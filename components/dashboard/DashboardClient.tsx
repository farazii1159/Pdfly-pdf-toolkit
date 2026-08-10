'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { CATEGORIES, TOOLS } from '@/lib/tools-config';
import ToolCard from './ToolCard';

export default function DashboardClient({ userLabel }: { userLabel: string }) {
  const [query, setQuery] = useState('');

  const filteredByCategory = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? TOOLS.filter(
          (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
        )
      : TOOLS;

    return CATEGORIES.map((category) => ({
      category,
      tools: filtered.filter((t) => t.category === category),
    })).filter((group) => group.tools.length > 0);
  }, [query]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Welcome back{userLabel ? `, ${userLabel}` : ''} 👋
        </h1>
        <p className="mt-1 text-slate-600">What would you like to do today?</p>

        <div className="relative mt-6 max-w-md">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {filteredByCategory.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No tools match &quot;{query}&quot;. Try a different search.
        </div>
      )}

      <div className="space-y-10">
        {filteredByCategory.map(({ category, tools }) => (
          <section key={category}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {category}
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {tools.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
