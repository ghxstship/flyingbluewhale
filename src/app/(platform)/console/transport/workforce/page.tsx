import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type RunRow = {
  id: string;
  fleet: string;
  vehicle_ref: string | null;
  status: string;
  scheduled_depart: string;
  scheduled_arrive: string | null;
  origin: { name: string | null } | null;
  destination: { name: string | null } | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.transport.workforce.eyebrow", undefined, "Transport")}
          title={t("console.transport.workforce.title", undefined, "Workforce Shuttles")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.transport.workforce.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const fmtDay = (d: Date): string => fmt.dateParts(d, { weekday: "short", month: "short", day: "numeric" });
  const fmtTime = (iso: string): string => fmt.time(iso);
  // Window: today + next 3 days. Filter by workforce + spectator fleets
  // (the fleets that move crew + workforce, not VIPs/athletes).
  const today = new Date();
  const startOfWindow = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfWindow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3);

  const { data } = await supabase
    .from("dispatch_runs")
    .select(
      "id, fleet, vehicle_ref, status:run_state, scheduled_depart, scheduled_arrive, " +
        "origin:origin_venue_id(name), destination:destination_venue_id(name)",
    )
    .eq("org_id", session.orgId)
    .in("fleet", ["workforce", "t3", "spectator"])
    .gte("scheduled_depart", startOfWindow.toISOString())
    .lt("scheduled_depart", endOfWindow.toISOString())
    .order("scheduled_depart", { ascending: true });
  const runs = (data ?? []) as unknown as RunRow[];

  // Group by day
  const byDay = runs.reduce<Map<string, RunRow[]>>((map, r) => {
    const k = new Date(r.scheduled_depart).toDateString();
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(r);
    return map;
  }, new Map());
  const days = Array.from(byDay.entries()).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.transport.workforce.eyebrow", undefined, "Transport")}
        title={t("console.transport.workforce.title", undefined, "Workforce Shuttles")}
        subtitle={
          runs.length === 1
            ? t(
                "console.transport.workforce.subtitleOne",
                { count: runs.length },
                `${runs.length} Run Across Workforce + T3 + spectator fleets, next 3 days`,
              )
            : t(
                "console.transport.workforce.subtitleOther",
                { count: runs.length },
                `${runs.length} Runs Across Workforce + T3 + spectator fleets, next 3 days`,
              )
        }
        action={
          <Button href="/console/transport/dispatch/new" size="sm">
            {t("console.transport.workforce.scheduleRun", undefined, "+ Schedule run")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        {days.length === 0 ? (
          <EmptyState
            title={t("console.transport.workforce.empty.title", undefined, "No Workforce Shuttles Scheduled")}
            description={t(
              "console.transport.workforce.empty.description",
              undefined,
              "Workforce shuttles are dispatch_runs with fleet ∈ {workforce, t3, spectator}. Schedule a run from /console/transport/dispatch.",
            )}
            action={
              <Button href="/console/transport/dispatch/new" size="sm">
                {t("console.transport.workforce.scheduleRun", undefined, "+ Schedule run")}
              </Button>
            }
          />
        ) : (
          days.map(([day, dayRuns]) => (
            <section key={day} className="surface">
              <header className="flex items-center justify-between border-b border-[var(--p-border)] px-4 py-3">
                <h3 className="text-sm font-semibold">{fmtDay(new Date(day))}</h3>
                <Badge variant="muted">
                  {dayRuns.length === 1
                    ? t("console.transport.workforce.runCountOne", { count: dayRuns.length }, `${dayRuns.length} run`)
                    : t(
                        "console.transport.workforce.runCountOther",
                        { count: dayRuns.length },
                        `${dayRuns.length} runs`,
                      )}
                </Badge>
              </header>
              <table className="ps-table w-full text-sm">
                <thead>
                  <tr>
                    <th>{t("console.transport.workforce.col.depart", undefined, "Depart")}</th>
                    <th>{t("console.transport.workforce.col.arrive", undefined, "Arrive")}</th>
                    <th>{t("console.transport.workforce.col.from", undefined, "From")}</th>
                    <th>{t("console.transport.workforce.col.to", undefined, "To")}</th>
                    <th>{t("console.transport.workforce.col.fleet", undefined, "Fleet")}</th>
                    <th>{t("console.transport.workforce.col.vehicle", undefined, "Vehicle")}</th>
                    <th>{t("console.transport.workforce.col.status", undefined, "Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {dayRuns.map((r) => (
                    <tr key={r.id}>
                      <td className="font-mono text-xs">{fmtTime(r.scheduled_depart)}</td>
                      <td className="font-mono text-xs">{r.scheduled_arrive ? fmtTime(r.scheduled_arrive) : "—"}</td>
                      <td>{r.origin?.name ?? "—"}</td>
                      <td>{r.destination?.name ?? "—"}</td>
                      <td>
                        <Badge variant="muted">{toTitle(r.fleet)}</Badge>
                      </td>
                      <td className="font-mono text-xs">{r.vehicle_ref ?? "—"}</td>
                      <td>
                        <Badge variant={toneFor(r.status)}>{toTitle(r.status)}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))
        )}
      </div>
    </>
  );
}
