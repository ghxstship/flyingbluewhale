import { requireAuth } from '@/lib/api/guards';
import { success, error, handleError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const GET = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');
    const projectId = searchParams.get('project_id');

    if (!entityType || !entityId) {
      return error('entity_type and entity_id required' , 400);
    }

    let query = supabase.from('documents').select(`*`).eq('entity_type', entityType).eq('entity_id', entityId).order('created_at', { ascending: false });
    if (projectId) query = query.eq('project_id', projectId);

    const { data, error: dbError } = await query;
    if (dbError) return handleError(dbError);
    return success(data);
});

export const POST = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const supabase = await createClient();
    const body = await request.json();

    if (!body.entity_type || !body.entity_id || !body.file_url || !body.file_name) {
      return error('entity_type, entity_id, file_url, and file_name required' , 400);
    }

    const { data, error: dbError } = await supabase.from('documents').insert({
      organization_id: body.organization_id,
      project_id: body.project_id || null,
      entity_type: body.entity_type,
      entity_id: body.entity_id,
      type: body.type || 'other',
      file_url: body.file_url,
      file_name: body.file_name,
      file_size_bytes: body.file_size_bytes || null,
      mime_type: body.mime_type || null,
      thumbnail_url: body.thumbnail_url || null,
      uploaded_by: user.id,
      notes: body.notes || null,
      metadata: body.metadata || {},
    }).select().single();

    if (dbError) return handleError(dbError);
    return success(data, undefined, 201);
});

export const DELETE = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return error('id required' , 400);

    const {  error: dbError } = await supabase.from('documents').delete().eq('id', id);
    if (dbError) return handleError(dbError);
    return NextResponse.json({ success: true });
});
