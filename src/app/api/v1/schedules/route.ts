import { requireAuth } from '@/lib/api/guards';
import { success, error, handleError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export const GET = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    if (!projectId) return error('project_id required' , 400);

    let query = supabase.from('logistics_schedules').select(`*, logistics_schedule_items (*, advance_items (id, name), asset_instances (id, asset_tag, barcode))`).eq('project_id', projectId).order('scheduled_window_start', { ascending: true });

    const type = searchParams.get('type');
    if (type) query = query.eq('type', type as any);

    const status = searchParams.get('status');
    if (status) query = query.eq('status', status as any);

    const priority = searchParams.get('priority');
    if (priority) query = query.eq('priority', priority);

    // Date range filter
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (from) query = query.gte('scheduled_window_start', from);
    if (to) query = query.lte('scheduled_window_end', to);

    const assignedTo = searchParams.get('assigned_to');
    if (assignedTo) query = query.eq('assigned_to', assignedTo);

    const { data, error: dbError } = await query;
    if (dbError) return handleError(dbError);
    return success(data);
});

export const POST = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const supabase = await createClient();
    const body = await request.json();

    if (!body.project_id || !body.type || !body.title || !body.scheduled_window_start || !body.scheduled_window_end) {
      return error('project_id, type, title, scheduled_window_start, and scheduled_window_end required' , 400);
    }

    // Auto-generate reference number
    const prefix = { pickup: 'PU', delivery: 'DLV', transfer: 'XFR', vendor_return: 'VR', will_call: 'WC' }[body.type as string] || 'SCH';
    const { count } = await supabase.from('logistics_schedules').select('*', { count: 'exact', head: true }).eq('project_id', body.project_id);
    const refNumber = `${prefix}-${String((count ?? 0) + 1).padStart(4, '0')}`;

    const { data, error: dbError } = await supabase.from('logistics_schedules').insert({
      project_id: body.project_id,
      type: body.type,
      reference_number: body.reference_number || refNumber,
      fulfillment_order_id: body.fulfillment_order_id || null,
      shipment_id: body.shipment_id || null,
      title: body.title,
      description: body.description || null,
      item_summary: body.item_summary || null,
      item_count: body.item_count || null,
      origin_location_id: body.origin_location_id || null,
      destination_location_id: body.destination_location_id || null,
      dock_assignment: body.dock_assignment || null,
      gate_code: body.gate_code || null,
      scheduled_window_start: body.scheduled_window_start,
      scheduled_window_end: body.scheduled_window_end,
      assigned_to: body.assigned_to || null,
      driver_name: body.driver_name || null,
      driver_phone: body.driver_phone || null,
      driver_company: body.driver_company || null,
      vehicle_description: body.vehicle_description || null,
      vehicle_plate: body.vehicle_plate || null,
      notes: body.notes || null,
      priority: body.priority || 'normal',
      requested_by: user.id,
      created_by: user?.id,
    }).select().single();

    if (dbError) return handleError(dbError);

    // Create schedule items if provided
    if (body.items && Array.isArray(body.items) && data) {
      for (const item of body.items) {
        await supabase.from('logistics_schedule_items').insert({
          schedule_id: data.id,
          item_id: item.item_id || null,
          asset_instance_id: item.asset_instance_id || null,
          allocation_id: item.allocation_id || null,
          description: item.description,
          quantity: item.quantity || 1,
          notes: item.notes || null,
        });
      }
    }

    return success(data, undefined, 201);
});

export const PATCH = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const supabase = await createClient();
    const body = await request.json();

    if (!body.id) return error('id required' , 400);

    const updates: Record<string, unknown> = {};
    const fields = ['status','title','description','item_summary','item_count','origin_location_id','destination_location_id','dock_assignment','gate_code','scheduled_window_start','scheduled_window_end','assigned_to','driver_name','driver_phone','driver_company','vehicle_description','vehicle_plate','notes','priority','signature_url','pod_notes'];
    for (const f of fields) {
      if (body[f] !== undefined) updates[f] = body[f];
    }

    if (body.status === 'completed') {
      updates.verified_by = user.id;
      updates.verified_at = new Date().toISOString();
    }

    const { data, error: dbError } = await supabase.from('logistics_schedules').update(updates as any).eq('id', body.id).select().single();
    if (dbError) return handleError(dbError);
    return success(data);
});
