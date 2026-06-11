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
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("p.media.transport.eyebrowShort", undefined, "Portal")}
          title={t("p.media.transport.fallbackTitle", undefined, "Media Transport")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("p.media.transport.configureSupabase", undefined, "Configure Supabase.")}
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
      "id, fleet, vehicle_ref, run_state, scheduled_depart, scheduled_arrive, origin:origin_venue_id(name), destination:destination_venue_id(name)",
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
        eyebrow={t("p.media.transport.eyebrow", undefined, "Portal · Media")}
        title={t("p.media.transport.title", undefined, "Transport")}
        subtitle={
          runs.length === 1
            ? t(
                "p.media.transport.subtitleSingular",
                { count: runs.length, upcoming },
                `${runs.length} Run · ${upcoming} Active`,
              )
            : t(
                "p.media.transport.subtitlePlural",
                { count: runs.length, upcoming },
                `${runs.length} Runs · ${upcoming} Active`,
              )
        }
        breadcrumbs={[
          { label: t("p.media.transport.breadcrumb.portal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.media.transport.breadcrumb.media", undefined, "Media"), href: `/p/${slug}/media` },
          { label: t("p.media.transport.breadcrumb.transport", undefined, "Transport") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.media.transport.metrics.activeRuns", undefined, "Active Runs")}
            value={fmtIntl.number(upcoming)}
            accent={upcoming > 0}
          />
          <MetricCard
            label={t("p.media.transport.metrics.total", undefined, "Total")}
            value={fmtIntl.number(runs.length)}
          />
          <MetricCard label={t("p.media.transport.metrics.fleet", undefined, "Fleet")} value="T2 / Media" />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">{t("p.media.transport.schedule.heading", undefined, "Schedule")}</h3>
          {runs.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t("p.media.transport.schedule.empty", undefined, "No media shuttle runs scheduled.")}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--p-border)]">
              {runs.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">
                      {r.origin?.name ?? "—"} → {r.destination?.name ?? "—"}
                    </div>
                    <div className="font-mono text-[10px] text-[var(--p-text-2)]">
                      {r.fleet.toUpperCase()} · {fmt(r.scheduled_depart)}
                      {r.vehicle_ref ? ` · ${r.vehicle_ref}` : ""}
                    </div>
                  </div>
                  <Badge variant={toneFor(r.status)}>{toTitle(r.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
