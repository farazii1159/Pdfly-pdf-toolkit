import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function LandingHero() {
  return (
    <section className="container-px mx-auto max-w-6xl pb-10 pt-16 text-center sm:pt-24">
      <span className="mb-4 inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
        All-in-one PDF toolkit
      </span>
      <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        Powerful PDF tools. One simple workspace.
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
        Convert, merge, compress, edit and manage your documents with a fast and
        easy-to-use PDF toolkit.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/signup"
          className="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-700"
        >
          Get Started
          <ArrowRight size={16} />
        </Link>
        <a
          href="#tools"
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Explore Tools
        </a>
      </div>
    </section>
  );
}
