import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/database.types';

type ProjectStatus = Database['public']['Enums']['project_status'];
type ProjectType = Database['public']['Enums']['project_type'];

// GET /api/v1/projects - List projects
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  let query = supabase
    .from('projects')
    .select('*, spaces(id), acts(id), deliverables(id, status)')
    .order('created_at', { ascending: false });

  const status = searchParams.get('status');
  if (status) query = query.eq('status', status as ProjectStatus);

  const type = searchParams.get('type');
  if (type) query = query.eq('type', type as ProjectType);

  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    data,
    meta: { count, limit, offset },
  });
}

// POST /api/v1/projects - Create project
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from('projects')
    .insert({
      organization_id: body.organization_id,
      name: body.name,
      slug: body.slug,
      type: body.type || 'hybrid',
      start_date: body.start_date,
      end_date: body.end_date,
      venue: body.venue,
      features: body.features || [],
      settings: body.settings || {},
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data }, { status: 201 });
}
