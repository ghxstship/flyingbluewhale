import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  kind: string;
  due_at: string;
  completed_at: string | null;
  outcome: string | null;
};

const OUTCOME_VARIANT: Record<string, BadgeVariant> = {
  pass: "success",
  fail: "error",
  partial: "info",
};

export default async function Page({ params }: { params: Promise<{ equipmentId: string }> }) {
  const { equipmentId } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data } = await supabase
    .from("maintenance_jobs")
    .select("id,kind,due_at,completed_at,outcome")
    .eq("org_id", session.orgId)
    .eq("target_kind", "equipment")
    .eq("target_id", equipmentId)
    .order("due_at", { ascending: false });
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.equipment.maintenance.eyebrow", undefined, "Equipment")}
        title={t("console.production.equipment.maintenance.title", undefined, "Maintenance")}
        subtitle={t(
          "console.production.equipment.maintenance.subtitle",
          undefined,
          "Scheduled inspection + service jobs.",
        )}
      />
      <div className="page-content space-y-4">
        <DataTable<Row>
          rows={rows}
          emptyLabel={t("console.production.equipment.maintenance.emptyLabel", undefined, "No Maintenance Jobs")}
          emptyDescription={t(
            "console.production.equipment.maintenance.emptyDescription",
            undefined,
            "No maintenance jobs scheduled for this equipment yet. Schedule one from the Maintenance module.",
          )}
          columns={[
            {
              key: "kind",
              header: t("console.production.equipment.maintenance.columns.kind", undefined, "Kind"),
              render: (r) => r.kind,
              accessor: (r) => r.kind,
              filterable: true,
            },
            {
              key: "due_at",
              header: t("console.production.equipment.maintenance.columns.due", undefined, "Due"),
              render: (r) => formatDate(r.due_at),
              accessor: (r) => r.due_at,
              mono: true,
              sortable: true,
            },
            {
              key: "completed_at",
              header: t("console.production.equipment.maintenance.columns.completed", undefined, "Completed"),
              render: (r) => (r.completed_at ? formatDate(r.completed_at) : "—"),
              accessor: (r) => r.completed_at ?? "",
              mono: true,
              sortable: true,
            },
            {
              key: "outcome",
              header: t("console.production.equipment.maintenance.columns.outcome", undefined, "Outcome"),
              render: (r) =>
                r.outcome ? <Badge variant={OUTCOME_VARIANT[r.outcome] ?? "default"}>{r.outcome}</Badge> : "—",
              accessor: (r) => r.outcome ?? "",
              filterable: true,
            },
          ]}
        />
        <p className="text-xs text-[var(--p-text-2)]">
          {t("console.production.equipment.maintenance.scheduleHintPrefix", undefined, "Schedule jobs from the")}{" "}
          <Link href="/studio/operations/maintenance" className="underline">
            {t("console.production.equipment.maintenance.maintenanceModuleLink", undefined, "Maintenance module")}
          </Link>
          .
        </p>
      </div>
    </>
  );
}
