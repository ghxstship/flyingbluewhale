import { requireAuth } from '@/lib/api/guards';
import { success, error, handleError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export const GET = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    if (!projectId) return error('project_id required' , 400);

    let query = supabase.from('lost_found_reports').select(`*, asset_instances (id, asset_tag, barcode, advance_items (id, name)), locations!found_location_id (id, name), shipments (id, reference_number, status, tracking_number)`).eq('project_id', projectId).order('created_at', { ascending: false });

    const type = searchParams.get('type');
    if (type) query = query.eq('type', type as 'lost' | 'found');

    const status = searchParams.get('status');
    if (status) query = query.eq('status', status as any);

    const category = searchParams.get('category');
    if (category) query = query.eq('category', category);

    const { data, error: dbError } = await query;
    if (dbError) return handleError(dbError);
    return success(data);
});

export const POST = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const supabase = await createClient();
    const body = await request.json();

    if (!body.project_id || !body.type || !body.item_description) {
      return error('project_id, type, and item_description required' , 400);
    }

    // Auto-generate reference number
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const { count } = await supabase.from('lost_found_reports').select('*', { count: 'exact', head: true }).eq('project_id', body.project_id);
    const refNumber = `LF-${today}-${String((count ?? 0) + 1).padStart(3, '0')}`;

    const { data, error: dbError } = await supabase.from('lost_found_reports').insert({
      project_id: body.project_id,
      type: body.type,
      reference_number: body.reference_number || refNumber,
      category: body.category || 'personal_item',
      item_description: body.item_description,
      item_color: body.item_color || null,
      item_brand: body.item_brand || null,
      identifying_features: body.identifying_features || null,
      estimated_value: body.estimated_value || null,
      asset_instance_id: body.asset_instance_id || null,
      allocation_id: body.allocation_id || null,
      found_location_id: body.found_location_id || null,
      found_at: body.found_at || (body.type === 'found' ? new Date().toISOString() : null),
      found_by_name: body.found_by_name || null,
      found_by_user_id: body.type === 'found' ? user.id : null,
      found_by_phone: body.found_by_phone || null,
      found_by_email: body.found_by_email || null,
      lost_at_approx: body.lost_at_approx || null,
      last_seen_description: body.last_seen_description || null,
      storage_location_id: body.storage_location_id || null,
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

    if (body.status !== undefined) {
      updates.status = body.status;
      if (body.status === 'claimed') {
        updates.claimed_by_name = body.claimed_by_name || null;
        updates.claimed_by_email = body.claimed_by_email || null;
        updates.claimed_by_phone = body.claimed_by_phone || null;
        updates.claimed_by_user_id = body.claimed_by_user_id || null;
        updates.claim_description = body.claim_description || null;
      }
      if (body.status === 'verified') {
        updates.verified_by = user.id;
        updates.verification_method = body.verification_method || null;
        updates.verification_notes = body.verification_notes || null;
      }
      if (body.status === 'returned' || body.status === 'shipped' || body.status === 'disposed') {
        updates.resolved_by = user.id;
        updates.resolution = body.resolution || null;
        updates.resolution_notes = body.resolution_notes || null;
      }
      if (body.status === 'shipped') {
        updates.shipping_address = body.shipping_address || null;
      }
      if (body.status === 'disposed') {
        updates.disposal_date = body.disposal_date || new Date().toISOString().split('T')[0];
      }
    }

    const fields = ['item_description','category','item_color','item_brand','identifying_features','estimated_value','asset_instance_id','storage_location_id','notes'];
    for (const f of fields) {
      if (body[f] !== undefined) updates[f] = body[f];
    }

    const { data, error: dbError } = await supabase.from('lost_found_reports').update(updates as any).eq('id', body.id).select().single();
    if (dbError) return handleError(dbError);
    return success(data);
});
