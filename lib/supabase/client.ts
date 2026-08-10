'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-only Supabase client, safe to use in Client Components.
 * Uses the public URL + anon key only — never the service role key.
 */
export function getSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
