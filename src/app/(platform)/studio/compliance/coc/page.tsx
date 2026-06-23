import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { urlFor } from "@/lib/urls";

export const dynamic = "force-dynamic";

type AuditRow = {
  id: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  metadata: unknown;
  at: string;
  actor: { name: string | null; email: string | null } | null;
};

const COC_TARGETS = [
  "incidents",
  "incident_photos",
  "credentials",
  "deliverables",
  "assignment_events",
  "access_scans",
  "evidence_uploads",
];

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.compliance.coc.eyebrow", undefined, "Compliance")}
          title={t("console.compliance.coc.title", undefined, "Chain of Custody")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.compliance.coc.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: events }, { count: count24h }] = await Promise.all([
    supabase
      .from("audit_log")
      .select("id, action, target_table, target_id, metadata, at, actor:actor_id(name, email)")
      .eq("org_id", session.orgId)
      .in("target_table", COC_TARGETS)
      .gte("at", since30)
      .order("at", { ascending: false })
      .limit(500),
    supabase
      .from("audit_log")
      .select("*", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .in("target_table", COC_TARGETS)
      .gte("at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const rows = (events ?? []) as unknown as AuditRow[];

  const byTable = rows.reduce<Map<string, number>>((map, r) => {
    if (!r.target_table) return map;
    map.set(r.target_table, (map.get(r.target_table) ?? 0) + 1);
    return map;
  }, new Map());
  const tableEntries = Array.from(byTable.entries()).sort((a, b) => b[1] - a[1]);

  const distinctActors = new Set(rows.map((r) => r.actor?.email ?? r.actor?.name).filter(Boolean) as string[]);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.compliance.coc.eyebrow", undefined, "Compliance")}
        title={t("console.compliance.coc.title", undefined, "Chain of Custody")}
        subtitle={t("console.compliance.coc.subtitle", undefined, "Audit trail for evidence + samples.")}
        action={
          <Button href={urlFor("mobile", "/coc")} size="sm">
            {t("console.compliance.coc.mobileCapture", undefined, "Mobile capture")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.compliance.coc.metrics.events24h", undefined, "Events · 24h")}
            value={fmt.number(count24h ?? 0)}
            accent
          />
          <MetricCard
            label={t("console.compliance.coc.metrics.events30d", undefined, "Events · 30d")}
            value={fmt.number(rows.length)}
          />
          <MetricCard
            label={t("console.compliance.coc.metrics.distinctActors", undefined, "Distinct Actors")}
            value={fmt.number(distinctActors.size)}
          />
        </div>

        {tableEntries.length > 0 && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">{t("console.compliance.coc.byTarget", undefined, "By Target")}</h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 md:grid-cols-3">
              {tableEntries.map(([table, count]) => (
                <li key={table} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-xs">{table}</span>
                  <span className="text-xs text-[var(--p-text-2)]">{fmt.number(count)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3 className="text-sm font-semibold">
            {t("console.compliance.coc.recentEvents", undefined, "Recent Events")}
          </h3>
          {rows.length === 0 ? (
            <EmptyState
              size="compact"
              title={t("console.compliance.coc.empty.title", undefined, "No COC events in the last 30 days")}
              description={t(
                "console.compliance.coc.empty.description",
                undefined,
                "Custody events are auto-captured by the audit_log when evidence-bearing rows are created or modified.",
              )}
            />
          ) : (
            <ul className="mt-3 space-y-2">
              {rows.slice(0, 50).map((r) => (
                <li key={r.id} className="surface flex items-center justify-between p-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">
                      <span className="font-medium">
                        {r.actor?.name ?? r.actor?.email ?? t("console.compliance.coc.system", undefined, "system")}
                      </span>{" "}
                      <span className="text-[var(--p-text-2)]">{r.action.replace(/[._]/g, " ")}</span>{" "}
                      <Badge variant="muted">{r.target_table ?? "—"}</Badge>
                    </div>
                    {r.target_id && (
                      <div className="font-mono text-[10px] text-[var(--p-text-2)]">{r.target_id.slice(0, 8)}</div>
                    )}
                  </div>
                  <span className="font-mono text-xs text-[var(--p-text-2)]">{relativeTime(r.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
