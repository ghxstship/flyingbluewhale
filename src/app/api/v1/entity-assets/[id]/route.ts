import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { apiError, apiOk } from '@/lib/api/api-response';

/**
 * PATCH /api/v1/entity-assets/[id]
 * Transitions a link's state (assigned → checked_out → returned)
 * or soft-unlinks it.
 * Body: { link_type? } or { unlink: true }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return apiError('Unauthorized', 401);

    // Soft-unlink: set unlinked_at timestamp
    if (body.unlink) {
      const { data, error: dbError } = await supabase
        .from('entity_asset_links')
        .update({
          unlinked_at: new Date().toISOString(),
          unlinked_by: user.id,
        })
        .eq('id', id)
        .is('unlinked_at', null) // Guard: only unlink active links
        .select()
        .single();

      if (dbError) return apiError(dbError.message, 400);
      return apiOk(data);
    }

    // Transition link_type
    const { link_type, notes } = body as { link_type?: string; notes?: string };
    if (!link_type) {
      return apiError('link_type or unlink required', 400);
    }

    const { data, error: dbError } = await supabase
      .from('entity_asset_links')
      .update({
        link_type,
        ...(notes !== undefined && { notes }),
      })
      .eq('id', id)
      .is('unlinked_at', null) // Guard: only transition active links
      .select()
      .single();

    if (dbError) return apiError(dbError.message, 400);
    return apiOk(data);
  } catch {
    return apiError('Authentication required', 401);
  }
}

/**
 * DELETE /api/v1/entity-assets/[id]
 * Hard-deletes a link. Use PATCH { unlink: true } for soft-unlink.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    void request;
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return apiError('Unauthorized', 401);

    const {  error: dbError } = await supabase
      .from('entity_asset_links')
      .delete()
      .eq('id', id);

    if (dbError) return apiError(dbError.message, 400);
    return apiOk({ success: true });
  } catch {
    return apiError('Authentication required', 401);
  }
}
