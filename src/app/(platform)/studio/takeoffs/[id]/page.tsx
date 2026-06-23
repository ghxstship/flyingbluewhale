import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { deleteTakeoff } from "./edit/actions";

export const dynamic = "force-dynamic";

type Item = {
  id: string;
  label: string | null;
  geometry_kind: string;
  measured_quantity: number;
  notes: string | null;
  created_at: string;
};

export default async function TakeoffDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const takeoff = await getOrgScoped("takeoffs", session.orgId, id);
  if (!takeoff) notFound();
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const [{ data: project }, { data: sheet }, { data: costCode }, { data: itemRows }] = await Promise.all([
    takeoff.project_id
      ? supabase.from("projects").select("name").eq("id", takeoff.project_id).maybeSingle()
      : Promise.resolve({ data: null }),
    takeoff.site_plan_id
      ? supabase.from("site_plans").select("code, title").eq("id", takeoff.site_plan_id).maybeSingle()
      : Promise.resolve({ data: null }),
    takeoff.cost_code_id
      ? supabase.from("cost_codes").select("code, name").eq("id", takeoff.cost_code_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("takeoff_items")
      .select("id, label, geometry_kind, measured_quantity, notes, created_at")
      .eq("takeoff_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const projectName = (project as { name: string | null } | null)?.name ?? null;
  const sheetRow = sheet as { code: string; title: string } | null;
  const ccRow = costCode as { code: string; name: string } | null;
  const items = (itemRows ?? []) as Item[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.takeoffs.detail.eyebrow", undefined, "Creative")}
        title={takeoff.name}
        subtitle={
          projectName ??
          t("console.takeoffs.detail.noProject", undefined, "No project on file")
        }
        breadcrumbs={[
          { label: t("console.takeoffs.detail.breadcrumb.creative", undefined, "Creative"), href: "/studio/takeoffs" },
          { label: t("console.takeoffs.detail.breadcrumb.takeoffs", undefined, "Takeoffs"), href: "/studio/takeoffs" },
          { label: takeoff.name },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button href={`/studio/takeoffs/${id}/edit`} size="sm" variant="secondary">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteTakeoff.bind(null, id)}
              confirm={t(
                "console.takeoffs.detail.deleteConfirm",
                { name: takeoff.name },
                `Delete takeoff "${takeoff.name}"? Its measurement items are removed with it.`,
              )}
              undo={{ table: "takeoffs", id, redirectTo: "/studio/takeoffs" }}
            />
          </div>
        }
      />
      <div className="page-content space-y-8">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.takeoffs.detail.metric.quantity", undefined, "Total Quantity")}
            value={`${Number(takeoff.total_quantity).toFixed(2)} ${takeoff.unit}`}
            accent
          />
          <MetricCard
            label={t("console.takeoffs.detail.metric.items", undefined, "Measurements")}
            value={fmt.number(items.length)}
          />
          <MetricCard
            label={t("console.takeoffs.detail.metric.calibration", undefined, "Calibration (in/ft)")}
            value={
              takeoff.calibration_in_per_ft != null
                ? String(takeoff.calibration_in_per_ft)
                : t("console.takeoffs.detail.uncalibrated", undefined, "Uncalibrated")
            }
          />
        </div>

        <div className="metric-grid">
          <Field label={t("console.takeoffs.detail.field.project", undefined, "Project")}>{projectName ?? "—"}</Field>
          <Field label={t("console.takeoffs.detail.field.unit", undefined, "Unit")}>{takeoff.unit}</Field>
          <Field label={t("console.takeoffs.detail.field.sheet", undefined, "Sheet")}>
            {sheetRow ? `${sheetRow.code} · ${sheetRow.title}` : "—"}
          </Field>
          <Field label={t("console.takeoffs.detail.field.costCode", undefined, "Cost Code")}>
            {ccRow ? `${ccRow.code} ${ccRow.name}` : "—"}
          </Field>
          <Field label={t("console.takeoffs.detail.field.added", undefined, "Added")}>
            {timeAgo(takeoff.created_at)}
          </Field>
        </div>

        {takeoff.notes && (
          <div className="surface p-5">
            <h3 className="text-sm font-semibold">{t("console.takeoffs.detail.notes", undefined, "Notes")}</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{takeoff.notes}</p>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">
            {t("console.takeoffs.detail.measurements", undefined, "Measurements")}
          </h3>
          <DataTable<Item>
            rows={items}
            emptyLabel={t("console.takeoffs.detail.emptyLabel", undefined, "No measurements yet")}
            emptyDescription={t("console.takeoffs.detail.emptyDescription", undefined, "Items captured against this takeoff — counts, lengths, areas, volumes — roll up into the total above.")}
            columns={[
              {
                key: "label",
                header: t("console.takeoffs.detail.col.label", undefined, "Label"),
                render: (r) => r.label ?? "—",
                accessor: (r) => r.label ?? null,
              },
              {
                key: "geometry_kind",
                header: t("console.takeoffs.detail.col.geometry", undefined, "Geometry"),
                render: (r) => r.geometry_kind,
                accessor: (r) => r.geometry_kind,
                filterable: true,
                groupable: true,
                className: "text-xs",
              },
              {
                key: "measured_quantity",
                header: t("console.takeoffs.detail.col.quantity", undefined, "Quantity"),
                render: (r) => `${Number(r.measured_quantity).toFixed(2)} ${takeoff.unit}`,
                accessor: (r) => Number(r.measured_quantity),
                className: "font-mono text-xs text-right",
              },
            ]}
          />
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="surface p-3">
      <div className="text-[11px] font-semibold tracking-wide text-[var(--p-text-2)]">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
