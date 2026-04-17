import { requireAuth } from '@/lib/api/guards';
import { success, error, handleError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export const GET = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    if (!projectId) return error('project_id required' , 400);

    let query = supabase.from('purchase_orders').select(`*, vendors (id, name, type), locations!shipping_address_id (id, name), purchase_order_items (*, advance_items (id, name, manufacturer, model, sku))`).eq('project_id', projectId).order('created_at', { ascending: false });

    const status = searchParams.get('status');
    if (status) query = query.eq('status', status as any);

    const vendorId = searchParams.get('vendor_id');
    if (vendorId) query = query.eq('vendor_id', vendorId);

    const { data, error: dbError } = await query;
    if (dbError) return handleError(dbError);
    return success(data);
});

export const POST = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const supabase = await createClient();
    const body = await request.json();

    if (!body.project_id) return error('project_id required' , 400);

    // Auto-generate PO number
    const { count } = await supabase.from('purchase_orders').select('*', { count: 'exact', head: true }).eq('project_id', body.project_id);
    const poNumber = `PO-${String((count ?? 0) + 1).padStart(4, '0')}`;

    const { data, error: dbError } = await supabase.from('purchase_orders').insert({
      project_id: body.project_id,
      vendor_id: body.vendor_id || null,
      po_number: body.po_number || poNumber,
      order_date: body.order_date || new Date().toISOString().split('T')[0],
      expected_delivery: body.expected_delivery || null,
      shipping_address_id: body.shipping_address_id || null,
      currency: body.currency || 'USD',
      payment_terms: body.payment_terms || null,
      notes: body.notes || null,
      internal_notes: body.internal_notes || null,
      created_by: user?.id,
    }).select().single();

    if (dbError) return handleError(dbError);

    // Create line items if provided
    if (body.items && Array.isArray(body.items) && data) {
      for (let i = 0; i < body.items.length; i++) {
        const item = body.items[i];
        await supabase.from('purchase_order_items').insert({
          po_id: data.id,
          item_id: item.item_id || null,
          line_number: i + 1,
          description: item.description,
          sku: item.sku || null,
          quantity_ordered: item.quantity_ordered,
          unit_cost: item.unit_cost || 0,
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
      if (body.status === 'cancelled') {
        updates.cancelled_by = user.id;
        updates.cancellation_reason = body.cancellation_reason || null;
      }
    }
    if (body.vendor_id !== undefined) updates.vendor_id = body.vendor_id;
    if (body.expected_delivery !== undefined) updates.expected_delivery = body.expected_delivery;
    if (body.shipping_address_id !== undefined) updates.shipping_address_id = body.shipping_address_id;
    if (body.tax !== undefined) updates.tax = body.tax;
    if (body.shipping_cost !== undefined) updates.shipping_cost = body.shipping_cost;
    if (body.payment_terms !== undefined) updates.payment_terms = body.payment_terms;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.internal_notes !== undefined) updates.internal_notes = body.internal_notes;
    if (body.approved_by !== undefined) { updates.approved_by = body.approved_by; updates.approved_at = new Date().toISOString(); }

    const { data, error: dbError } = await supabase.from('purchase_orders').update(updates as any).eq('id', body.id).select().single();
    if (dbError) return handleError(dbError);
    return success(data);
});
