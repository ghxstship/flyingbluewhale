import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/lib/supabase/database.types';
import { ROLE_TRACK_MAP } from '@/lib/supabase/types';
import { env } from '@/lib/env';

export async function middleware(request: NextRequest) {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured, warn instead of failing hard if we're on a preview
  if (supabaseUrl === 'http://localhost:54321' || !supabaseAnonKey) {
    if (process.env.VERCEL_ENV === 'production') {
      return new NextResponse('Service unavailable: authentication not configured', { status: 503 });
    }
    console.warn("Using placeholder Supabase credentials in middleware.");
  }

  // ─── Request ID for correlation ───
  const requestId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes: redirect to login if not authenticated
  // Guards all four authenticated shells: platform, portal, mobile, personal
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/console') ||
    request.nextUrl.pathname.startsWith('/p/') ||
    request.nextUrl.pathname.startsWith('/m') ||
    request.nextUrl.pathname.startsWith('/me') ||
    request.nextUrl.pathname.startsWith('/projects') ||
    request.nextUrl.pathname.startsWith('/catalog') ||
    request.nextUrl.pathname.startsWith('/templates') ||
    request.nextUrl.pathname.startsWith('/cms') ||
    request.nextUrl.pathname.startsWith('/notifications') ||
    request.nextUrl.pathname.startsWith('/catering');

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Auth pages: redirect to console if already authenticated
  const isAuthRoute =
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/signup';

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/console';
    return NextResponse.redirect(url);
  }

  // ═══ Role-Based Portal Routing (GAP-030) ═══
  // When user hits /p/[slug]/overview (the default portal landing),
  // redirect to their role-specific track.
  const portalOverviewMatch = request.nextUrl.pathname.match(/^\/p\/([^/]+)\/overview$/);
  if (portalOverviewMatch && user) {
    const slug = portalOverviewMatch[1];

    // Look up project and member role
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('slug', slug)
      .single();

    if (project) {
      const { data: member } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', project.id)
        .eq('user_id', user.id)
        .single();

      if (member) {
        const track = ROLE_TRACK_MAP[member.role] || 'production';
        const url = request.nextUrl.clone();
        url.pathname = `/p/${slug}/${track}`;
        return NextResponse.redirect(url);
      }
    }
  }

  // Attach request ID to response for client-side correlation
  supabaseResponse.headers.set('x-request-id', requestId);
  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/v1/docs|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

