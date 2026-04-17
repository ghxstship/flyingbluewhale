import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Capability } from '@/lib/rbac/capabilities';
import { can } from '@/lib/rbac/capabilities';

/* ═══════════════════════════════════════════════════════
   API Response Helpers — Canonical API layer
   Standardizes all REST API response shapes.

   Success:  { data }
   Error:    { error: { message, code? } }
   Paginated: { data, meta: { total, page, pageSize } }
   ═══════════════════════════════════════════════════════ */

/** Successful response with data */
export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

/** Created response (201) */
export function apiCreated<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

/** Error response with standardized shape */
export function apiError(message: string, status = 400, code?: string) {
  return NextResponse.json(
    { error: { message, ...(code && { code }) } },
    { status },
  );
}

/** 401 Unauthorized */
export function apiUnauthorized(message = 'Authentication required') {
  return apiError(message, 401, 'UNAUTHORIZED');
}

/** 403 Forbidden */
export function apiForbidden(message = 'Insufficient permissions') {
  return apiError(message, 403, 'FORBIDDEN');
}

/** 404 Not Found */
export function apiNotFound(resource = 'Resource') {
  return apiError(`${resource} not found`, 404, 'NOT_FOUND');
}

/** Paginated response with metadata */
export function apiPaginated<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
) {
  return NextResponse.json({
    data,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

/* ─── Auth User Context ─── */

export interface AuthUser {
  id: string;
  email?: string;
}

export interface AuthContext {
  user: AuthUser;
  supabase: Awaited<ReturnType<typeof createClient>>;
  orgId: string | null;
  orgRole: string | null;
  requestId: string;
}

/* ─── Auth Wrapper ─── */

type AuthenticatedHandler<TContext = unknown> = (
  request: Request,
  user: AuthUser,
  supabase: Awaited<ReturnType<typeof createClient>>,
  context: TContext
) => Promise<NextResponse>;

/**
 * Higher-order function that wraps an API handler with auth.
 * Extracts user from Supabase JWT or returns 401.
 *
 * Usage:
 *   export const GET = withAuth(async (request, user, supabase) => {
 *     const { data } = await supabase.from('...').select('*');
 *     return apiOk(data);
 *   });
 */
export function withAuth<TContext = unknown>(handler: AuthenticatedHandler<TContext>) {
  return async (request: Request, context: TContext) => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return apiUnauthorized();
      }

      return handler(request, { id: user.id, email: user.email ?? undefined }, supabase, context);
    } catch {
      return apiError('Internal server error', 500, 'INTERNAL_ERROR');
    }
  };
}

/**
 * Higher-order function that wraps an API handler with auth + RBAC capability check.
 * Resolves the user's org membership and verifies they have the required capability.
 *
 * Usage:
 *   export const POST = withAuthz(['projects:create'], async (request, ctx) => {
 *     const { data } = await ctx.supabase.from('projects').insert({...});
 *     return apiCreated(data);
 *   });
 */
export function withAuthz(
  requiredCapabilities: Capability[],
  handler: (request: Request, ctx: AuthContext, routeContext: unknown) => Promise<NextResponse>,
) {
  return withAuth(async (request, user, supabase, routeContext) => {
    // Resolve org membership and role
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const orgId = orgMember?.organization_id ?? null;
    const orgRole = orgMember?.role ?? null;

    // Check capabilities if role is resolved
    if (requiredCapabilities.length > 0) {
      if (!orgRole) {
        return apiForbidden('No organization role assigned');
      }

      const hasCapability = requiredCapabilities.some((cap) => can(orgRole, cap));
      if (!hasCapability) {
        return apiForbidden(
          `Requires capability: ${requiredCapabilities.join(' or ')}`,
        );
      }
    }

    const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();

    return handler(
      request,
      { user, supabase, orgId, orgRole, requestId },
      routeContext,
    );
  });
}

/* ─── Query Helpers ─── */

/** Parse pagination params from URL searchParams */
export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('page_size') ?? '50', 10)));
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}

/* ─── Error Sanitization ─── */

/**
 * Maps raw database/system errors to safe client messages.
 * Prevents leaking schema details, table names, or SQL errors.
 */
export function sanitizeAndRespond(err: unknown): NextResponse {
  // Log the real error internally
  console.error('[API Error]:', err);

  if (!err || typeof err !== 'object') {
    return apiError('An unexpected error occurred', 500, 'INTERNAL_ERROR');
  }

  const error = err as Record<string, unknown>;

  // Supabase PGRST errors
  if (typeof error.code === 'string') {
    switch (error.code) {
      case '23505': return apiError('This record already exists.', 409, 'CONFLICT');
      case '23503': return apiError('Referenced record does not exist or is still in use.', 400, 'FK_VIOLATION');
      case '42501': return apiError('You do not have permission to perform this action.', 403, 'RLS_DENIED');
      case 'PGRST116': return apiNotFound();
    }
  }

  if (error.name === 'ZodError') {
    return apiError('Validation failed', 400, 'VALIDATION_ERROR');
  }

  return apiError('An unexpected error occurred', 500, 'INTERNAL_ERROR');
}
