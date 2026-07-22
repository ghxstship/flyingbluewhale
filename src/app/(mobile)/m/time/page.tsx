import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT, getRequestFormatters } from "@/lib/i18n/request";
import { formatMinutes } from "@/lib/db/timesheets";
import { TimeView, type TimeRow } from "./TimeView";

/**
 * COMPVSS · Time — kit 28 `time` (More hub → Time).
 *
 * "Your hours & shift records." Distinct from `/m/clock`, which is the kit's
 * Time Clock: clock is the ACT (punch in/out, geofence, break), this is the
 * RECORD (what you worked, with the note attached to each entry).
 *
 * Self-scoped by `user_id`, explicitly: `time_entries` RLS is org-readable, so
 * a colleague's hours are one missing predicate away — the same shape as the
 * /m/requests leak (audit D6).
 */
export const dynamic = "force-dynamic";

export default async function TimePage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("m.time.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();
  const fmt = await getRequestFormatters();
  const supabase = await createClient();

  const { data } = await supabase
    .from("time_entries")
    .select("id, started_at, ended_at, duration_minutes, description, activity_category, billable, shift_id, source_channel")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .order("started_at", { ascending: false })
    .limit(100);

  type Row = {
    id: string;
    started_at: string;
    ended_at: string | null;
    duration_minutes: number | null;
    description: string | null;
    activity_category: string | null;
    billable: boolean;
    shift_id: string | null;
    source_channel: string | null;
  };

  const rows: TimeRow[] = ((data ?? []) as Row[]).map((e) => ({
    id: e.id,
    day: fmt.date(e.started_at),
    span: `${fmt.dateParts(new Date(e.started_at), { hour: "2-digit", minute: "2-digit", hour12: false })} → ${
      e.ended_at ? fmt.dateParts(new Date(e.ended_at), { hour: "2-digit", minute: "2-digit", hour12: false }) : "—"
    }`,
    // An entry with no end is the shift you are standing in right now. Say so
    // rather than rendering a 0h duration.
    duration: e.ended_at ? formatMinutes(e.duration_minutes) : t("m.time.running", undefined, "Running"),
    durationMin: e.duration_minutes ?? 0,
    open: !e.ended_at,
    category: e.activity_category,
    note: e.description,
    billable: e.billable,
    fromShift: Boolean(e.shift_id),
    // Provenance worth the worker's eye: an entry a manager keyed, corrected,
    // imported, or that replayed from offline — 'app' (their own live punch)
    // stays quiet.
    source: e.source_channel && e.source_channel !== "app" ? e.source_channel : null,
  }));

  const totalMinutes = ((data ?? []) as Row[]).reduce((n, e) => n + (e.duration_minutes ?? 0), 0);

  return (
    <TimeView
      rows={rows}
      eyebrow={t("m.time.eyebrow", { total: formatMinutes(totalMinutes) }, `${formatMinutes(totalMinutes)} Logged`)}
      title={t("m.time.title", undefined, "My Time")}
    />
  );
}
