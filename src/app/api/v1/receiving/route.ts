import { requireAuth } from '@/lib/api/guards';
import { success, error, handleError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export const GET = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    if (!projectId) return error('project_id required' , 400);

    let query = supabase.from('receiving_records').select(`*, locations (id, name), vendors (id, name), purchase_orders (id, po_number), receiving_record_items (*, advance_items (id, name, manufacturer, model))`).eq('project_id', projectId).order('created_at', { ascending: false });

    const status = searchParams.get('status');
    if (status) query = query.eq('status', status as any);

    const { data, error: dbError } = await query;
    if (dbError) return handleError(dbError);
    return success(data);
});

export const POST = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const supabase = await createClient();
    const body = await request.json();

    if (!body.project_id || !body.location_id) {
      return error('project_id and location_id required' , 400);
    }

    // Auto-generate reference number
    const { count } = await supabase.from('receiving_records').select('*', { count: 'exact', head: true }).eq('project_id', body.project_id);
    const refNumber = `RCV-${String((count ?? 0) + 1).padStart(4, '0')}`;

    const { data, error: dbError } = await supabase.from('receiving_records').insert({
      project_id: body.project_id,
      po_id: body.po_id || null,
      location_id: body.location_id,
      reference_number: body.reference_number || refNumber,
      source: body.source || 'purchase_order',
      vendor_id: body.vendor_id || null,
      carrier_name: body.carrier_name || null,
      tracking_number: body.tracking_number || null,
      notes: body.notes || null,
      created_by: user?.id,
    }).select().single();

    if (dbError) return handleError(dbError);

    // Auto-populate items from PO if linked
    if (body.po_id && data) {
      const { data: poItems } = await supabase.from('purchase_order_items').select('*').eq('po_id', body.po_id);
      if (poItems) {
        for (const poi of poItems) {
          await supabase.from('receiving_record_items').insert({
            receiving_id: data.id,
            po_item_id: poi.id,
            item_id: poi.item_id,
            description: poi.description,
            quantity_expected: poi.quantity_ordered - poi.quantity_received,
          });
        }
      }
    }

    // Create manual items if provided
    if (body.items && Array.isArray(body.items) && data) {
      for (const item of body.items) {
        await supabase.from('receiving_record_items').insert({
          receiving_id: data.id,
          item_id: item.item_id || null,
          description: item.description,
          quantity_expected: item.quantity_expected || 0,
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
    if (body.status !== undefined) {
      updates.status = body.status;
      if (body.status === 'completed') {
        updates.received_by = user.id;
        updates.received_at = new Date().toISOString();
      }
      if (body.status === 'in_progress') {
        updates.inspected_by = user.id;
        updates.inspected_at = new Date().toISOString();
      }
    }
    if (body.notes !== undefined) updates.notes = body.notes;

    // Update line items if provided
    if (body.items && Array.isArray(body.items)) {
      for (const item of body.items) {
        if (item.id) {
          const itemUpdates: Record<string, unknown> = {};
          if (item.quantity_received !== undefined) itemUpdates.quantity_received = item.quantity_received;
          if (item.quantity_damaged !== undefined) itemUpdates.quantity_damaged = item.quantity_damaged;
          if (item.quantity_missing !== undefined) itemUpdates.quantity_missing = item.quantity_missing;
          if (item.condition !== undefined) itemUpdates.condition = item.condition;
          if (item.notes !== undefined) itemUpdates.notes = item.notes;
          if (item.inspected_by !== undefined) itemUpdates.inspected_by = item.inspected_by;
          await supabase.from('receiving_record_items').update(itemUpdates as any).eq('id', item.id);
        }
      }
    }

    const { data, error: dbError } = await supabase.from('receiving_records').update(updates as any).eq('id', body.id).select().single();
    if (dbError) return handleError(dbError);
    return success(data);
});
