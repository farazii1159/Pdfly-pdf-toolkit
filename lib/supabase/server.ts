import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server-only Supabase client using the service role key.
 *
 * IMPORTANT: This file must never be imported from a Client Component.
 * The service role key bypasses Row Level Security and must stay on the server.
 *
 * Use this ONLY inside Route Handlers, for storage uploads and inserts that
 * need to happen on behalf of an already-authenticated user.
 */
function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Check your .env.local file.`
    );
  }

  return value;
}

export function getSupabaseAdmin() {
  const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Cookie-aware Supabase client for Server Components and Route Handlers.
 *
 * Reads the logged-in user's session from cookies and respects Row Level
 * Security — use this for anything that should only return "the current
 * user's own data" (dashboard reads, file history, profile).
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: any;
          }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component that can't set cookies —
            // safe to ignore because middleware refreshes the session.
          }
        },
      },
    }
  );
}

/**
 * Returns the currently logged-in user, or null.
 * Safe to call anywhere server-side.
 */
export async function getCurrentUser() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export const STORAGE_BUCKETS = {
  WORD: 'word-files',
  PDF: 'pdf-files',
  IMAGES: 'images',
} as const;