import Link from 'next/link';
import {
  ArrowRight,
  Clock,
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

export default function ToolCard({
  tool,
}: {
  tool: ToolConfig;
}) {
  const Icon = ICONS[tool.icon] || FileText;

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-cardHover"
    >
      {tool.status === 'coming-soon' && (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
          <Clock size={13} />
          Soon
        </span>
      )}

      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
        <Icon size={19} />
      </span>

      <p className="text-sm font-semibold text-slate-900">
        {tool.name}
      </p>

      <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-500">
        {tool.description}
      </p>

      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">
        Open tool
        <ArrowRight size={13} />
      </span>
    </Link>
  );
}