import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Run = {
  id: string;
  fleet: string;
  vehicle_ref: string | null;
  status: string;
  scheduled_depart: string;
  scheduled_arrive: string | null;
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

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Portal" title="Media Transport" />
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
      "id, fleet, vehicle_ref, status, scheduled_depart, scheduled_arrive, origin:origin_venue_id(name), destination:destination_venue_id(name)",
    )
    .eq("org_id", session.orgId)
    .in("fleet", ["t2", "media"])
    .order("scheduled_depart", { ascending: true })
    .limit(200);

  const runs = ((data ?? []) as unknown as Run[]) ?? [];
  const upcoming = runs.filter((r) => r.status !== "arrived" && r.status !== "cancelled").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Portal · Media"
        title="Transport"
        subtitle={`${runs.length} Run${runs.length === 1 ? "" : "s"} · ${upcoming} active`}
        breadcrumbs={[
          { label: "Portal", href: `/p/${slug}` },
          { label: "Media", href: `/p/${slug}/media` },
          { label: "Transport" },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Active Runs" value={fmtIntl.number(upcoming)} accent={upcoming > 0} />
          <MetricCard label="Total" value={fmtIntl.number(runs.length)} />
          <MetricCard label="Fleet" value="T2 / Media" />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Schedule</h3>
          {runs.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">No media shuttle runs scheduled.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--border-color)]">
              {runs.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">
                      {r.origin?.name ?? "—"} → {r.destination?.name ?? "—"}
                    </div>
                    <div className="font-mono text-[10px] text-[var(--text-muted)]">
                      {r.fleet.toUpperCase()} · {fmt(r.scheduled_depart)}
                      {r.vehicle_ref ? ` · ${r.vehicle_ref}` : ""}
                    </div>
                  </div>
                  <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{r.status.replace(/_/g, " ")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
