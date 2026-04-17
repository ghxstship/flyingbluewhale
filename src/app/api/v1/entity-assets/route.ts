import { requireAuth } from '@/lib/api/guards';
import { success, error, handleError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

/**
 * GET /api/v1/entity-assets?source_type=credential_order&source_id=xxx
 * Lists all asset links for a given entity.
 * Optional filters: project_id, link_type, active_only
 */
export const GET = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const sourceType = searchParams.get('source_type');
    const sourceId = searchParams.get('source_id');
    const projectId = searchParams.get('project_id');

    if (!sourceType && !projectId) {
      return error('source_type + source_id or project_id required' , 400);
    }

    let query = supabase
      .from('entity_asset_links')
      .select(`
        *,
        advance_items (id, name, manufacturer, model, sku, unit, image_url),
        catalog_item_allocations (id, state, quantity, barcode),
        asset_instances (id, asset_tag, barcode, serial_number, status, condition)
      `)
      .order('created_at', { ascending: false });

    if (sourceType && sourceId) {
      query = query.eq('source_type', sourceType).eq('source_id', sourceId);
    }
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const linkType = searchParams.get('link_type');
    if (linkType) {
      query = query.eq('link_type', linkType);
    }

    // Default to active-only (not unlinked)
    const activeOnly = searchParams.get('active_only') !== 'false';
    if (activeOnly) {
      query = query.is('unlinked_at', null);
    }

    const { data, error: dbError } = await query;
    if (dbError) return handleError(dbError);
    return success(data);
});

/**
 * POST /api/v1/entity-assets
 * Creates a new entity-asset link.
 * Body: { project_id, source_type, source_id, item_id, quantity?, link_type?, allocation_id?, asset_instance_id?, notes? }
 */
export const POST = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const supabase = await createClient();
    const body = await request.json();

    const {
      project_id,
      source_type,
      source_id,
      item_id,
      quantity = 1,
      link_type = 'assigned',
      allocation_id,
      asset_instance_id,
      notes,
    } = body;

    if (!project_id || !source_type || !source_id || !item_id) {
      return error('project_id, source_type, source_id, and item_id are required' , 400);
    }

    const { data, error: dbError } = await supabase
      .from('entity_asset_links')
      .insert({
        project_id,
        source_type,
        source_id,
        item_id,
        quantity,
        link_type,
        allocation_id,
        asset_instance_id,
        linked_by: user.id,
        notes,
      })
      .select(`
        *,
        advance_items (id, name, manufacturer, model)
      `)
      .single();

    if (dbError) return handleError(dbError);
    return success(data, undefined, 201);
});
