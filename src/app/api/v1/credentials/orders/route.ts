import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');
  if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  let query = supabase.from('credential_orders').select(`*`).eq('project_id', projectId).order('created_at', { ascending: false });
  const status = searchParams.get('status');
  if (status) query = query.eq('status', status as 'requested' | 'approved' | 'denied' | 'issued' | 'picked_up' | 'revoked');
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await supabase.from('credential_orders').insert({ project_id: body.project_id, credential_type_id: body.credential_type_id, user_id: user.id, group_name: body.group_name, quantity: body.quantity || 1, notes: body.notes }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
