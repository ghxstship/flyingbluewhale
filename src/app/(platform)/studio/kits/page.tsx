import { ModuleHeader } from "@/components/Shell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { listKitGroups, formatCents } from "@/lib/kits/queries";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.kits.eyebrow", undefined, "Production")}
          title={t("console.kits.title", undefined, "Event Kits")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.kits.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const groups = await listKitGroups(session.orgId);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.kits.eyebrow", undefined, "Production")}
        title={t("console.kits.title", undefined, "Event Kits")}
        subtitle={t(
          "console.kits.subtitle",
          { count: groups.length },
          `${groups.length} kit${groups.length === 1 ? "" : "s"} · seeded zones, lines, touchpoints & phase gates`,
        )}
      />
      <div className="page-content">
        {groups.length === 0 ? (
          <EmptyState
            title={t("console.kits.emptyTitle", undefined, "No kits yet")}
            description={t(
              "console.kits.emptyDescription",
              undefined,
              "Event kits bundle zones, line items, sensory touchpoints, and phase gates into a reusable production blueprint.",
            )}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => {
              const title = g.pkg?.name ?? `${t("console.kits.kit", undefined, "Kit")} ${g.kitId.slice(0, 8)}`;
              return (
                <Card key={g.kitId} href={`/studio/kits/${g.kitId}`} className="block p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-[var(--p-text-1)]">{title}</h3>
                      <p className="mt-0.5 font-mono text-[11px] text-[var(--p-text-2)]">
                        {g.pkg?.code ?? g.kitId.slice(0, 8)}
                      </p>
                    </div>
                    {g.pkg?.kit_scale && <Badge variant="muted">{g.pkg.kit_scale}</Badge>}
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <Stat label={t("console.kits.stat.zones", undefined, "Zones")} value={g.zoneCount} />
                    <Stat label={t("console.kits.stat.lines", undefined, "Lines")} value={g.lineCount} />
                    <Stat
                      label={t("console.kits.stat.touchpoints", undefined, "Touchpoints")}
                      value={g.touchpointCount}
                    />
                    <Stat
                      label={t("console.kits.stat.phaseGates", undefined, "Phase Gates")}
                      value={g.phaseGateCount}
                    />
                  </dl>

                  <div className="mt-4 border-t border-[var(--p-border)] pt-3">
                    <div className="text-[10px] tracking-wider text-[var(--p-text-2)] uppercase">
                      {t("console.kits.stat.totalEstimate", undefined, "Total Estimate")}
                    </div>
                    <div className="mt-0.5 font-mono text-base font-semibold text-[var(--p-text-1)] tabular-nums">
                      {formatCents(g.totalEstimateCents)}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-[10px] tracking-wider text-[var(--p-text-2)] uppercase">{label}</dt>
      <dd className="mt-0.5 font-mono text-sm font-semibold text-[var(--p-text-1)] tabular-nums">{value}</dd>
    </div>
  );
}
