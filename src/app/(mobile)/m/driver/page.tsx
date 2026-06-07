import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type RunRow = {
  id: string;
  fleet: string;
  vehicle_ref: string | null;
  status: string;
  scheduled_depart: string;
  scheduled_arrive: string | null;
  actual_depart: string | null;
  actual_arrive: string | null;
  origin: { name: string | null } | null;
  destination: { name: string | null } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  scheduled: "muted",
  in_transit: "info",
  arrived: "success",
  delayed: "warning",
  cancelled: "error",
};

export default async function MobileDriverPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("common.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const fmtTime = (iso: string): string => fmt.time(iso);
  const today = new Date();
  const startOfWindow = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfWindow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  const { data } = await supabase
    .from("dispatch_runs")
    .select(
      "id, fleet, vehicle_ref, status, scheduled_depart, scheduled_arrive, actual_depart, actual_arrive, " +
        "origin:origin_venue_id(name), destination:destination_venue_id(name)",
    )
    .eq("org_id", session.orgId)
    .eq("driver_id", session.userId)
    .gte("scheduled_depart", startOfWindow)
    .lt("scheduled_depart", endOfWindow)
    .order("scheduled_depart", { ascending: true });
  const runs = (data ?? []) as unknown as RunRow[];

  const upcoming = runs.filter((r) => !["arrived", "cancelled"].includes(r.status));
  const completed = runs.filter((r) => ["arrived", "cancelled"].includes(r.status));

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">
        {t("m.driver.eyebrow", undefined, "Mobile")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.driver.title", undefined, "Driver")}</h1>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        {t("m.driver.subtitle", undefined, "Today's runs assigned to you. Tap a run to view manifest + waypoints.")}
      </p>

      <section className="mt-6">
        <h2 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
          {t("m.driver.upcoming", undefined, "Upcoming")} · {upcoming.length}
        </h2>
        <ul className="mt-3 space-y-2">
          {upcoming.length === 0 ? (
            <li>
              <EmptyState
                size="compact"
                title={t("m.driver.empty.title", undefined, "No Runs Upcoming Today")}
                description={t(
                  "m.driver.empty.description",
                  undefined,
                  "Check back when dispatch schedules a run for you.",
                )}
              />
            </li>
          ) : (
            upcoming.map((r) => (
              <li key={r.id}>
                <Link href={`/m/driver/run/${r.id}`} className="surface flex items-start gap-3 p-4">
                  <div className="mt-0.5 flex flex-none flex-col items-center">
                    <span className="font-mono text-base font-semibold tabular-nums">
                      {fmtTime(r.scheduled_depart)}
                    </span>
                    <span className="mt-0.5 font-mono text-[10px] text-[var(--p-text-2)]">
                      {t("m.driver.depart", undefined, "depart")}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm leading-snug font-semibold">
                        {r.origin?.name ?? "—"} → {r.destination?.name ?? "—"}
                      </div>
                      <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{toTitle(r.status)}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1.5 font-mono text-[10px] text-[var(--p-text-2)]">
                      <span>{r.fleet}</span>
                      {r.vehicle_ref && <span>· {r.vehicle_ref}</span>}
                      {r.scheduled_arrive && (
                        <span>
                          · {t("m.driver.eta", undefined, "ETA")} {fmtTime(r.scheduled_arrive)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>

      {completed.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
            {t("m.driver.completed", undefined, "Completed")} · {completed.length}
          </h2>
          <ul className="mt-3 space-y-2">
            {completed.map((r) => (
              <li key={r.id} className="surface flex items-center justify-between p-3 opacity-70">
                <div className="text-sm">
                  <div className="font-medium">
                    {r.origin?.name ?? "—"} → {r.destination?.name ?? "—"}
                  </div>
                  <div className="font-mono text-xs text-[var(--p-text-2)]">
                    {r.actual_arrive
                      ? t(
                          "m.driver.arrivedAt",
                          { time: fmtTime(r.actual_arrive) },
                          `Arrived ${fmtTime(r.actual_arrive)}`,
                        )
                      : t("m.driver.cancelled", undefined, "Cancelled")}
                  </div>
                </div>
                <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{toTitle(r.status)}</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
