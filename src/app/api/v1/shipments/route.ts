import { requireAuth } from '@/lib/api/guards';
import { success, error, handleError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export const GET = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const orgId = searchParams.get('organization_id');
    const direction = searchParams.get('direction');
    const status = searchParams.get('status');

    let query = supabase.from('shipments').select(`*, vendors!carrier_id (id, name), shipment_events (*)`).order('created_at', { ascending: false });

    if (projectId) query = query.eq('project_id', projectId);
    if (orgId) query = query.eq('organization_id', orgId);
    if (direction) query = query.eq('direction', direction as any);
    if (status) query = query.eq('status', status as any);

    const { data, error: dbError } = await query;
    if (dbError) return handleError(dbError);
    return success(data);
});

export const POST = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const supabase = await createClient();
    const body = await request.json();

    if (!body.organization_id || !body.direction) {
      return error('organization_id and direction required' , 400);
    }

    // Auto-generate reference number
    const prefix = body.direction === 'inbound' ? 'SHP-IN' : body.direction === 'outbound' ? 'SHP-OUT' : 'SHP-XFR';
    const { count } = await supabase.from('shipments').select('*', { count: 'exact', head: true }).eq('organization_id', body.organization_id);
    const refNumber = `${prefix}-${String((count ?? 0) + 1).padStart(4, '0')}`;

    const { data, error: dbError } = await supabase.from('shipments').insert({
      organization_id: body.organization_id,
      project_id: body.project_id || null,
      fulfillment_order_id: body.fulfillment_order_id || null,
      po_id: body.po_id || null,
      direction: body.direction,
      reference_number: body.reference_number || refNumber,
      carrier_id: body.carrier_id || null,
      carrier_name: body.carrier_name || null,
      service_level: body.service_level || null,
      tracking_number: body.tracking_number || null,
      tracking_url: body.tracking_url || null,
      bol_number: body.bol_number || null,
      pro_number: body.pro_number || null,
      origin_location_id: body.origin_location_id || null,
      destination_location_id: body.destination_location_id || null,
      origin_address: body.origin_address || {},
      destination_address: body.destination_address || {},
      scheduled_pickup_at: body.scheduled_pickup_at || null,
      scheduled_delivery_at: body.scheduled_delivery_at || null,
      estimated_delivery_at: body.estimated_delivery_at || null,
      weight_kg: body.weight_kg || null,
      piece_count: body.piece_count || null,
      pallet_count: body.pallet_count || null,
      dimensions: body.dimensions || null,
      freight_class: body.freight_class || null,
      special_instructions: body.special_instructions || null,
      cost: body.cost || null,
      insurance_value: body.insurance_value || null,
      notes: body.notes || null,
      created_by: user?.id,
    }).select().single();

    if (dbError) return handleError(dbError);
    return success(data, undefined, 201);
});

export const PATCH = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const supabase = await createClient();
    const body = await request.json();

    if (!body.id) return error('id required' , 400);

    const updates: Record<string, unknown> = {};
    const fields = ['status','carrier_id','carrier_name','service_level','tracking_number','tracking_url','bol_number','pro_number','scheduled_pickup_at','actual_pickup_at','scheduled_delivery_at','actual_delivery_at','estimated_delivery_at','weight_kg','piece_count','pallet_count','special_instructions','cost','notes','signed_by','signature_url'];
    for (const f of fields) {
      if (body[f] !== undefined) updates[f] = body[f];
    }

    // Add tracking event if provided
    if (body.event) {
      await supabase.from('shipment_events').insert({
        shipment_id: body.id,
        status: body.event.status || body.status,
        location: body.event.location || null,
        city: body.event.city || null,
        state: body.event.state || null,
        description: body.event.description || null,
        source: body.event.source || 'manual',
        recorded_by: user.id,
      });
    }

    const { data, error: dbError } = await supabase.from('shipments').update(updates as any).eq('id', body.id).select().single();
    if (dbError) return handleError(dbError);
    return success(data);
});
