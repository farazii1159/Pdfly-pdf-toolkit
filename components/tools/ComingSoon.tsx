import Link from 'next/link';

import {
  Clock,
  ArrowLeft,
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

import type { ToolConfig } from '@/lib/tools-config';

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

export default function ComingSoon({
  tool,
}: {
  tool: ToolConfig;
}) {
  const Icon = ICONS[tool.icon] || FileText;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      <div className="rounded-xl2 border border-slate-200 bg-white p-10 text-center shadow-card">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Clock size={26} />
        </span>

        <div className="mb-2 flex items-center justify-center gap-2">
          <Icon size={18} className="text-slate-400" />

          <p className="text-sm font-medium text-slate-500">
            {tool.name}
          </p>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Coming Soon
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          This tool is planned for a future update.
        </p>

        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-700"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}