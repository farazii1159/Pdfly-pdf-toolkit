import Link from 'next/link';

import {
  FileText,
  Combine,
  Scissors,
  Minimize2,
  FileType,
  Presentation,
  Sheet,
  Image as ImageIcon,
  FileImage,
  Code2,
  FileDown,
  RotateCw,
  ListOrdered,
  Crop,
  Hash,
  PenLine,
  Edit3,
  FormInput,
  EyeOff,
  Lock,
  Unlock,
  ScanText,
  Wrench,
  GitCompare,
  FileArchive,
  Sparkles,
  Languages,
  ScanLine,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

import { CATEGORIES, TOOLS } from '@/lib/tools-config';

const ICONS: Record<string, LucideIcon> = {
  Combine,
  Scissors,
  Minimize2,
  FileType,
  Presentation,
  Sheet,
  ImageIcon,
  FileImage,
  Code2,
  FileDown,
  RotateCw,
  ListOrdered,
  Crop,
  Hash,
  PenLine,
  Edit3,
  FormInput,
  EyeOff,
  Lock,
  Unlock,
  ScanText,
  Wrench,
  GitCompare,
  FileArchive,
  Sparkles,
  Languages,
  ScanLine,
  Workflow,
};

export default function ToolsPreview() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Everything you need for PDFs
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500 sm:text-base">
            Convert, organize, edit, and secure your documents — all in one place.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((category) => {
            const tools = TOOLS
              .filter((t) => t.category === category)
              .slice(0, 5);

            return (
              <div
                key={category}
                className="rounded-xl border border-slate-200 bg-slate-50 p-5"
              >
                <p className="mb-3 text-sm font-semibold text-slate-900">
                  {category}
                </p>

                <ul className="space-y-2">
                  {tools.map((tool) => {
                    const Icon = ICONS[tool.icon] || FileText;

                    return (
                      <li
                        key={tool.slug}
                        className="flex items-center gap-2 text-sm text-slate-600"
                      >
                        <Icon
                          size={15}
                          className="shrink-0 text-brand-600"
                        />

                        {tool.name}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-700"
          >
            Get Started — it&apos;s free
          </Link>
        </div>
      </div>
    </section>
  );
}