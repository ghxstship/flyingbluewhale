import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { EmptyState } from "@/components/ui/EmptyState";
import { KIcon } from "@/components/mobile/kit";
import { CheckInControls } from "./CheckInControls";
import { ShiftNoteForm } from "./ShiftNoteForm";
import { CorrectionRequest } from "./CorrectionRequest";

export const dynamic = "force-dynamic";

type EntryRow = {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  zone_id: string | null;
  break_open_at?: string | null;
};

/**
 * /m/clock — the personal time clock. Reads the caller's open entry (if
 * any) to drive the running counter, the matching zone name, and recent
 * history. The face + clock-in/out CTA is the client `CheckInControls`;
 * each history row carries a `ShiftNoteForm` to log a note against it, and
 * a closed row carries a `CorrectionRequest` so a worker who clocked in
 * wrong can propose a fix for their supervisor to approve.
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

  // The open entry (running counter) and the recent history are independent
  // reads — run them in parallel rather than two serial round trips.
  const [{ data: open }, { data: recent }] = await Promise.all([
    supabase
      .from("time_entries")
      .select("id, started_at, ended_at, duration_minutes, zone_id, break_open_at")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId)
      // Exclude per-task timer entries — the clock face tracks shift punches.
      .neq("activity_category", "task")
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("time_entries")
      .select("id, started_at, ended_at, duration_minutes, zone_id")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId)
      .neq("activity_category", "task")
      .order("started_at", { ascending: false })
      .limit(20),
  ]);
  const openEntry = (open ?? null) as EntryRow | null;
  const history = (recent ?? []) as EntryRow[];

  type NoteRow = {
    id: string;
    time_entry_id: string;
    author_id: string | null;
    body: string;
    as_manager: boolean;
    created_at: string;
  };
  const zoneIds = Array.from(
    new Set([openEntry?.zone_id, ...history.map((e) => e.zone_id)].filter(Boolean) as string[]),
  );
  const entryIds = history.map((e) => e.id);

  // Zone names, shift notes, and open corrections all depend only on the
  // entries above and are independent of one another — fire them as one
  // parallel batch instead of three serial round trips.
  const [zonesRes, notesRes, corrRes] = await Promise.all([
    zoneIds.length
      ? supabase.from("time_clock_zones").select("id, name").eq("org_id", session.orgId).in("id", zoneIds)
      : null,
    entryIds.length
      ? supabase
          .from("shift_notes")
          .select("id, time_entry_id, author_id, body, as_manager, created_at")
          .eq("org_id", session.orgId)
          .in("time_entry_id", entryIds)
          .is("deleted_at", null)
          .order("created_at", { ascending: true })
          .limit(500)
      : null,
    entryIds.length
      ? supabase
          .from("time_entry_corrections")
          .select("time_entry_id, correction_kind")
          .eq("org_id", session.orgId)
          .eq("requester_id", session.userId)
          .eq("correction_state", "requested")
          .in("time_entry_id", entryIds)
      : null,
  ]);

  const zoneMap = new Map<string, string>();
  for (const z of (zonesRes?.data ?? []) as Array<{ id: string; name: string | null }>) {
    if (z.name) zoneMap.set(z.id, z.name);
  }
  const zoneNameFor = (id: string | null) => (id ? (zoneMap.get(id) ?? null) : null);

  // Shift notes, grouped by entry, with author names hydrated from `users`
  // (the only genuinely dependent read — it needs the note authors first).
  const noteRows = (notesRes?.data ?? []) as NoteRow[];
  const notesByEntry = new Map<string, NoteRow[]>();
  const authorIds = Array.from(new Set(noteRows.map((n) => n.author_id).filter(Boolean) as string[]));
  const authorMap = new Map<string, string>();
  if (authorIds.length) {
    const { data: users } = await supabase.from("users").select("id, name, email").in("id", authorIds);
    for (const u of (users ?? []) as Array<{ id: string; name: string | null; email: string | null }>) {
      authorMap.set(u.id, u.name ?? u.email ?? "");
    }
  }
  for (const n of noteRows) {
    const list = notesByEntry.get(n.time_entry_id) ?? [];
    list.push(n);
    notesByEntry.set(n.time_entry_id, list);
    (n as NoteRow & { authorName?: string }).authorName = n.author_id ? (authorMap.get(n.author_id) ?? "") : "";
  }

  // Open correction requests for the visible entries, so a shift already
  // under review shows that instead of offering a second request (the DB's
  // partial unique index would refuse it anyway).
  const pendingCorrectionByEntry = new Map<string, string>();
  for (const c of (corrRes?.data ?? []) as Array<{ time_entry_id: string | null; correction_kind: string }>) {
    if (c.time_entry_id) pendingCorrectionByEntry.set(c.time_entry_id, c.correction_kind);
  }

  const onShift = openEntry != null;
  const onBreak = openEntry?.break_open_at != null;

  // Kit 32 E4 — shift-fatigue nudge. Honest server read: hours elapsed on the
  // currently-open entry. A long single shift is a real safety signal (>10h),
  // so surface a break reminder; nothing is fabricated — no open entry, no
  // nudge, and the count is the entry's own elapsed time.
  const FATIGUE_HOURS = 10;
  const openHours = openEntry ? (Date.now() - new Date(openEntry.started_at).getTime()) / 3_600_000 : 0;
  const fatigued = openEntry != null && openHours >= FATIGUE_HOURS;
  const fatigueHours = Math.floor(openHours);

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">
        {onBreak
          ? t("m.clock.onBreak", undefined, "On Break")
          : onShift
            ? t("m.clock.onClock", undefined, "On The Clock")
            : t("m.clock.offShift", undefined, "Off Shift")}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.clock.title", undefined, "Time Clock")}
      </h1>

      <CheckInControls
        openSince={openEntry?.started_at ?? null}
        onBreakSince={openEntry?.break_open_at ?? null}
        zoneName={zoneNameFor(openEntry?.zone_id ?? null)}
      />

      {fatigued && (
        <div
          className="ps-alert ps-alert--warn"
          role="status"
          style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}
        >
          <KIcon name="Coffee" size={16} style={{ flex: "none" }} />
          <span>
            {t(
              "m.clock.fatigue",
              { hours: fatigueHours },
              `You've been clocked in for over ${fatigueHours} hours. Take a break when you can.`,
            )}
          </span>
        </div>
      )}

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
              {(() => {
                const notes = notesByEntry.get(e.id) ?? [];
                if (!notes.length) return null;
                return (
                  <div style={{ marginTop: 10 }}>
                    {notes.map((n) => {
                      const author = (n as { authorName?: string }).authorName || "";
                      const meta = [
                        author,
                        n.as_manager ? t("m.clock.asManager", undefined, "As Manager") : null,
                        `${fmt.date(n.created_at)} · ${fmt.time(n.created_at)}`,
                      ]
                        .filter(Boolean)
                        .join(" · ");
                      return (
                        <div className="item" key={n.id} style={{ alignItems: "flex-start" }}>
                          <span
                            className="bar"
                            style={{ background: n.as_manager ? "var(--p-warning)" : "var(--p-border)" }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="t" style={{ whiteSpace: "pre-wrap" }}>{n.body}</div>
                            <div className="s">{meta}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              <div style={{ marginTop: 10 }}>
                <ShiftNoteForm entryId={e.id} entryLabel={label} />
              </div>
              {/* A running shift has nothing to correct yet — clock out first. */}
              {!active && (
                <CorrectionRequest
                  entryId={e.id}
                  startedAt={e.started_at}
                  endedAt={e.ended_at}
                  pendingKind={pendingCorrectionByEntry.get(e.id) ?? null}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
