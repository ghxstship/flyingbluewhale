import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/* ═══════════════════════════════════════════════════════
   Auth Resolve — Role + Context → Shell Router
   Inspects user role + context and 307s to the correct
   shell root: /console, /p/[slug], /m, or /me.
   
   Per §3.2 of the IA spec:
   - Platform role → /console
   - Portal-only role → /p/[slug] for primary project
   - Mobile UA → /m
   - Fallback → /me
   ═══════════════════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 1. Mobile user-agent check → COMPVSS field PWA
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = Boolean(
    userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i)
  );

  if (isMobile) {
    return NextResponse.redirect(new URL('/m', request.url), 307);
  }

  // 2. Check for platform (org) role → ATLVS console
  const { data: orgMembership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (orgMembership) {
    // Internal user with org membership → console
    return NextResponse.redirect(new URL('/console', request.url), 307);
  }

  // 3. Check for project membership → GVTEWAY portal
  const { data: projectMembership } = await supabase
    .from('project_members')
    .select('role, projects!inner(slug)')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (projectMembership && projectMembership.projects) {
    const slug = (projectMembership.projects as any).slug;
    const role = projectMembership.role;

    // Route to the correct persona portal based on project role
    const personaMap: Record<string, string> = {
      talent: 'artist',
      vendor: 'vendor',
      client: 'client',
      sponsor: 'sponsor',
      guest: 'guest',
      attendee: 'guest',
      press: 'guest',
      crew: 'crew',
      staff: 'crew',
    };

    const persona = personaMap[role] || 'production';
    return NextResponse.redirect(
      new URL(`/p/${slug}/${persona}`, request.url),
      307
    );
  }

  // 4. Fallback → personal shell
  return NextResponse.redirect(new URL('/me', request.url), 307);
}
