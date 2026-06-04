import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type ConsolidationMethod = "full" | "equity" | "proportional" | "none";
type ConsolidationState = "active" | "divested" | "dormant" | "pending";

type Row = {
  id: string;
  legal_name: string;
  short_code: string;
  base_currency: string;
  jurisdiction: string | null;
  tax_id: string | null;
  consolidation_method: ConsolidationMethod;
  ownership_pct: number;
  consolidation_state: ConsolidationState;
  effective_from: string;
  effective_to: string | null;
  parent_entity_id: string | null;
  created_at: string;
};

const STATE_TONE: Record<ConsolidationState, "muted" | "info" | "warning" | "success"> = {
  active: "success",
  pending: "info",
  dormant: "muted",
  divested: "warning",
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.finance.entities.eyebrow", undefined, "Finance")}
          title={t("console.finance.entities.title", undefined, "Legal Entities")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.finance.entities.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("org_entities")
    .select(
      "id, legal_name, short_code, base_currency, jurisdiction, tax_id, consolidation_method, ownership_pct, consolidation_state, effective_from, effective_to, parent_entity_id, created_at",
    )
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];
  const active = rows.filter((r) => r.consolidation_state === "active").length;
  const currencies = new Set(rows.map((r) => r.base_currency)).size;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.entities.eyebrow", undefined, "Finance")}
        title={t("console.finance.entities.title", undefined, "Legal Entities")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.finance.entities.entitySingular", undefined, "Entity") : t("console.finance.entities.entityPlural", undefined, "Entities")} · ${active} ${t("console.finance.entities.active", undefined, "Active")} · ${currencies} ${currencies === 1 ? t("console.finance.entities.baseCurrencySingular", undefined, "Base Currency") : t("console.finance.entities.baseCurrencyPlural", undefined, "Base Currencies")}`}
        action={
          <Button href="/console/finance/entities/new" size="sm">
            {t("console.finance.entities.newEntity", undefined, "+ New Entity")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-4">
          <MetricCard
            label={t("console.finance.entities.metricTotal", undefined, "Total")}
            value={fmt.number(rows.length)}
            accent
          />
          <MetricCard
            label={t("console.finance.entities.metricActive", undefined, "Active")}
            value={fmt.number(active)}
          />
          <MetricCard
            label={t("console.finance.entities.metricCurrencies", undefined, "Currencies")}
            value={fmt.number(currencies)}
          />
          <MetricCard
            label={t("console.finance.entities.metricSubsidiaries", undefined, "Subsidiaries")}
            value={fmt.number(rows.filter((r) => r.parent_entity_id).length)}
          />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/finance/entities/${r.id}`}
          emptyLabel={t("console.finance.entities.emptyLabel", undefined, "No legal entities yet")}
          emptyDescription={t(
            "console.finance.entities.emptyDescription",
            undefined,
            "One org may operate multiple legal entities. Create one per LLC / Ltd / Pty / subsidiary; financial-impact rows (invoices, expenses, pay-apps) carry the entity_id + an FX-snapshot column for cross-currency consolidation.",
          )}
          emptyAction={
            <Button href="/console/finance/entities/new" size="sm">
              {t("console.finance.entities.newEntity", undefined, "+ New Entity")}
            </Button>
          }
          columns={[
            {
              key: "legal_name",
              header: t("console.finance.entities.colLegalName", undefined, "Legal Name"),
              render: (r) => <span className="font-medium">{r.legal_name}</span>,
            },
            {
              key: "short_code",
              header: t("console.finance.entities.colCode", undefined, "Code"),
              render: (r) => <span className="font-mono text-xs">{r.short_code}</span>,
            },
            {
              key: "base_currency",
              header: t("console.finance.entities.colBaseCcy", undefined, "Base CCY"),
              render: (r) => <span className="font-mono text-xs">{r.base_currency}</span>,
            },
            {
              key: "jurisdiction",
              header: t("console.finance.entities.colJurisdiction", undefined, "Jurisdiction"),
              render: (r) => r.jurisdiction ?? "—",
            },
            {
              key: "method",
              header: t("console.finance.entities.colMethod", undefined, "Method"),
              render: (r) => toTitle(r.consolidation_method),
            },
            {
              key: "ownership",
              header: t("console.finance.entities.colOwnership", undefined, "Ownership"),
              render: (r) => `${Number(r.ownership_pct).toFixed(2)}%`,
            },
            {
              key: "state",
              header: t("console.finance.entities.colState", undefined, "State"),
              render: (r) => (
                <Badge variant={STATE_TONE[r.consolidation_state]}>{toTitle(r.consolidation_state)}</Badge>
              ),
            },
          ]}
        />
      </div>
    </>
  );
}
