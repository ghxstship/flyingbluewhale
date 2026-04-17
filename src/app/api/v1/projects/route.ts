import { withAuth, apiOk, apiCreated, apiError, parsePagination } from '@/lib/api/api-response';
import { projectCreateSchema } from '@/lib/api/schemas';
import type { Database } from '@/lib/supabase/database.types';

type ProjectStatus = Database['public']['Enums']['project_status'];
type ProjectType = Database['public']['Enums']['project_type'];

/* ═══════════════════════════════════════════════════════
   /api/v1/projects — Project CRUD
   Hardened: auth guard, Zod validation, tenant isolation,
   sanitized error responses.
   ═══════════════════════════════════════════════════════ */

export const GET = withAuth(async (request, user, supabase) => {
  const { searchParams } = new URL(request.url);
  const { page, pageSize, offset } = parsePagination(searchParams);

  let query = supabase
    .from('projects')
    .select('*, spaces(id), acts(id), deliverables(id, status)', { count: 'exact' })
    .order('created_at', { ascending: false });

  const status = searchParams.get('status');
  if (status) query = query.eq('status', status as ProjectStatus);

  const type = searchParams.get('type');
  if (type) query = query.eq('type', type as ProjectType);

  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;
  if (error) return apiError('Failed to fetch projects', 400);

  return apiOk({ data, meta: { total: count ?? 0, page, pageSize } });
});

export const POST = withAuth(async (request, user, supabase) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = projectCreateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Validation failed', 400, 'VALIDATION_ERROR');
  }

  // Resolve organization from user's membership — never trust client-supplied org_id
  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (!orgMember) {
    return apiError('User has no organization membership', 403, 'NO_ORG');
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      organization_id: orgMember.organization_id,
      name: parsed.data.name,
      slug: parsed.data.slug,
      type: parsed.data.type,
      start_date: parsed.data.start_date ?? null,
      end_date: parsed.data.end_date ?? null,
      features: [],
      settings: {},
    })
    .select()
    .single();

  if (error) return apiError('Failed to create project', 400);
  return apiCreated(data);
});
