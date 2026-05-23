import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

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

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  scheduled: "muted",
  in_transit: "info",
  arrived: "success",
  delayed: "warning",
  cancelled: "error",
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
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Production" title="Dispatch Run" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
      "id, fleet, vehicle_ref, status, scheduled_depart, scheduled_arrive, actual_depart, actual_arrive, manifest, " +
        "origin:origin_venue_id(name), destination:destination_venue_id(name), driver:driver_id(name, email)",
    )
    .eq("id", dispatchId)
    .eq("org_id", session.orgId)
    .maybeSingle();

  const run = data as unknown as DispatchRow | null;
  if (!run) notFound();

  const passengers = manifestLength(run.manifest);
  const tone = STATUS_TONE[run.status] ?? "muted";

  let onTimeNote = "";
  if (run.actual_depart && run.scheduled_depart) {
    const diffMin = Math.round(
      (new Date(run.actual_depart).getTime() - new Date(run.scheduled_depart).getTime()) / 60_000,
    );
    if (diffMin > 0) onTimeNote = `${diffMin}m late`;
    else if (diffMin < 0) onTimeNote = `${Math.abs(diffMin)}m early`;
    else onTimeNote = "On time";
  }

  return (
    <>
      <ModuleHeader
        eyebrow="Production"
        title={`${run.origin?.name ?? "—"} → ${run.destination?.name ?? "—"}`}
        subtitle={
          <span className="font-mono text-xs">
            {FLEET_LABEL[run.fleet] ?? run.fleet}
            {run.vehicle_ref ? ` · ${run.vehicle_ref}` : ""}
          </span>
        }
        breadcrumbs={[
          { label: "Production", href: "/console/production" },
          { label: "Dispatch", href: "/console/production/dispatch" },
          { label: run.id.slice(0, 8) },
        ]}
        action={<Badge variant={tone}>{run.status.replace(/_/g, " ")}</Badge>}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Passengers" value={fmtIntl.number(passengers)} />
          <MetricCard label="Driver" value={run.driver?.name ?? run.driver?.email ?? "Unassigned"} />
          <MetricCard label="On-time" value={onTimeNote || "—"} accent={onTimeNote === "On time"} />
        </div>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">Schedule</h3>
          <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-[var(--text-muted)]">Depart (scheduled)</dt>
            <dd className="font-mono text-xs">{fmt(run.scheduled_depart)}</dd>
            <dt className="text-[var(--text-muted)]">Depart (actual)</dt>
            <dd className="font-mono text-xs">{fmt(run.actual_depart)}</dd>
            <dt className="text-[var(--text-muted)]">Arrive (scheduled)</dt>
            <dd className="font-mono text-xs">{fmt(run.scheduled_arrive)}</dd>
            <dt className="text-[var(--text-muted)]">Arrive (actual)</dt>
            <dd className="font-mono text-xs">{fmt(run.actual_arrive)}</dd>
          </dl>
        </section>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">Manifest</h3>
          {passengers === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">No passengers on this run.</p>
          ) : (
            <pre className="mt-3 max-h-72 overflow-auto rounded bg-[var(--bg-secondary)] p-3 font-mono text-xs">
              {JSON.stringify(run.manifest, null, 2)}
            </pre>
          )}
        </section>
      </div>
    </>
  );
}
