'use client';

import { getToolBySlug } from '@/lib/tools-config';
import ToolWorkspace from '@/components/tools/ToolWorkspace';
import ComingSoon from '@/components/tools/ComingSoon';

type ToolPageClientProps = {
  slug: string;
};

export default function ToolPageClient({
  slug,
}: ToolPageClientProps) {
  const tool = getToolBySlug(slug);

  if (!tool) {
    return null;
  }

  return tool.status === 'working' ? (
    <ToolWorkspace slug={slug} />
  ) : (
    <ComingSoon tool={tool} />
  );
}