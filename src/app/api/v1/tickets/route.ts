import { withAuth, apiError } from '@/lib/api/api-response';

/* ═══════════════════════════════════════════════════════
   /api/v1/tickets — Ticketing Engine (Stub)
   Hardened: auth guard on stubs — unauthenticated users
   should get 401, not 501.
   ═══════════════════════════════════════════════════════ */

export const GET = withAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');
  if (!projectId) return apiError('project_id required', 400);
  // TODO: List / search tickets for project
  return apiError('Ticketing engine not yet enabled', 501, 'NOT_IMPLEMENTED');
});

export const POST = withAuth(async () => {
  // TODO: Purchase / reserve ticket
  return apiError('Ticketing engine not yet enabled', 501, 'NOT_IMPLEMENTED');
});
