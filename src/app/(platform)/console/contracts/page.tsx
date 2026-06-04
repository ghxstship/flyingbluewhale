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

type Row = {
  id: string;
  number: string;
  code: string | null;
  title: string;
  kind: string;
  state: string;
  billing_method: string | null;
  counterparty_name: string | null;
  total_value_minor: number | null;
  total_value_currency: string | null;
  original_amount_minor: number | null;
  revised_amount_minor: number | null;
  paid_to_date_minor: number;
  retainage_pct: number | null;
  end_date: string | null;
  project: { name: string | null } | null;
};

const STATE_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  draft: "muted",
  in_review: "warning",
  negotiation: "warning",
  awaiting_signatures: "info",
  active: "success",
  expiring: "warning",
  expired: "muted",
  terminated: "error",
  renewed: "success",
  archived: "muted",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ scope?: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.contracts.eyebrow", undefined, "Procurement")}
          title={t("console.contracts.title", undefined, "Contracts")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.contracts.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();
  const sp = await searchParams;
  // 'construction' (billing_method IS NOT NULL) | 'all' (default).
  const scope = sp.scope === "construction" ? "construction" : "all";

  let query = supabase
    .from("contracts")
    .select(
      "id, number, code, title, kind, state, billing_method, counterparty_name, total_value_minor, total_value_currency, original_amount_minor, revised_amount_minor, paid_to_date_minor, retainage_pct, end_date, project:project_id(name)",
    )
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (scope === "construction") {
    query = query.not("billing_method", "is", null);
  }
  const { data } = await query.order("created_at", { ascending: false }).limit(300);

  const rows = (data ?? []) as unknown as Row[];

  const constructionRows = rows.filter((r) => r.billing_method != null);
  const activeCount = rows.filter((r) => r.state === "active").length;
  const constructionActiveCount = constructionRows.filter((r) => r.state === "active").length;
  const totalActiveMinor = rows
    .filter((r) => r.state === "active")
    .reduce((s, r) => s + Number(r.revised_amount_minor ?? r.total_value_minor ?? 0), 0);
  const paidYtdMinor = rows.reduce((s, r) => s + Number(r.paid_to_date_minor ?? 0), 0);

  function fmtMoney(minor: number): string {
    return fmt.money(minor);
  }

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.contracts.eyebrow", undefined, "Procurement")}
        title={t("console.contracts.title", undefined, "Contracts")}
        subtitle={t(
          "console.contracts.subtitle",
          {
            count: rows.length,
            contractWord:
              rows.length === 1
                ? t("console.contracts.contractWordSingular", undefined, "contract")
                : t("console.contracts.contractWordPlural", undefined, "contracts"),
            construction: constructionRows.length,
            active: activeCount,
            value: fmtMoney(totalActiveMinor),
          },
          `${rows.length} ${rows.length === 1 ? "contract" : "contracts"} (${constructionRows.length} construction-PM) · ${activeCount} active · ${fmtMoney(totalActiveMinor)} active value`,
        )}
        action={
          <Button href="/console/contracts/new" size="sm">
            {t("console.contracts.newContract", undefined, "+ New Contract")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.contracts.metrics.activeAll", undefined, "Active (all)")}
            value={fmt.number(activeCount)}
            accent
          />
          <MetricCard
            label={t("console.contracts.metrics.activeConstruction", undefined, "Active (Construction)")}
            value={fmt.number(constructionActiveCount)}
          />
          <MetricCard
            label={t("console.contracts.metrics.paidYtd", undefined, "Paid YTD")}
            value={fmtMoney(paidYtdMinor)}
          />
        </div>
        <div className="flex items-center justify-end gap-1 text-xs">
          <a
            href="?scope=all"
            className={`rounded border border-[var(--border-color)] px-2 py-1 ${scope === "all" ? "bg-[var(--surface-raised)] text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}
            aria-current={scope === "all" ? "true" : undefined}
          >
            {t("console.contracts.scope.all", undefined, "All")}
          </a>
          <a
            href="?scope=construction"
            className={`rounded border border-[var(--border-color)] px-2 py-1 ${scope === "construction" ? "bg-[var(--surface-raised)] text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}
            aria-current={scope === "construction" ? "true" : undefined}
          >
            {t("console.contracts.scope.constructionOnly", undefined, "Construction Only")}
          </a>
        </div>
        <div className="text-[10px] text-[var(--text-muted)]">
          {t(
            "console.contracts.descriptionLine1",
            undefined,
            "Unified contracts surface — engagement (sponsor / vendor / talent / MSA / NDA / venue / rental) and construction-PM (prime / sub / consultant). Six billing methods supported: lump sum, T&M, cost-plus-fee, cost-plus-GMP, unit price, milestone. Retainage + NTE + allowance + bond tracked inline.",
          )}
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/contracts/${r.id}`}
          emptyLabel={t("console.contracts.emptyLabel", undefined, "No contracts yet")}
          emptyDescription={t(
            "console.contracts.emptyDescription",
            undefined,
            "One canonical contracts surface across engagement + construction-PM domains.",
          )}
          emptyAction={
            <Button href="/console/contracts/new" size="sm">
              {t("console.contracts.newContract", undefined, "+ New Contract")}
            </Button>
          }
          columns={[
            {
              key: "code",
              header: t("console.contracts.columns.code", undefined, "Code"),
              render: (r) => r.code ?? r.number,
              accessor: (r) => r.code ?? r.number,
              className: "font-mono text-xs",
            },
            {
              key: "title",
              header: t("console.contracts.columns.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "kind",
              header: t("console.contracts.columns.kind", undefined, "Kind"),
              render: (r) => toTitle(r.kind.replace(/_/g, " ")),
              accessor: (r) => r.kind,
              filterable: true,
              groupable: true,
              className: "text-xs",
            },
            {
              key: "counterparty",
              header: t("console.contracts.columns.counterparty", undefined, "Counterparty"),
              render: (r) => r.counterparty_name ?? "—",
              accessor: (r) => r.counterparty_name,
            },
            {
              key: "billing",
              header: t("console.contracts.columns.billing", undefined, "Billing"),
              render: (r) => (r.billing_method ? toTitle(r.billing_method.replace(/_/g, " ")) : "—"),
              accessor: (r) => r.billing_method,
              filterable: true,
              groupable: true,
              className: "text-xs",
            },
            {
              key: "value",
              header: t("console.contracts.columns.value", undefined, "Value"),
              render: (r) =>
                fmtMoney(Number(r.revised_amount_minor ?? r.original_amount_minor ?? r.total_value_minor ?? 0)),
              accessor: (r) => Number(r.revised_amount_minor ?? r.original_amount_minor ?? r.total_value_minor ?? 0),
              className: "font-mono text-xs text-right",
            },
            {
              key: "paid",
              header: t("console.contracts.columns.paid", undefined, "Paid"),
              render: (r) => fmtMoney(Number(r.paid_to_date_minor ?? 0)),
              accessor: (r) => Number(r.paid_to_date_minor ?? 0),
              className: "font-mono text-xs text-right",
            },
            {
              key: "retainage",
              header: t("console.contracts.columns.retainage", undefined, "Ret %"),
              render: (r) => (r.retainage_pct != null ? `${Number(r.retainage_pct).toFixed(1)}%` : "—"),
              accessor: (r) => r.retainage_pct,
              className: "font-mono text-xs text-right",
            },
            {
              key: "state",
              header: t("console.contracts.columns.state", undefined, "State"),
              render: (r) => (
                <Badge variant={STATE_TONE[r.state] ?? "muted"}>{toTitle(r.state.replace(/_/g, " "))}</Badge>
              ),
              accessor: (r) => r.state,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
