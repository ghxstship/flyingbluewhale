import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

const PULSE_LABEL: Record<number, string> = { 1: "Rough", 2: "Tough", 3: "OK", 4: "Good", 5: "Great" };
const PULSE_TONE: Record<number, "danger" | "warn" | "neutral" | "ok" | "ok"> = {
  1: "danger",
  2: "warn",
  3: "neutral",
  4: "ok",
  5: "ok",
};

type Row = {
  id: string;
  name: string;
  date: string;
  duration: string;
  rating: number;
  label: string;
  note: string | null;
};

/**
 * /studio/workforce/shift-pulse — admin view of team end-of-shift morale signals.
 * Deputy Shift Pulse+ parity (competitive feature 2026-06-29).
 */
export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.workforce.shiftPulse.eyebrow", undefined, "Workforce")}
          title={t("console.workforce.shiftPulse.title", undefined, "Shift Pulse")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.workforce.shiftPulse.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data: entries } = await supabase
    .from("time_entries")
    .select("id, user_id, started_at, duration_minutes, pulse_rating, pulse_note")
    .eq("org_id", session.orgId)
    .not("pulse_rating", "is", null)
    .not("ended_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(500);

  const raw = (entries ?? []) as Array<{
    id: string;
    user_id: string;
    started_at: string;
    duration_minutes: number | null;
    pulse_rating: number;
    pulse_note: string | null;
  }>;

  const userIds = Array.from(new Set(raw.map((e) => e.user_id)));
  const userMap = new Map<string, string>();
  if (userIds.length) {
    const { data: users } = await supabase.from("users").select("id, name, email").in("id", userIds);
    for (const u of (users ?? []) as Array<{ id: string; name: string | null; email: string | null }>) {
      userMap.set(u.id, u.name ?? u.email ?? "—");
    }
  }

  const rows: Row[] = raw.map((e) => ({
    id: e.id,
    name: userMap.get(e.user_id) ?? "—",
    date: `${fmt.date(e.started_at)} · ${fmt.time(e.started_at)}`,
    duration:
      e.duration_minutes != null ? `${(e.duration_minutes / 60).toFixed(1)} hrs` : "—",
    rating: e.pulse_rating,
    label: PULSE_LABEL[e.pulse_rating] ?? String(e.pulse_rating),
    note: e.pulse_note,
  }));

  const totalPulses = rows.length;
  const avgRating =
    totalPulses > 0
      ? (rows.reduce((s, r) => s + r.rating, 0) / totalPulses).toFixed(1)
      : "—";
  const lowMorale = rows.filter((r) => r.rating <= 2).length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.shiftPulse.eyebrow", undefined, "Workforce")}
        title={t("console.workforce.shiftPulse.title", undefined, "Shift Pulse")}
        subtitle={t(
          "console.workforce.shiftPulse.subtitle",
          { total: totalPulses },
          `${totalPulses} responses — end-of-shift morale signals from your crew`,
        )}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.workforce.shiftPulse.metric.total", undefined, "Responses")}
            value={fmt.number(totalPulses)}
          />
          <MetricCard
            label={t("console.workforce.shiftPulse.metric.avg", undefined, "Avg Rating")}
            value={avgRating}
            accent
          />
          <MetricCard
            label={t("console.workforce.shiftPulse.metric.lowMorale", undefined, "Low Morale (1–2)")}
            value={fmt.number(lowMorale)}
            trend={lowMorale > 0 ? ("down" as const) : undefined}
          />
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title={t("console.workforce.shiftPulse.empty.title", undefined, "No pulse signals yet")}
            description={t(
              "console.workforce.shiftPulse.empty.body",
              undefined,
              "Crew members submit a 1–5 rating when they clock out. Results appear here.",
            )}
          />
        ) : (
          <DataTable<Row>
            tableId="workforce.shift_pulse"
            rows={rows}
            emptyLabel={t("console.workforce.shiftPulse.empty.title", undefined, "No pulse signals yet")}
            columns={[
              {
                key: "name",
                header: t("console.workforce.shiftPulse.col.name", undefined, "Crew Member"),
                render: (r) => r.name,
                accessor: (r) => r.name,
                filterable: true,
              },
              {
                key: "date",
                header: t("console.workforce.shiftPulse.col.date", undefined, "Shift"),
                render: (r) => <span className="font-mono text-xs">{r.date}</span>,
                accessor: (r) => r.date,
              },
              {
                key: "duration",
                header: t("console.workforce.shiftPulse.col.duration", undefined, "Duration"),
                render: (r) => r.duration,
                accessor: (r) => r.duration,
              },
              {
                key: "rating",
                header: t("console.workforce.shiftPulse.col.rating", undefined, "Rating"),
                render: (r) => (
                  <Badge variant={PULSE_TONE[r.rating] ?? "neutral"}>
                    {r.rating} — {r.label}
                  </Badge>
                ),
                accessor: (r) => r.rating,
                filterable: true,
                groupable: true,
              },
              {
                key: "note",
                header: t("console.workforce.shiftPulse.col.note", undefined, "Note"),
                render: (r) => (
                  <span className="text-xs text-[var(--p-text-2)]">{r.note ?? "—"}</span>
                ),
                accessor: (r) => r.note ?? null,
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
