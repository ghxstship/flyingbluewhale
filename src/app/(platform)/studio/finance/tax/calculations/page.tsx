import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { listOrgScoped } from "@/lib/db/resource";
import { getRequestT } from "@/lib/i18n/request";
import { jurisdictionNameMap, categoryNameMap, formatRatePercent, formatMinorAsMoney } from "@/lib/tax/queries";

export const dynamic = "force-dynamic";

type TaxCalculation = {
  id: string;
  org_id: string;
  transaction_line_id: string | null;
  jurisdiction_id: string | null;
  category_code: string | null;
  rate: number | null;
  taxable_amount_minor: number | null;
  tax_amount_minor: number | null;
  currency: string | null;
  computed_at: string | null;
  source: string | null;
};

export default async function TaxCalculationsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.finance.tax.eyebrow", undefined, "Finance")}
          title={t("console.finance.tax.calculations.title", undefined, "Tax Calculations")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.finance.tax.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();

  const [rowsRaw, jMap, cMap] = await Promise.all([
    listOrgScoped("tax_calculations", session.orgId, { orderBy: "computed_at", ascending: false }),
    jurisdictionNameMap(),
    categoryNameMap(),
  ]);
  const rows = rowsRaw as TaxCalculation[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.tax.eyebrow", undefined, "Finance")}
        title={t("console.finance.tax.calculations.title", undefined, "Tax Calculations")}
        subtitle={t(
          "console.finance.tax.calculations.subtitle",
          { count: rows.length },
          `${rows.length} computed tax lines`,
        )}
        action={
          <Button href="/studio/finance/tax" size="sm" variant="secondary">
            {t("console.finance.tax.calculations.backToHub", undefined, "← Tax Reference")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<TaxCalculation>
          rows={rows}
          emptyLabel={t("console.finance.tax.calculations.empty", undefined, "No tax calculations yet")}
          emptyDescription={t(
            "console.finance.tax.calculations.emptyDescription",
            undefined,
            "Computed tax lines appear here as transactions are processed against the tax-rate reference.",
          )}
          columns={[
            {
              key: "jurisdiction",
              header: t("console.finance.tax.calculations.cols.jurisdiction", undefined, "Jurisdiction"),
              render: (r) => (r.jurisdiction_id ? (jMap.get(r.jurisdiction_id) ?? r.jurisdiction_id) : "—"),
              accessor: (r) => (r.jurisdiction_id ? (jMap.get(r.jurisdiction_id) ?? r.jurisdiction_id) : null),
            },
            {
              key: "category",
              header: t("console.finance.tax.calculations.cols.category", undefined, "Category"),
              render: (r) =>
                r.category_code ? (
                  <Badge variant="muted">{cMap.get(r.category_code) ?? r.category_code}</Badge>
                ) : (
                  "—"
                ),
              accessor: (r) => (r.category_code ? (cMap.get(r.category_code) ?? r.category_code) : null),
            },
            {
              key: "rate",
              header: t("console.finance.tax.calculations.cols.rate", undefined, "Rate"),
              render: (r) => formatRatePercent(r.rate),
              tabular: true,
              accessor: (r) => r.rate,
            },
            {
              key: "taxable",
              header: t("console.finance.tax.calculations.cols.taxable", undefined, "Taxable"),
              render: (r) => formatMinorAsMoney(r.taxable_amount_minor, r.currency),
              tabular: true,
              accessor: (r) => r.taxable_amount_minor,
            },
            {
              key: "tax",
              header: t("console.finance.tax.calculations.cols.tax", undefined, "Tax"),
              render: (r) => formatMinorAsMoney(r.tax_amount_minor, r.currency),
              tabular: true,
              accessor: (r) => r.tax_amount_minor,
            },
            {
              key: "source",
              header: t("console.finance.tax.calculations.cols.source", undefined, "Source"),
              render: (r) => r.source ?? "—",
              mono: true,
              accessor: (r) => r.source,
            },
            {
              key: "computed_at",
              header: t("console.finance.tax.calculations.cols.computedAt", undefined, "Computed"),
              render: (r) => (r.computed_at ? new Date(r.computed_at).toLocaleString() : "—"),
              className: "text-xs text-[var(--p-text-2)]",
              accessor: (r) => r.computed_at,
            },
          ]}
        />
      </div>
    </>
  );
}
