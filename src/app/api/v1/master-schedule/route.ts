import { NextRequest } from "next/server";
import { withAuth, apiError, apiOk, apiCreated } from '@/lib/api/api-response';

/**
 * GET /api/v1/master-schedule
 *
 * Unified schedule query — returns projected schedule entries
 * with optional category filtering, date windowing, and location scoping.
 *
 * Query params:
 *   project_id  (required)
 *   category    (optional, comma-separated: "show,logistics,deadline")
 *   from        (optional, ISO 8601 timestamptz)
 *   to          (optional, ISO 8601 timestamptz)
 *   location_id (optional)
 *   space_id    (optional)
 *   assigned_to (optional)
 *   source_type (optional)
 *   include_cancelled (optional, "true" to include cancelled entries)
 *   include_recurring (optional, "false" to exclude recurrence instances)
 *   limit       (optional, default 500)
 *
 * Response includes `project_timezone` for client-side toggle rendering.
 */
export const GET = withAuth(async (request, user, supabase) => {
    const { searchParams } = new URL(request.url);

    const projectId = searchParams.get('project_id');
    if (!projectId) {
      return apiError('project_id required' , 400);
    }

    // Fetch project timezone for toggle support
    const { data: project } = await supabase
      .from('projects')
      .select('timezone')
      .eq('id', projectId)
      .single();

    let query = supabase
      .from('schedule_entries')
      .select(`
        *,
        projects!inner ( name, slug, timezone ),
        locations ( name ),
        spaces ( name ),
        profiles:assigned_to ( full_name )
      `)
      .eq('project_id', projectId)
      .order('starts_at', { ascending: true });

    // Category filter (supports comma-separated list)
    const category = searchParams.get('category');
    if (category) {
      const categories = category.split(',').map(c => c.trim());
      if (categories.length === 1) {
        query = query.eq('category', categories[0] as any);
      } else {
        query = query.in('category', categories as any);
      }
    }

    // Date windowing
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (from) query = query.gte('starts_at', from);
    if (to) query = query.lte('starts_at', to);

    // Location / space scoping
    const locationId = searchParams.get('location_id');
    if (locationId) query = query.eq('location_id', locationId);

    const spaceId = searchParams.get('space_id');
    if (spaceId) query = query.eq('space_id', spaceId);

    // Assignee filter
    const assignedTo = searchParams.get('assigned_to');
    if (assignedTo) query = query.eq('assigned_to', assignedTo);

    // Source type filter
    const sourceType = searchParams.get('source_type');
    if (sourceType) query = query.eq('source_type', sourceType as any);

    // Exclude cancelled by default
    const includeCancelled = searchParams.get('include_cancelled');
    if (includeCancelled !== 'true') {
      query = query.eq('is_cancelled', false);
    }

    // Optionally filter out recurrence template entries (show only instances)
    const includeRecurring = searchParams.get('include_recurring');
    if (includeRecurring === 'false') {
      query = query.is('rrule', null);
    }

    // Priority filter
    const priority = searchParams.get('priority');
    if (priority) query = query.eq('priority', priority);

    // Limit
    const limit = parseInt(searchParams.get('limit') || '500', 10);
    query = query.limit(Math.min(limit, 1000));

    const { data, error: dbError } = await query;
    if (dbError) return apiError(dbError.message, 400);
    return apiOk({
      data,
      project_timezone: project?.timezone || 'America/New_York',
    });
});

/**
 * POST /api/v1/master-schedule
 *
 * Create a manual schedule entry (source_type = 'manual').
 * These are entries not backed by any existing entity — meetings,
 * trainings, inspections, work shifts, milestones, etc.
 */
export const POST = withAuth(async (request, user, supabase) => {
    const body = await request.json();

    if (!body.project_id || !body.title || !body.starts_at || !body.category) {
      return apiError('project_id, title, starts_at, and category required' , 400);
    }

    const { data, error: dbError } = await supabase.from('schedule_entries').insert({
      project_id: body.project_id,
      source_type: 'manual',
      source_id: null,
      source_field: body.source_field || 'manual_' + Date.now(),
      starts_at: body.starts_at,
      ends_at: body.ends_at || null,
      all_day: body.all_day || false,
      category: body.category,
      title: body.title,
      subtitle: body.subtitle || null,
      icon: body.icon || null,
      color: body.color || null,
      location_id: body.location_id || null,
      space_id: body.space_id || null,
      assigned_to: body.assigned_to || null,
      priority: body.priority || 'normal',
      visibility: body.visibility || ['internal'],
      metadata: body.metadata || {},
      rrule: body.rrule || null,
      rrule_until: body.rrule_until || null,
    }).select().single();

    if (dbError) return apiError(dbError.message, 400);

    // If RRULE provided, expand recurrence instances via RPC
    let recurrence_count = 0;
    if (body.rrule && body.occurrences && Array.isArray(body.occurrences) && data) {
      const { data: count } = await supabase.rpc('expand_recurrence', {
        p_parent_id: data.id,
        p_occurrences: body.occurrences,
      });
      recurrence_count = count || 0;
    }

    // Optionally create custom reminders
    if (body.reminders && Array.isArray(body.reminders) && data) {
      for (const reminder of body.reminders) {
        await supabase.from('schedule_reminders').insert({
          schedule_entry_id: data.id,
          lead_minutes: reminder.lead_minutes || 60,
          channel: reminder.channel || 'in_app',
          recipient_id: reminder.recipient_id || body.assigned_to || user.id,
        });
      }
    }

    return apiCreated({ data, recurrence_count });
});

/**
 * PATCH /api/v1/master-schedule
 *
 * Update a manual schedule entry. Only manual entries can be edited
 * directly — projected entries are updated via their source triggers.
 */
export const PATCH = withAuth(async (request, user, supabase) => {
    const body = await request.json();

    if (!body.id) return apiError('id required' , 400);

    // Verify this is a manual entry
    const { data: existing } = await supabase
      .from('schedule_entries')
      .select('source_type')
      .eq('id', body.id)
      .single();

    if (!existing) return apiError('Not found' , 404);
    if (existing.source_type !== 'manual') {
      return apiError('Only manual schedule entries can be edited directly. Projected entries are updated via their source entity.' , 403);
    }

    const updates: Record<string, unknown> = {};
    const fields = [
      'starts_at', 'ends_at', 'all_day', 'category', 'title', 'subtitle',
      'icon', 'color', 'location_id', 'space_id', 'assigned_to', 'status',
      'is_cancelled', 'priority', 'visibility', 'metadata',
      'rrule', 'rrule_until',
    ];
    for (const f of fields) {
      if (body[f] !== undefined) updates[f] = body[f];
    }

    const { data, error: dbError } = await supabase
      .from('schedule_entries')
      .update(updates as any)
      .eq('id', body.id)
      .select()
      .single();

    if (dbError) return apiError(dbError.message, 400);
    return apiOk(data);
});

/**
 * DELETE /api/v1/master-schedule
 *
 * Delete a manual schedule entry. Projected entries cannot be deleted
 * directly — delete the source entity instead.
 */
export const DELETE = withAuth(async (request, user, supabase) => {
    const { searchParams } = new URL(request.url);

    const id = searchParams.get('id');
    if (!id) return apiError('id required' , 400);

    // Verify this is a manual entry
    const { data: existing } = await supabase
      .from('schedule_entries')
      .select('source_type')
      .eq('id', id)
      .single();

    if (!existing) return apiError('Not found' , 404);
    if (existing.source_type !== 'manual') {
      return apiError('Only manual schedule entries can be deleted directly. Projected entries are removed when their source entity is deleted.' , 403);
    }

    const {  error: dbError } = await supabase
      .from('schedule_entries')
      .delete()
      .eq('id', id);

    if (dbError) return apiError(dbError.message, 400);
    return apiOk({ success: true });
});
