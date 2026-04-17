import { requireAuth, validateBody } from '@/lib/api/guards';
import { success, error, handleError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { locationCreateSchema, locationUpdateSchema } from '@/lib/api/schemas';

export const GET = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('organization_id');
  const projectId = searchParams.get('project_id');
  const type = searchParams.get('type');
  const parentId = searchParams.get('parent_id');

  let query = supabase.from('locations').select('*').eq('is_active', true).order('name');

  if (orgId) query = query.eq('organization_id', orgId);
  if (projectId) query = query.eq('project_id', projectId);
  if (type) query = query.eq('type', type as any);
  
  if (parentId) {
    query = query.eq('parent_id', parentId);
  } else if (!searchParams.has('include_children')) {
    query = query.is('parent_id', null);
  }

  const { data, error: dbError } = await query;
  if (dbError) return handleError(dbError);
  return success(data);
});

export const POST = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const body = await validateBody(request, locationCreateSchema);
  if (!body) return error('Invalid request body', 400);

  const supabase = await createClient();

  // Resolve organization from user's membership — never trust client-supplied org_id
  const { data: orgMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (!orgMember) {
    return error('User has no organization membership', 403);
  }

  const slug = (body.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const { data, error: dbError } = await supabase.from('locations').insert({
    organization_id: orgMember.organization_id,
    project_id: body.project_id || null,
    parent_id: body.parent_id || null,
    name: body.name,
    slug,
    type: body.type || 'warehouse',
    address: body.address || {},
    capacity: body.capacity || {},
    contact: body.contact || {},
    metadata: body.metadata || {},
  }).select().single();

  if (dbError) return handleError(dbError);
  return success(data, undefined, 201);
});

export const PATCH = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const body = await validateBody(request, locationUpdateSchema);
  if (!body) return error('Invalid request body', 400);
  if (!body.id) return error('id required', 400);

  const supabase = await createClient();

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.type !== undefined) updates.type = body.type;
  if (body.address !== undefined) updates.address = body.address;
  if (body.capacity !== undefined) updates.capacity = body.capacity;
  if (body.contact !== undefined) updates.contact = body.contact;
  if (body.is_active !== undefined) updates.is_active = body.is_active;
  if (body.parent_id !== undefined) updates.parent_id = body.parent_id;
  if (body.metadata !== undefined) updates.metadata = body.metadata;

  const { data, error: dbError } = await supabase.from('locations').update(updates as any).eq('id', body.id).select().single();
  
  if (dbError) return handleError(dbError);
  return success(data);
});
