import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/database.types';

type DeliverableType = Database['public']['Enums']['deliverable_type'];
type DeliverableStatus = Database['public']['Enums']['deliverable_status'];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 });

    let query = supabase.from('deliverables').select(`*, acts (name, artist_name), deliverable_comments (id, body, created_at)`).eq('project_id', projectId).order('updated_at', { ascending: false });
    const type = searchParams.get('type');
    if (type) query = query.eq('type', type as DeliverableType);
    const status = searchParams.get('status');
    if (status) query = query.eq('status', status as DeliverableStatus);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('deliverables').insert({ project_id: body.project_id, act_id: body.act_id, type: body.type, title: body.title, data: body.data || {}, deadline: body.deadline, submitted_by: user?.id }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
}
