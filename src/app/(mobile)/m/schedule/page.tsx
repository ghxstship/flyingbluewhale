import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { CalendarView } from "@/components/views/CalendarView";
import { eventStatusTone, type CalendarEvent } from "@/lib/views/calendar";

export const dynamic = "force-dynamic";

/**
 * COMPVSS `/m/schedule` — read-only cross-project calendar for the field
 * user. Same generic <CalendarView> as the console and portal; events are
 * org-scoped and RLS-gated to what the viewer's membership can read.
 */
export default async function MobileSchedulePage() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">Configure Supabase.</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("events")
    .select("id, name, starts_at, ends_at, event_state")
    .eq("org_id", session.orgId)
    .order("starts_at", { ascending: true })
    .limit(500);

  const events: CalendarEvent[] = (
    (data ?? []) as Array<{ id: string; name: string; starts_at: string; ends_at: string | null; event_state: string }>
  ).map((e) => ({
    id: e.id,
    title: e.name,
    start: e.starts_at,
    end: e.ends_at ?? undefined,
    tone: eventStatusTone(e.event_state),
  }));

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">COMPVSS</div>
      <h1 className="mt-1 text-2xl font-semibold">Schedule</h1>
      <p className="mt-1 mb-4 text-xs text-[var(--p-text-2)]">Your events across every show.</p>
      <CalendarView events={events} initialMode="agenda" />
    </div>
  );
}
