import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export const runtime = 'nodejs';

/**
 * Simple health check used to verify the deployment:
 * - the app is running
 * - LibreOffice (soffice) is installed and reachable
 *
 * Visit /api/health after deploying to confirm everything is set up.
 */
export async function GET() {
  let libreOfficeAvailable = false;
  let libreOfficeVersion: string | null = null;

  try {
    const { stdout } = await execFileAsync('soffice', ['--version'], { timeout: 5000 });
    libreOfficeAvailable = true;
    libreOfficeVersion = stdout.trim();
  } catch {
    libreOfficeAvailable = false;
  }

  return NextResponse.json({
    status: 'ok',
    libreOfficeAvailable,
    libreOfficeVersion,
    envConfigured: {
      supabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      supabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      supabaseServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
  });
}
