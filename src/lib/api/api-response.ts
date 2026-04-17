import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

/* ─── Auth Wrapper ─── */

type AuthenticatedHandler<TContext = any> = (
  request: Request,
  user: { id: string; email?: string },
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
export function withAuth<TContext = any>(handler: AuthenticatedHandler<TContext>) {
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

/* ─── Query Helpers ─── */

/** Parse pagination params from URL searchParams */
export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('page_size') ?? '50', 10)));
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}
