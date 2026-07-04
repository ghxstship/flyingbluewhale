import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  ahj_default: string | null;
  lead_time: string | null;
  trigger_type: string | null;
  condition: string | null;
};

/**
 * Permits (kit 20 Safety · Protect tab) — the permit reference register
 * from the XPMS warehouse dimension (`dim_permit`): which permits exist,
 * who the default authority (AHJ) is, what triggers each, and the lead
 * time to clear it. There is no operational permits store yet (ADR-0014);
 * evidence for a cleared permit files through Compliance → Chain Of
 * Custody. This register is real reference data, not a stub.
 */
export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.permits.eyebrow", undefined, "Safety · Protect")}
          title={t("console.permits.title", undefined, "Permits")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.permits.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("dim_permit")
    .select("id:permit_id, name, ahj_default, lead_time, trigger_type, condition")
    .order("name");
  const rows = (data ?? []) as unknown as Row[];
  const triggered = rows.filter((r) => !!r.trigger_type).length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.permits.eyebrow", undefined, "Safety · Protect")}
        title={t("console.permits.title", undefined, "Permits")}
        subtitle={t(
          "console.permits.subtitle",
          undefined,
          "The permit register: authority, trigger, and lead time per permit type.",
        )}
        action={
          <Button href="/studio/compliance/coc" size="sm" variant="secondary">
            {t("console.permits.logEvidence", undefined, "Log Evidence")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.permits.metric.types", undefined, "Permit Types")}
            value={fmt.number(rows.length)}
            accent
          />
          <MetricCard
            label={t("console.permits.metric.triggered", undefined, "Trigger-Bound")}
            value={fmt.number(triggered)}
          />
          <MetricCard
            label={t("console.permits.metric.ahjs", undefined, "Authorities")}
            value={fmt.number(new Set(rows.map((r) => r.ahj_default).filter(Boolean)).size)}
          />
        </div>
        <DataTable<Row>
          rows={rows}
          emptyLabel={t("console.permits.emptyLabel", undefined, "No permit types in the register")}
          emptyDescription={t(
            "console.permits.emptyDescription",
            undefined,
            "The XPMS permit dimension seeds this register; evidence for cleared permits files through Chain Of Custody.",
          )}
          columns={[
            {
              key: "name",
              header: t("console.permits.column.name", undefined, "Permit"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "ahj",
              header: t("console.permits.column.ahj", undefined, "Authority"),
              render: (r) => r.ahj_default ?? "—",
              accessor: (r) => r.ahj_default ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "trigger",
              header: t("console.permits.column.trigger", undefined, "Trigger"),
              render: (r) => (r.trigger_type ? toTitle(r.trigger_type) : "—"),
              accessor: (r) => r.trigger_type ?? null,
              filterable: true,
            },
            {
              key: "lead",
              header: t("console.permits.column.lead", undefined, "Lead Time"),
              render: (r) => r.lead_time ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => r.lead_time ?? null,
            },
            {
              key: "condition",
              header: t("console.permits.column.condition", undefined, "Condition"),
              render: (r) => r.condition ?? "—",
              accessor: (r) => r.condition ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
