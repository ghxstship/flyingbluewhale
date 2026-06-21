import Link from "next/link";
import { Clock } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT, getRequestFormatters } from "@/lib/i18n/request";
import { EmptyState } from "@/components/ui/EmptyState";
import { KIcon } from "@/components/mobile/kit";
import { PunchControls } from "./PunchControls";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Punch — a focused punch in/out surface backed by `time_entries`.
 * Reuses the clock's `CheckInControls` timer + `clockIn`/`clockOut` actions
 * (one open entry per user, server-enforced) and shows today's punches. The
 * full timesheet history lives at /m/clock.
 */
type EntryRow = {
  id: string;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
};

export default async function PunchPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();

  const { data: openRow } = await supabase
    .from("time_entries")
    .select("id, started_at")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { data: today } = await supabase
    .from("time_entries")
    .select("id, started_at, ended_at, duration_minutes")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .gte("started_at", startOfDay.toISOString())
    .order("started_at", { ascending: false })
    .limit(50);
  const entries = (today ?? []) as EntryRow[];

  const onClock = !!openRow;

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">
        {onClock ? t("m.punch.on", undefined, "On The Clock") : t("m.punch.off", undefined, "Off Shift")}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.punch.title", undefined, "Punch")}
      </h1>

      <PunchControls openStartedAt={(openRow?.started_at as string | undefined) ?? null} />

      <div className="sech" style={{ marginTop: 16 }}>
        <h2>{t("m.punch.today", undefined, "Today's Punches")}</h2>
      </div>
      {entries.length === 0 ? (
        <EmptyState
          icon={<Clock size={28} aria-hidden="true" />}
          title={t("m.punch.empty", undefined, "No Punches")}
          description={t("m.punch.emptyBody", undefined, "Punch in to start your shift.")}
        />
      ) : (
        entries.map((e) => {
          const ended = e.ended_at;
          const mins = e.duration_minutes;
          const hrs = mins != null ? `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, "0")}` : null;
          return (
            <div className="item" key={e.id}>
              <span className="bar" style={{ background: ended ? "var(--p-border)" : "var(--p-success)" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">
                  {e.started_at ? fmt.time(e.started_at) : "—"}
                  {" – "}
                  {ended ? fmt.time(ended) : t("m.punch.now", undefined, "now")}
                </div>
                <div className="s">{hrs ? `${hrs} ${t("m.punch.hrs", undefined, "hrs")}` : t("m.punch.open", undefined, "Open")}</div>
              </div>
              <span className={`ps-badge ps-badge--${ended ? "neutral" : "ok"}`} style={{ flex: "none" }}>
                {ended ? t("m.punch.closed", undefined, "Closed") : t("m.punch.active", undefined, "Active")}
              </span>
            </div>
          );
        })
      )}

      <Link
        href="/m/clock"
        className="ps-btn ps-btn--secondary ps-btn--lg"
        style={{ width: "100%", justifyContent: "center", marginTop: 16 }}
      >
        <KIcon name="History" size={16} /> {t("m.punch.fullClock", undefined, "Full Timesheet")}
      </Link>
    </div>
  );
}
