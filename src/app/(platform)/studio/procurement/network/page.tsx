import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { VERDICT_BADGE, VERDICT_LABELS, type EligibilityVerdict } from "@/lib/subcontractor";

export const dynamic = "force-dynamic";

type Verdict = { vendor_id: string; trade: string; verdict: EligibilityVerdict };
type NetRow = { id: string; name: string; trades: { trade: string; verdict: EligibilityVerdict }[]; worst: EligibilityVerdict };

const RANK: Record<EligibilityVerdict, number> = { blocked: 2, expiring: 1, eligible: 0 };

export default async function NetworkPage() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const [{ data: vendors }, { data: elig }] = await Promise.all([
    supabase.from("vendors").select("id, name").eq("org_id", session.orgId).limit(500),
    supabase.from("v_sub_eligibility").select("vendor_id, trade, verdict").eq("org_id", session.orgId),
  ]);

  const eligByVendor = new Map<string, Verdict[]>();
  for (const e of (elig ?? []) as Verdict[]) {
    const list = eligByVendor.get(e.vendor_id) ?? [];
    list.push(e);
    eligByVendor.set(e.vendor_id, list);
  }

  const rows: NetRow[] = ((vendors ?? []) as { id: string; name: string | null }[])
    .map((v) => {
      const trades = (eligByVendor.get(v.id) ?? []).map((e) => ({ trade: e.trade, verdict: e.verdict }));
      const worst = trades.reduce<EligibilityVerdict>(
        (acc, x) => (RANK[x.verdict] > RANK[acc] ? x.verdict : acc),
        "eligible",
      );
      return { id: v.id, name: v.name ?? "Vendor", trades, worst };
    })
    .sort((a, b) => RANK[b.worst] - RANK[a.worst]);

  const withTrades = rows.filter((r) => r.trades.length > 0);
  const eligible = withTrades.filter((r) => r.worst === "eligible").length;
  const blocked = withTrades.filter((r) => r.worst === "blocked").length;

  const columns: Column<NetRow>[] = [
    { key: "name", header: t("console.procurement.network.col.sub", undefined, "Subcontractor"), render: (r) => r.name },
    {
      key: "trades",
      header: t("console.procurement.network.col.trades", undefined, "Trades & eligibility"),
      render: (r) =>
        r.trades.length === 0 ? (
          <span className="text-[var(--p-text-3)]">—</span>
        ) : (
          <span className="flex flex-wrap gap-1">
            {r.trades.map((x) => (
              <Badge key={x.trade} variant={VERDICT_BADGE[x.verdict]}>
                {x.trade}
              </Badge>
            ))}
          </span>
        ),
    },
    {
      key: "status",
      header: t("console.procurement.network.col.status", undefined, "Standing"),
      render: (r) => <Badge variant={VERDICT_BADGE[r.worst]}>{VERDICT_LABELS[r.worst]}</Badge>,
    },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.network.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.network.title", undefined, "Subcontractor Network")}
        subtitle={t(
          "console.procurement.network.subtitle",
          undefined,
          "Your outside trade crews as external companies, ranked by compliance standing.",
        )}
      />
      <div className="metric-grid mb-6">
        <MetricCard label={t("console.procurement.network.total", undefined, "Subs")} value={String(rows.length)} />
        <MetricCard label={t("console.procurement.network.eligible", undefined, "Eligible")} value={String(eligible)} />
        <MetricCard label={t("console.procurement.network.blocked", undefined, "Blocked")} value={String(blocked)} />
      </div>
      <DataTable
        rows={rows}
        columns={columns}
        rowHref={(r) => `/studio/procurement/vendors/${r.id}`}
        emptyLabel={t("console.procurement.network.empty", undefined, "No subcontractors yet")}
      />
    </>
  );
}
