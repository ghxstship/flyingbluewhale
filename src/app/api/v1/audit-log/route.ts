import { withAuth, apiOk, apiError, parsePagination } from '@/lib/api/api-response';

/* ═══════════════════════════════════════════════════════
   /api/v1/audit-log — Audit Log (Read-only)
   Hardened: auth guard (audit logs must not be public),
   sanitized error responses.
   ═══════════════════════════════════════════════════════ */

export const GET = withAuth(async (request, _user, supabase) => {
  const { searchParams } = new URL(request.url);
  const { pageSize, offset } = parsePagination(searchParams);

  let query = supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  const projectId = searchParams.get('project_id');
  if (projectId) query = query.eq('project_id', projectId);

  const entityType = searchParams.get('entity_type');
  if (entityType) query = query.eq('entity_type', entityType);

  const entityId = searchParams.get('entity_id');
  if (entityId) query = query.eq('entity_id', entityId);

  const action = searchParams.get('action');
  if (action) query = query.ilike('action', `%${action}%`);

  query = query.range(offset, offset + pageSize - 1);

  const { data, error: dbError, count } = await query;
  if (dbError) return apiError('Failed to fetch audit log', 400);

  return apiOk({ data, meta: { total: count ?? 0 } });
});
