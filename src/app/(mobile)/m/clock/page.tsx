import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { EmptyState } from "@/components/ui/EmptyState";
import { CheckInControls } from "./CheckInControls";
import { ShiftNoteForm } from "./ShiftNoteForm";

export const dynamic = "force-dynamic";

type EntryRow = {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  zone_id: string | null;
};

/**
 * /m/clock — the personal time clock. Reads the caller's open entry (if
 * any) to drive the running counter, the matching zone name, and recent
 * history. The face + clock-in/out CTA is the client `CheckInControls`;
 * each history row carries a `ShiftNoteForm` to log a note against it.
 */
export default async function MobileClockPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.clock.eyebrow", undefined, "Field")}</div>
        <h1 className="scr-h">{t("m.clock.title", undefined, "Time Clock")}</h1>
        <p className="form-intro">{t("m.clock.configureSupabase", undefined, "Configure Supabase.")}</p>
      </div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  // The currently-open entry drives the running counter.
  const { data: open } = await supabase
    .from("time_entries")
    .select("id, started_at, ended_at, duration_minutes, zone_id")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const openEntry = (open ?? null) as EntryRow | null;

  // Recent history (closed + open), newest first.
  const { data: recent } = await supabase
    .from("time_entries")
    .select("id, started_at, ended_at, duration_minutes, zone_id")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .order("started_at", { ascending: false })
    .limit(20);
  const history = (recent ?? []) as EntryRow[];

  // Resolve zone names for everything we'll show.
  const zoneIds = Array.from(
    new Set([openEntry?.zone_id, ...history.map((e) => e.zone_id)].filter(Boolean) as string[]),
  );
  const zoneMap = new Map<string, string>();
  if (zoneIds.length) {
    const { data: zones } = await supabase
      .from("time_clock_zones")
      .select("id, name")
      .eq("org_id", session.orgId)
      .in("id", zoneIds);
    for (const z of (zones ?? []) as Array<{ id: string; name: string | null }>) {
      if (z.name) zoneMap.set(z.id, z.name);
    }
  }
  const zoneNameFor = (id: string | null) => (id ? (zoneMap.get(id) ?? null) : null);

  const onShift = openEntry != null;

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">
        {onShift ? t("m.clock.onClock", undefined, "On The Clock") : t("m.clock.offShift", undefined, "Off Shift")}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.clock.title", undefined, "Time Clock")}
      </h1>

      <CheckInControls
        openSince={openEntry?.started_at ?? null}
        zoneName={zoneNameFor(openEntry?.zone_id ?? null)}
      />

      <div className="sech">
        <h2>{t("m.clock.recent", undefined, "Recent")}</h2>
      </div>

      {history.length === 0 ? (
        <EmptyState
          size="compact"
          title={t("m.clock.empty.title", undefined, "No Entries Yet")}
          description={t("m.clock.empty.body", undefined, "Clock in to start tracking your time.")}
        />
      ) : (
        history.map((e) => {
          const active = e.ended_at == null;
          const hours = e.duration_minutes != null ? (e.duration_minutes / 60).toFixed(1) : null;
          const zone = zoneNameFor(e.zone_id);
          const label = `${fmt.date(e.started_at)} · ${fmt.time(e.started_at)}`;
          return (
            <div className="item" key={e.id} style={{ display: "block" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="bar" style={{ background: active ? "var(--p-success)" : "var(--p-border)" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t">{label}</div>
                  <div className="s">
                    {fmt.time(e.started_at)}
                    {" – "}
                    {e.ended_at ? fmt.time(e.ended_at) : t("m.clock.now", undefined, "now")}
                    {zone ? ` · ${zone}` : ""}
                    {hours ? ` · ${t("m.clock.hours", { hours }, `${hours} hrs`)}` : ""}
                  </div>
                </div>
                <span className={`ps-badge ps-badge--${active ? "ok" : "neutral"}`}>
                  {active ? t("m.clock.active", undefined, "Active") : t("m.clock.closed", undefined, "Closed")}
                </span>
              </div>
              <div style={{ marginTop: 10 }}>
                <ShiftNoteForm entryId={e.id} entryLabel={label} />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
