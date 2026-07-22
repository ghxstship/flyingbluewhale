import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataView } from "@/components/views/DataViewServer";
import { CardHeader } from "@/components/ui/Card";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import {
  listTaxJurisdictions,
  listTaxRates,
  listWithholdingRules,
  jurisdictionNameMap,
  categoryNameMap,
  formatRatePercent,
  formatMinorAsMoney,
  type TaxJurisdiction,
  type TaxRate,
  type WithholdingRule,
} from "@/lib/tax/queries";

export const dynamic = "force-dynamic";

export default async function TaxHubPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.finance.tax.eyebrow", undefined, "Finance")}
          title={t("console.finance.tax.title", undefined, "Tax")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.finance.tax.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  // Org-gate the surface even though reference tables are global.
  await requireSession();

  const [jurisdictions, rates, withholding, jMap, cMap] = await Promise.all([
    listTaxJurisdictions(),
    listTaxRates(),
    listWithholdingRules(),
    jurisdictionNameMap(),
    categoryNameMap(),
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.tax.eyebrow", undefined, "Finance")}
        title={t("console.finance.tax.title", undefined, "Tax")}
        subtitle={t(
          "console.finance.tax.subtitle",
          { jurisdictions: jurisdictions.length, rates: rates.length },
          `${jurisdictions.length} jurisdictions · ${rates.length} rates · reference + computed tax`,
        )}
        action={
          <Button href="/studio/finance/tax/calculations" size="sm">
            {t("console.finance.tax.viewCalculations", undefined, "View Calculations")}
          </Button>
        }
      />
      <div className="page-content space-y-8">
        {/* Jurisdictions */}
        <section className="surface overflow-hidden">
          <CardHeader
            title={t("console.finance.tax.jurisdictions.title", undefined, "Jurisdictions")}
            subtitle={t(
              "console.finance.tax.jurisdictions.subtitle",
              undefined,
              "Tax authorities by country and region.",
            )}
          />
          <DataView<TaxJurisdiction>
            rows={jurisdictions}
            emptyLabel={t("console.finance.tax.jurisdictions.empty", undefined, "No jurisdictions defined")}
            emptyDescription={t(
              "console.finance.tax.jurisdictions.emptyDescription",
              undefined,
              "Reference tax jurisdictions are loaded globally. None are available yet.",
            )}
            columns={[
              {
                key: "code",
                header: t("console.finance.tax.jurisdictions.cols.code", undefined, "Code"),
                render: (r) => r.code,
                mono: true,
                accessor: (r) => r.code,
              },
              {
                key: "display_name",
                header: t("console.finance.tax.jurisdictions.cols.name", undefined, "Name"),
                render: (r) => r.display_name,
                accessor: (r) => r.display_name,
              },
              {
                key: "country",
                header: t("console.finance.tax.jurisdictions.cols.country", undefined, "Country"),
                render: (r) => r.country ?? "—",
                accessor: (r) => r.country,
              },
              {
                key: "region",
                header: t("console.finance.tax.jurisdictions.cols.region", undefined, "Region"),
                render: (r) => r.region ?? "—",
                accessor: (r) => r.region,
              },
            ]}
          />
        </section>

        {/* Rates */}
        <section className="surface overflow-hidden">
          <CardHeader
            title={t("console.finance.tax.rates.title", undefined, "Rates")}
            subtitle={t(
              "console.finance.tax.rates.subtitle",
              undefined,
              "Effective tax rates by jurisdiction and category.",
            )}
          />
          <DataView<TaxRate>
            rows={rates}
            emptyLabel={t("console.finance.tax.rates.empty", undefined, "No tax rates defined")}
            emptyDescription={t(
              "console.finance.tax.rates.emptyDescription",
              undefined,
              "Tax rates map a jurisdiction × category to an effective rate over a date range.",
            )}
            columns={[
              {
                key: "jurisdiction",
                header: t("console.finance.tax.rates.cols.jurisdiction", undefined, "Jurisdiction"),
                render: (r) => jMap.get(r.jurisdiction_id) ?? r.jurisdiction_id,
                accessor: (r) => jMap.get(r.jurisdiction_id) ?? r.jurisdiction_id,
              },
              {
                key: "category",
                header: t("console.finance.tax.rates.cols.category", undefined, "Category"),
                render: (r) => <Badge variant="muted">{cMap.get(r.category_code) ?? r.category_code}</Badge>,
                accessor: (r) => cMap.get(r.category_code) ?? r.category_code,
              },
              {
                key: "rate",
                header: t("console.finance.tax.rates.cols.rate", undefined, "Rate"),
                render: (r) => formatRatePercent(r.rate),
                tabular: true,
                accessor: (r) => r.rate,
              },
              {
                key: "effective_from",
                header: t("console.finance.tax.rates.cols.from", undefined, "From"),
                render: (r) => r.effective_from ?? "—",
                mono: true,
                accessor: (r) => r.effective_from,
              },
              {
                key: "effective_to",
                header: t("console.finance.tax.rates.cols.to", undefined, "To"),
                render: (r) => r.effective_to ?? "—",
                mono: true,
                accessor: (r) => r.effective_to,
              },
            ]}
          />
        </section>

        {/* Withholding rules */}
        <section className="surface overflow-hidden">
          <CardHeader
            title={t("console.finance.tax.withholding.title", undefined, "Withholding Rules")}
            subtitle={t(
              "console.finance.tax.withholding.subtitle",
              undefined,
              "Backup-withholding and contractor reporting thresholds.",
            )}
          />
          <DataView<WithholdingRule>
            rows={withholding}
            emptyLabel={t("console.finance.tax.withholding.empty", undefined, "No withholding rules defined")}
            emptyDescription={t(
              "console.finance.tax.withholding.emptyDescription",
              undefined,
              "Withholding rules set the rate and reporting threshold per jurisdiction and payee type.",
            )}
            columns={[
              {
                key: "jurisdiction",
                header: t("console.finance.tax.withholding.cols.jurisdiction", undefined, "Jurisdiction"),
                render: (r) => jMap.get(r.jurisdiction_id) ?? r.jurisdiction_id,
                accessor: (r) => jMap.get(r.jurisdiction_id) ?? r.jurisdiction_id,
              },
              {
                key: "applies_to",
                header: t("console.finance.tax.withholding.cols.appliesTo", undefined, "Applies To"),
                render: (r) => <Badge variant="muted">{r.applies_to}</Badge>,
                accessor: (r) => r.applies_to,
              },
              {
                key: "rate",
                header: t("console.finance.tax.withholding.cols.rate", undefined, "Rate"),
                render: (r) => formatRatePercent(r.rate),
                tabular: true,
                accessor: (r) => r.rate,
              },
              {
                key: "threshold",
                header: t("console.finance.tax.withholding.cols.threshold", undefined, "Threshold"),
                render: (r) => formatMinorAsMoney(r.threshold_minor, r.threshold_currency),
                tabular: true,
                accessor: (r) => r.threshold_minor,
              },
            ]}
          />
        </section>
      </div>
    </>
  );
}
