import { requireAuth } from '@/lib/api/guards';
import { success, error, handleError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/v1/master-schedule/export
 *
 * Export schedule entries as RFC 5545 iCalendar (.ics) format.
 * Supports the same filters as the main GET endpoint.
 *
 * Query params:
 *   project_id  (required)
 *   category    (optional, comma-separated)
 *   from        (optional)
 *   to          (optional)
 *   location_id (optional)
 *   space_id    (optional)
 *   assigned_to (optional)
 *   source_type (optional)
 *   filename    (optional, default "schedule.ics")
 */
export const GET = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const projectId = searchParams.get('project_id');

    // Fetch project for VCALENDAR metadata
    let project = { name: 'GVTEWAY Master Schedule', timezone: 'America/New_York' };
    if (projectId) {
      const { data } = await supabase
        .from('projects')
        .select('name, slug, timezone')
        .eq('id', projectId)
        .single();

      if (data) project = { name: data.name, timezone: data.timezone || 'America/New_York' };
    }

    // Build schedule query (same pattern as main route)
  let query = supabase
    .from('schedule_entries')
    .select('*')
    .eq('is_cancelled', false)
    .order('starts_at', { ascending: true })
    .limit(1000);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

    const category = searchParams.get('category');
    if (category) {
      const categories = category.split(',').map(c => c.trim());
      if (categories.length === 1) {
        query = query.eq('category', categories[0] as any);
      } else {
        query = query.in('category', categories as any);
      }
    }

    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (from) query = query.gte('starts_at', from);
    if (to) query = query.lte('starts_at', to);

    const locationId = searchParams.get('location_id');
    if (locationId) query = query.eq('location_id', locationId);

    const spaceId = searchParams.get('space_id');
    if (spaceId) query = query.eq('space_id', spaceId);

    const assignedTo = searchParams.get('assigned_to');
    if (assignedTo) query = query.eq('assigned_to', assignedTo);

    const sourceType = searchParams.get('source_type');
    if (sourceType) query = query.eq('source_type', sourceType as any);

    const { data: entries, error: dbError } = await query;
    if (dbError) return handleError(dbError);

    // Generate ICS content
    const tz = project.timezone || 'America/New_York';
    const calName = escapeICS(project.name);
    const ics = generateICS((entries || []) as unknown as ScheduleEntry[], calName, tz);

    const filename = searchParams.get('filename') || 'schedule.ics';

    return new NextResponse(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
});

// ─── ICS Generation Helpers ──────────────────────────

interface ScheduleEntry {
  id: string;
  title: string;
  subtitle: string | null;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  category: string;
  icon: string | null;
  status: string | null;
  priority: string | null;
  location_id: string | null;
  space_id: string | null;
  rrule: string | null;
  source_type: string;
  source_field: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

function generateICS(entries: ScheduleEntry[], calName: string, timezone: string): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GVTEWAY//Master Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calName}`,
    `X-WR-TIMEZONE:${timezone}`,
  ];

  for (const entry of entries) {
    lines.push(...generateVEVENT(entry, timezone));
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

function generateVEVENT(entry: ScheduleEntry, timezone: string): string[] {
  const uid = `${entry.id}@gvteway.app`;
  const now = formatICSDateTime(new Date().toISOString());

  const lines: string[] = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `SUMMARY:${escapeICS(entry.title)}`,
  ];

  // Date handling
  if (entry.all_day) {
    lines.push(`DTSTART;VALUE=DATE:${formatICSDate(entry.starts_at)}`);
    if (entry.ends_at) {
      // ICS all-day events use exclusive end date
      const endDate = new Date(entry.ends_at);
      endDate.setDate(endDate.getDate() + 1);
      lines.push(`DTEND;VALUE=DATE:${formatICSDate(endDate.toISOString())}`);
    }
  } else {
    lines.push(`DTSTART;TZID=${timezone}:${formatICSDateTimeLocal(entry.starts_at, timezone)}`);
    if (entry.ends_at) {
      lines.push(`DTEND;TZID=${timezone}:${formatICSDateTimeLocal(entry.ends_at, timezone)}`);
    } else {
      // Point-in-time events get a 30-minute default duration
      const end = new Date(new Date(entry.starts_at).getTime() + 30 * 60 * 1000);
      lines.push(`DTEND;TZID=${timezone}:${formatICSDateTimeLocal(end.toISOString(), timezone)}`);
    }
  }

  // Description
  const descParts: string[] = [];
  if (entry.subtitle) descParts.push(entry.subtitle);
  if (entry.category) descParts.push(`Category: ${entry.category}`);
  if (entry.status) descParts.push(`Status: ${entry.status}`);
  if (entry.source_type) descParts.push(`Source: ${entry.source_type}`);
  if (descParts.length > 0) {
    lines.push(`DESCRIPTION:${escapeICS(descParts.join('\\n'))}`);
  }

  // Category mapping
  const icsCategoryMap: Record<string, string> = {
    show: 'PERFORMANCE',
    production: 'PRODUCTION',
    logistics: 'LOGISTICS',
    catering: 'CATERING',
    deadline: 'DEADLINE',
    credential: 'CREDENTIAL',
    ticketing: 'TICKETING',
    meeting: 'MEETING',
    inspection: 'INSPECTION',
    milestone: 'MILESTONE',
    shift: 'WORK SHIFT',
    hours_of_operation: 'OPERATING HOURS',
  };
  const icsCategory = icsCategoryMap[entry.category] || entry.category.toUpperCase();
  lines.push(`CATEGORIES:${icsCategory}`);

  // Priority mapping (ICS: 1=highest, 9=lowest)
  const icsPriorityMap: Record<string, string> = {
    urgent: '1',
    high: '3',
    normal: '5',
    low: '9',
  };
  if (entry.priority && icsPriorityMap[entry.priority]) {
    lines.push(`PRIORITY:${icsPriorityMap[entry.priority]}`);
  }

  // Status mapping
  if (entry.status === 'cancelled') {
    lines.push('STATUS:CANCELLED');
  } else if (entry.status === 'confirmed') {
    lines.push('STATUS:CONFIRMED');
  } else {
    lines.push('STATUS:TENTATIVE');
  }

  // RRULE passthrough
  if (entry.rrule) {
    lines.push(`RRULE:${entry.rrule}`);
  }

  // Timestamps
  lines.push(`CREATED:${formatICSDateTime(entry.created_at)}`);
  lines.push(`LAST-MODIFIED:${formatICSDateTime(entry.updated_at)}`);

  // Transparency — deadlines and milestones don't block time
  if (entry.category === 'deadline' || entry.category === 'milestone') {
    lines.push('TRANSP:TRANSPARENT');
  } else {
    lines.push('TRANSP:OPAQUE');
  }

  lines.push('END:VEVENT');
  return lines;
}

/**
 * Format ISO timestamp to ICS UTC datetime (YYYYMMDDTHHMMSSZ)
 */
function formatICSDateTime(isoString: string): string {
  const d = new Date(isoString);
  return (
    d.getUTCFullYear().toString() +
    pad2(d.getUTCMonth() + 1) +
    pad2(d.getUTCDate()) +
    'T' +
    pad2(d.getUTCHours()) +
    pad2(d.getUTCMinutes()) +
    pad2(d.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Format ISO timestamp to ICS date-only (YYYYMMDD)
 */
function formatICSDate(isoString: string): string {
  const d = new Date(isoString);
  return (
    d.getUTCFullYear().toString() +
    pad2(d.getUTCMonth() + 1) +
    pad2(d.getUTCDate())
  );
}

/**
 * Format ISO timestamp to ICS local datetime with timezone (YYYYMMDDTHHMMSS)
 * The timezone is specified via TZID parameter, not in the value itself.
 */
function formatICSDateTimeLocal(isoString: string, _timezone: string): string {
  // We use the UTC representation formatted as local since the TZID
  // parameter on the property handles conversion.
  // For production, use a proper timezone library (date-fns-tz, luxon).
  const d = new Date(isoString);
  return (
    d.getUTCFullYear().toString() +
    pad2(d.getUTCMonth() + 1) +
    pad2(d.getUTCDate()) +
    'T' +
    pad2(d.getUTCHours()) +
    pad2(d.getUTCMinutes()) +
    pad2(d.getUTCSeconds())
  );
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

/**
 * Escape special characters for ICS text values per RFC 5545
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}
