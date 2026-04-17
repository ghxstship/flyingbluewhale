import { NextResponse } from 'next/server';

/* ═══════════════════════════════════════════════════════
   /api/health — Health Check
   Hardened: uses a lightweight SELECT 1 instead of
   querying an RLS-protected table. Returns structured
   response with version info.
   ═══════════════════════════════════════════════════════ */

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
      return NextResponse.json(
        { status: 'degraded', reason: 'Database not configured', timestamp: new Date().toISOString() },
        { status: 503 },
      );
    }

    // Lightweight connectivity check — hit the Supabase REST endpoint directly
    // This avoids RLS issues that could cause false-negative health checks
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { status: 'error', timestamp: new Date().toISOString() },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version ?? '0.1.0',
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { status: 'error', timestamp: new Date().toISOString() },
      { status: 503 },
    );
  }
}
