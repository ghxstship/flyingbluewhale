import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { CalendarView } from "@/components/views/CalendarView";
import { eventStatusTone, type CalendarEvent } from "@/lib/views/calendar";

export const dynamic = "force-dynamic";

/**
 * Portal `/p/[slug]/schedule` — read-only project calendar for any portal
 * persona on this show. Reuses the generic <CalendarView> (no reschedule /
 * create callbacks → read-only). Scoped to the slug's project; RLS gates
 * what the viewer's membership can read underneath.
 */
export default async function PortalSchedulePage({ params }: { params: Promise<{ slug: string }> }) {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">Configure Supabase.</div>;
  }
  const { slug } = await params;
  const session = await requireSession();
  const project = await projectIdFromSlug(slug);

  let events: CalendarEvent[] = [];
  if (project) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("events")
      .select("id, name, starts_at, ends_at, event_state")
      .eq("org_id", session.orgId)
      .eq("project_id", project.id)
      .order("starts_at", { ascending: true })
      .limit(500);
    events = ((data ?? []) as Array<{ id: string; name: string; starts_at: string; ends_at: string | null; event_state: string }>).map(
      (e) => ({
        id: e.id,
        title: e.name,
        start: e.starts_at,
        end: e.ends_at ?? undefined,
        tone: eventStatusTone(e.event_state),
      }),
    );
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">Schedule</div>
      <h1 className="mt-1 text-2xl font-semibold">{project?.name ?? "Schedule"}</h1>
      <p className="mt-1 mb-4 text-xs text-[var(--p-text-2)]">Events for this show, in your timezone.</p>
      <CalendarView events={events} initialMode="month" />
    </div>
  );
}
