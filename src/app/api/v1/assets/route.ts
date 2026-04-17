import { requireAuth } from '@/lib/api/guards';
import { success, error, handleError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export const GET = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organization_id');
    const barcode = searchParams.get('barcode');
    const assetTag = searchParams.get('asset_tag');
    const status = searchParams.get('status');
    const itemId = searchParams.get('item_id');
    const locationId = searchParams.get('location_id');

    let query = supabase.from('asset_instances').select(`*, advance_items (id, name, manufacturer, model, sku, unit), locations (id, name, type), asset_events (id, event_type, recorded_at, notes, condition_after)`).order('created_at', { ascending: false });

    if (orgId) query = query.eq('organization_id', orgId);
    if (barcode) query = query.eq('barcode', barcode);
    if (assetTag) query = query.eq('asset_tag', assetTag);
    if (status) query = query.eq('status', status as 'available' | 'allocated' | 'checked_out' | 'in_transit' | 'maintenance' | 'lost' | 'retired');
    if (itemId) query = query.eq('item_id', itemId);
    if (locationId) query = query.eq('location_id', locationId);

    // Limit events to latest 10 per asset
    const limit = searchParams.get('limit');
    if (limit) query = query.limit(parseInt(limit));

    const { data, error: dbError } = await query;
    if (dbError) return handleError(dbError);
    return success(data);
});

export const POST = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const supabase = await createClient();
    const body = await request.json();

    if (!body.item_id || !body.organization_id) {
      return error('item_id and organization_id required' , 400);
    }

    // Auto-generate asset tag if not provided
    let assetTag = body.asset_tag;
    if (!assetTag) {
      const { data: item } = await supabase.from('advance_items').select('slug').eq('id', body.item_id).single();
      const { count } = await supabase.from('asset_instances').select('*', { count: 'exact', head: true }).eq('item_id', body.item_id);
      const slug = item?.slug?.toUpperCase().replace(/-/g, '') || 'ASSET';
      assetTag = `${slug}-${String((count ?? 0) + 1).padStart(3, '0')}`;
    }

    const { data, error: dbError } = await supabase.from('asset_instances').insert({
      item_id: body.item_id,
      organization_id: body.organization_id,
      serial_number: body.serial_number || null,
      barcode: body.barcode || null,
      rfid: body.rfid || null,
      asset_tag: assetTag,
      condition: body.condition || 'new',
      location_id: body.location_id || null,
      purchase_date: body.purchase_date || null,
      purchase_price: body.purchase_price || null,
      purchase_order_id: body.purchase_order_id || null,
      warranty_expires: body.warranty_expires || null,
      notes: body.notes || null,
      metadata: body.metadata || {},
    }).select().single();

    if (dbError) return handleError(dbError);

    // Log creation event
    if (data) {
      await supabase.from('asset_events').insert({
        asset_id: data.id,
        event_type: 'created',
        to_location_id: body.location_id || null,
        condition_after: body.condition || 'new',
        notes: body.notes || 'Asset registered',
        recorded_by: user.id,
      });
    }

    return success(data, undefined, 201);
});

export const PATCH = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const supabase = await createClient();
    const body = await request.json();

    if (!body.id) return error('id required' , 400);

    const updates: Record<string, unknown> = {};
    const fields = ['status','condition','location_id','current_holder_id','current_project_id','serial_number','barcode','rfid','warranty_expires','last_maintenance_at','next_maintenance_at','retirement_date','retirement_reason','notes'];
    for (const f of fields) {
      if (body[f] !== undefined) updates[f] = body[f];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: dbError } = await supabase.from('asset_instances').update(updates as any).eq('id', body.id).select().single();
    if (dbError) return handleError(dbError);
    return success(data);
});
