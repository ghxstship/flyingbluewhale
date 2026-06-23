import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type DispatchRow = {
  id: string;
  fleet: string;
  vehicle_ref: string | null;
  status: string;
  scheduled_depart: string;
  scheduled_arrive: string | null;
  actual_depart: string | null;
  actual_arrive: string | null;
  manifest: unknown;
  origin: { name: string | null } | null;
  destination: { name: string | null } | null;
  driver: { name: string | null; email: string | null } | null;
};

const FLEET_LABEL: Record<string, string> = {
  t1: "T1 — Family of the Olympic Family",
  t2: "T2 — IFs and accredited media",
  t3: "T3 — Workforce shuttle",
  media: "Media",
  workforce: "Workforce",
  spectator: "Spectator",
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function manifestLength(raw: unknown): number {
  return Array.isArray(raw) ? raw.length : 0;
}

export default async function Page({ params }: { params: Promise<{ dispatchId: string }> }) {
  const { dispatchId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.production.dispatch.detail.eyebrow", undefined, "Production")}
          title={t("console.production.dispatch.detail.title", undefined, "Dispatch Run")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.production.dispatch.detail.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
  const { data } = await supabase
    .from("dispatch_runs")
    .select(
      "id, fleet, vehicle_ref, status:run_state, scheduled_depart, scheduled_arrive, actual_depart, actual_arrive, manifest, " +
        "origin:origin_venue_id(name), destination:destination_venue_id(name), driver:driver_id(name, email)",
    )
    .eq("id", dispatchId)
    .eq("org_id", session.orgId)
    .maybeSingle();

  const run = data as unknown as DispatchRow | null;
  if (!run) notFound();

  const passengers = manifestLength(run.manifest);
  const tone = toneFor(run.status);

  let onTimeNote = "";
  if (run.actual_depart && run.scheduled_depart) {
    const diffMin = Math.round(
      (new Date(run.actual_depart).getTime() - new Date(run.scheduled_depart).getTime()) / 60_000,
    );
    if (diffMin > 0)
      onTimeNote = t("console.production.dispatch.detail.minutesLate", { minutes: diffMin }, `${diffMin}m late`);
    else if (diffMin < 0)
      onTimeNote = t(
        "console.production.dispatch.detail.minutesEarly",
        { minutes: Math.abs(diffMin) },
        `${Math.abs(diffMin)}m early`,
      );
    else onTimeNote = t("console.production.dispatch.detail.onTime", undefined, "On time");
  }
  const onTimeLabel = t("console.production.dispatch.detail.onTime", undefined, "On time");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.dispatch.detail.eyebrow", undefined, "Production")}
        title={`${run.origin?.name ?? "—"} → ${run.destination?.name ?? "—"}`}
        subtitle={
          <span className="font-mono text-xs">
            {FLEET_LABEL[run.fleet] ?? run.fleet}
            {run.vehicle_ref ? ` · ${run.vehicle_ref}` : ""}
          </span>
        }
        breadcrumbs={[
          { label: t("console.production.breadcrumb", undefined, "Production"), href: "/studio/production" },
          {
            label: t("console.production.dispatch.breadcrumb", undefined, "Dispatch"),
            href: "/studio/production/dispatch",
          },
          { label: run.id.slice(0, 8) },
        ]}
        action={<Badge variant={tone}>{toTitle(run.status)}</Badge>}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.production.dispatch.detail.metric.passengers", undefined, "Passengers")}
            value={fmtIntl.number(passengers)}
          />
          <MetricCard
            label={t("console.production.dispatch.detail.metric.driver", undefined, "Driver")}
            value={
              run.driver?.name ??
              run.driver?.email ??
              t("console.production.dispatch.detail.unassigned", undefined, "Unassigned")
            }
          />
          <MetricCard
            label={t("console.production.dispatch.detail.metric.onTime", undefined, "On-time")}
            value={onTimeNote || "—"}
            accent={onTimeNote === onTimeLabel}
          />
        </div>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">
            {t("console.production.dispatch.detail.scheduleHeading", undefined, "Schedule")}
          </h3>
          <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-[var(--p-text-2)]">
              {t("console.production.dispatch.detail.departScheduled", undefined, "Depart — Scheduled")}
            </dt>
            <dd className="font-mono text-xs">{fmt(run.scheduled_depart)}</dd>
            <dt className="text-[var(--p-text-2)]">
              {t("console.production.dispatch.detail.departActual", undefined, "Depart — Actual")}
            </dt>
            <dd className="font-mono text-xs">{fmt(run.actual_depart)}</dd>
            <dt className="text-[var(--p-text-2)]">
              {t("console.production.dispatch.detail.arriveScheduled", undefined, "Arrive — Scheduled")}
            </dt>
            <dd className="font-mono text-xs">{fmt(run.scheduled_arrive)}</dd>
            <dt className="text-[var(--p-text-2)]">
              {t("console.production.dispatch.detail.arriveActual", undefined, "Arrive — Actual")}
            </dt>
            <dd className="font-mono text-xs">{fmt(run.actual_arrive)}</dd>
          </dl>
        </section>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">
            {t("console.production.dispatch.detail.manifestHeading", undefined, "Manifest")}
          </h3>
          {passengers === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t("console.production.dispatch.detail.noPassengers", undefined, "No passengers on this run.")}
            </p>
          ) : (
            <pre className="mt-3 max-h-72 overflow-auto rounded bg-[var(--p-surface)] p-3 font-mono text-xs">
              {JSON.stringify(run.manifest, null, 2)}
            </pre>
          )}
        </section>
      </div>
    </>
  );
}
