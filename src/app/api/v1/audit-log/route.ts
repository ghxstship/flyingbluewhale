import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  let query = supabase.from('audit_log').select('*').order('created_at', { ascending: false });
  const projectId = searchParams.get('project_id');
  if (projectId) query = query.eq('project_id', projectId);
  const entityType = searchParams.get('entity_type');
  if (entityType) query = query.eq('entity_type', entityType);
  const entityId = searchParams.get('entity_id');
  if (entityId) query = query.eq('entity_id', entityId);
  const action = searchParams.get('action');
  if (action) query = query.ilike('action', `%${action}%`);
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
  const offset = parseInt(searchParams.get('offset') || '0');
  query = query.range(offset, offset + limit - 1);
  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data, meta: { count, limit, offset } });
}
