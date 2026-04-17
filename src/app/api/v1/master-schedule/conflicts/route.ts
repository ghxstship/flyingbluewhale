import { NextRequest } from "next/server";
import { withAuth, apiError, apiOk } from '@/lib/api/api-response';

/**
 * POST /api/v1/master-schedule/conflicts
 *
 * Detect schedule conflicts for a proposed time window.
 * Returns all non-cancelled schedule entries that overlap the given window.
 *
 * Body:
 *   project_id  (required)
 *   starts_at   (required, ISO 8601)
 *   ends_at     (required, ISO 8601)
 *   location_id (optional — scope conflicts to a specific location)
 *   space_id    (optional — scope conflicts to a specific space)
 *   exclude_id  (optional — exclude a specific schedule entry from results)
 */
export const POST = withAuth(async (request, user, supabase) => {
    const body = await request.json();

    if (!body.project_id || !body.starts_at || !body.ends_at) {
      return apiError('project_id, starts_at, and ends_at required' , 400);
    }

    // Use the detect_schedule_conflicts RPC function
    const { data, error: dbError } = await supabase.rpc('detect_schedule_conflicts', {
      p_project_id: body.project_id,
      p_starts_at: body.starts_at,
      p_ends_at: body.ends_at,
      p_location_id: body.location_id || null,
      p_space_id: body.space_id || null,
      p_exclude_id: body.exclude_id || null,
    });

    if (dbError) return apiError(dbError.message, 400);

    return apiOk({
      has_conflicts: Array.isArray(data) && data.length > 0,
      conflict_count: Array.isArray(data) ? data.length : 0,
      conflicts: data,
    });
});
