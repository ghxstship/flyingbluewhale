import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DeleteForm } from "@/components/DeleteForm";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { RecordActionButton } from "@/components/RecordActionButton";
import { convertEstimateToBudgetAction } from "../actions";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { hasSupabase } from "@/lib/env";
import { timeAgo, toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { deleteEstimate } from "./edit/actions";

export const dynamic = "force-dynamic";

export default async function EstimateDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const estimate = await getOrgScoped("estimates", session.orgId, id);
  if (!estimate) notFound();
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();

  let projectName: string | null = null;
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", estimate.project_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  projectName = (project as { name: string | null } | null)?.name ?? null;

  function fmtMoney(n: number): string {
    return fmt.money(Math.round(n * 100));
  }

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.estimates.detail.eyebrow", undefined, "Creative")}
        title={estimate.name}
        subtitle={projectName ?? t("console.estimates.detail.noProject", undefined, "No project on file")}
        breadcrumbs={[
          {
            label: t("console.estimates.detail.breadcrumb.creative", undefined, "Creative"),
            href: "/studio/estimates",
          },
          {
            label: t("console.estimates.detail.breadcrumb.estimates", undefined, "Estimates"),
            href: "/studio/estimates",
          },
          { label: estimate.name },
        ]}
        action={
          <div className="flex items-center gap-2">
            {isManagerPlus(session) && estimate.estimate_state === "won" && (
              <RecordActionButton
                action={convertEstimateToBudgetAction.bind(null, id)}
                label={t("console.estimates.detail.convertToBudget", undefined, "Convert To Budget")}
                pendingLabel={t("console.estimates.detail.converting", undefined, "Converting…")}
              />
            )}
            <Button href={`/studio/estimates/${id}/edit`} size="sm" variant="secondary">
              {t("common.edit", undefined, "Edit")}
            </Button>
            <DeleteForm
              action={deleteEstimate.bind(null, id)}
              confirm={t(
                "console.estimates.detail.deleteConfirm",
                { name: estimate.name },
                `Delete estimate "${estimate.name}"? It will be removed from the pipeline but can be restored.`,
              )}
              undo={{ table: "estimates", id, redirectTo: "/studio/estimates" }}
            />
          </div>
        }
      />
      <div className="page-content space-y-8">
        <div className="metric-grid">
          <Field label={t("console.estimates.detail.field.state", undefined, "State")}>
            <Badge variant={toneFor(estimate.estimate_state)}>{toTitle(estimate.estimate_state)}</Badge>
          </Field>
          <Field label={t("console.estimates.detail.field.markup", undefined, "Markup")}>
            {`${(Number(estimate.default_markup_pct) * 100).toFixed(1)}%`}
          </Field>
          <Field label={t("console.estimates.detail.field.waste", undefined, "Waste factor")}>
            {`${(Number(estimate.default_waste_factor) * 100).toFixed(1)}%`}
          </Field>
          <Field label={t("console.estimates.detail.field.subtotal", undefined, "Subtotal")}>
            {fmtMoney(Number(estimate.subtotal_cost))}
          </Field>
          <Field label={t("console.estimates.detail.field.total", undefined, "Total with markup")}>
            {fmtMoney(Number(estimate.total_with_markup))}
          </Field>
          <Field label={t("console.estimates.detail.field.created", undefined, "Created")}>
            {timeAgo(estimate.created_at)}
          </Field>
        </div>

        {estimate.notes && (
          <div className="surface p-5">
            <h3 className="text-sm font-semibold">{t("console.estimates.detail.notes", undefined, "Notes")}</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{estimate.notes}</p>
          </div>
        )}
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
