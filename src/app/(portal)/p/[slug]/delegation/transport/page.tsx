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
          eyebrow={t("p.delegation.transport.eyebrowShort", undefined, "Portal")}
          title={t("p.delegation.transport.title", undefined, "Transport")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("p.delegation.transport.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
  // Delegations get T1 (Olympic Family) and T2 (IF + media) runs.
  const { data } = await supabase
    .from("dispatch_runs")
    .select(
      "id, fleet, vehicle_ref, run_state, scheduled_depart, scheduled_arrive, origin:origin_venue_id(name), destination:destination_venue_id(name)",
    )
    .eq("org_id", session.orgId)
    .in("fleet", ["t1", "t2"])
    .order("scheduled_depart", { ascending: true })
    .limit(200);

  const runs = ((data ?? []) as unknown as Run[]) ?? [];
  const upcoming = runs.filter((r) => r.status === "scheduled" || r.status === "in_transit").length;
  const t1 = runs.filter((r) => r.fleet === "t1").length;
  const t2 = runs.filter((r) => r.fleet === "t2").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.delegation.transport.eyebrow", undefined, "Portal · Delegation")}
        title={t("p.delegation.transport.title", undefined, "Transport")}
        subtitle={
          runs.length === 1
            ? t("p.delegation.transport.subtitleOne", { upcoming }, `${runs.length} Run · ${upcoming} Active`)
            : t(
                "p.delegation.transport.subtitleMany",
                { count: runs.length, upcoming },
                `${runs.length} Runs · ${upcoming} Active`,
              )
        }
        breadcrumbs={[
          { label: t("p.delegation.transport.crumbPortal", undefined, "Portal"), href: `/p/${slug}` },
          {
            label: t("p.delegation.transport.crumbDelegation", undefined, "Delegation"),
            href: `/p/${slug}/delegation`,
          },
          { label: t("p.delegation.transport.crumbTransport", undefined, "Transport") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label={t("p.delegation.transport.t1Runs", undefined, "T1 Runs")} value={fmtIntl.number(t1)} />
          <MetricCard label={t("p.delegation.transport.t2Runs", undefined, "T2 Runs")} value={fmtIntl.number(t2)} />
          <MetricCard
            label={t("p.delegation.transport.active", undefined, "Active")}
            value={fmtIntl.number(upcoming)}
            accent={upcoming > 0}
          />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">{t("p.delegation.transport.schedule", undefined, "Schedule")}</h3>
          {runs.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t(
                "p.delegation.transport.empty",
                undefined,
                "No runs scheduled. Dispatch will publish closer to event.",
              )}
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
                  <Badge variant={toneFor(r.status)}>
                    {t(`p.delegation.transport.status.${r.status}`, undefined, toTitle(r.status))}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
