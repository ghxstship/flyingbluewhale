import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/v1/allocations - List allocations
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const projectId = searchParams.get('project_id');
  if (!projectId) return NextResponse.json({ error: 'project_id required' }, { status: 400 });

  let query = supabase
    .from('catalog_item_allocations')
    .select(`
      *,
      advance_items (id, name, manufacturer, model, unit),
      spaces (id, name),
      profiles:allocated_by (full_name)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  const state = searchParams.get('state');
  if (state) query = query.eq('state', state);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data });
}

// POST /api/v1/allocations - Reserve equipment
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('catalog_item_allocations')
    .insert({
      item_id: body.item_id,
      project_id: body.project_id,
      space_id: body.space_id,
      quantity: body.quantity || 1,
      notes: body.notes,
      allocated_by: user?.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data }, { status: 201 });
}
