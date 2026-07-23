export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/components/detail/DetailShell";
import { DeleteForm } from "@/components/DeleteForm";
import { setFabStatus, deleteFabById } from "../actions";
import {
  getFabricationOrder,
  listProductionPhaseTransitions,
  PRODUCTION_PHASE_GRAPH,
  type ProductionPhase,
} from "@/lib/production-phase";
import { ProductionPhaseControls } from "./ProductionPhaseControls";
import { toTitle } from "@/lib/format";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export default async function Page({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const { data: row } = await supabase
    .from("fabrication_orders")
    .select("id, title, description, production_phase, due_at, project_id, created_at")
    .eq("org_id", session.orgId)
    .eq("id", orderId)
    .maybeSingle();

  if (!row) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.production.fabrication.detail.eyebrow", undefined, "Production")}
          title={t("console.production.fabrication.detail.title", undefined, "Fabrication")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">
            {t("console.production.fabrication.detail.notFound", undefined, "Not found.")}
          </div>
        </div>
      </>
    );
  }

  // Quick-advance buttons read the canonical production-phase graph
  // (DISCOVERY→CLOSE, LDP §2) — the same graph setFabStatus validates against.
  // `?? []` keeps an unrecognized/legacy phase value from crashing the header.
  const transitions = PRODUCTION_PHASE_GRAPH[row.production_phase as ProductionPhase] ?? [];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.fabrication.detail.eyebrow", undefined, "Production")}
        title={row.title}
        subtitle={row.description ?? undefined}
        breadcrumbs={[
          { label: t("console.production.fabrication.detail.breadcrumbProduction", undefined, "Production") },
          {
            label: t("console.production.fabrication.detail.title", undefined, "Fabrication"),
            href: "/studio/production/fabrication",
          },
          { label: row.title },
        ]}
        action={
          <div className="flex items-center gap-1">
            {transitions.map((to) => (
              <form key={to} action={setFabStatus} className="inline">
                <input type="hidden" name="id" value={row.id} />
                <input type="hidden" name="production_phase" value={to} />
                <button
                  type="submit"
                  className="ps-btn ps-btn--ghost ps-btn--sm"
                >
                  → {toTitle(to)}
                </button>
              </form>
            ))}
            <a href={`/studio/production/fabrication/${row.id}/edit`} className="ps-btn ps-btn--ghost ps-btn--sm">
              {t("common.edit", undefined, "Edit")}
            </a>
          </div>
        }
      />
      <div className="page-content max-w-3xl space-y-4">
        <section className="surface p-5">
          <div className="grid grid-cols-2 gap-4">
            <Field
              label={t("console.production.fabrication.detail.fields.production_phase", undefined, "Status")}
              value={<StatusBadge status={row.production_phase} />}
            />
            <Field
              label={t("console.production.fabrication.detail.fields.due", undefined, "Due")}
              value={<span className="font-mono text-xs">{fmtDate(row.due_at)}</span>}
            />
            <Field
              label={t("console.production.fabrication.detail.fields.created", undefined, "Created")}
              value={<span className="font-mono text-xs">{fmtDate(row.created_at)}</span>}
            />
          </div>
          {row.description && (
            <div className="mt-4 border-t border-[var(--p-border)] pt-3 text-xs text-[var(--p-text-2)]">
              {row.description}
            </div>
          )}
        </section>

        <section className="surface p-4 text-xs">
          <div className="flex items-center justify-between">
            <Badge variant="muted">
              {t("console.production.fabrication.detail.lifecycleBadge", undefined, "Lifecycle")}
            </Badge>
            <DeleteForm
              action={deleteFabById.bind(null, row.id)}
              label={t("console.production.fabrication.detail.deleteOrder", undefined, "Delete Order")}
              confirm={t(
                "console.production.fabrication.detail.deleteConfirm",
                undefined,
                "Delete this fabrication order? The record is removed for everyone on the project.",
              )}
            />
          </div>
        </section>

        <ProductionPhaseSection orderId={row.id} orgId={session.orgId} />
      </div>
    </>
  );
}

async function ProductionPhaseSection({ orderId, orgId }: { orderId: string; orgId: string }) {
  // LDP §2 Production Lifecycle — distinct from the workflow-execution `status`
  // shown above. Phase tracks design→install arc; status tracks workflow gate.
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();
  const fab = await getFabricationOrder(orgId, orderId);
  if (!fab) return null;
  const transitions = await listProductionPhaseTransitions(orgId, orderId);
  const allowedNext = PRODUCTION_PHASE_GRAPH[fab.production_phase as ProductionPhase];

  return (
    <section className="surface space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide uppercase">
          {t("console.production.fabrication.detail.phase.heading", undefined, "Production Phase")}
        </h2>
        <Badge variant="default">{toTitle(fab.production_phase)}</Badge>
      </div>
      <p className="text-xs text-[var(--p-text-2)]">
        {t(
          "console.production.fabrication.detail.phase.description",
          undefined,
          "Sequential macro-arc: Discovery → Concept → Engineering → Pre-Pro → Fab → Logistics → Install → Strike. Phase regression is permitted with a logged reason. Distinct from the workflow status shown above (Open / In Progress / Blocked / Complete).",
        )}
      </p>
      <ProductionPhaseControls
        orderId={fab.id}
        currentPhase={fab.production_phase as ProductionPhase}
        allowedNext={allowedNext}
      />
      {transitions.length > 0 && (
        <div className="border-t border-[var(--p-border)] pt-3">
          <div className="mb-2 text-xs font-semibold tracking-wide uppercase">
            {t("console.production.fabrication.detail.phase.recentTransitions", undefined, "Recent Transitions")}
          </div>
          <ul className="space-y-1 text-xs">
            {transitions.slice(0, 5).map((tr) => (
              <li key={tr.id}>
                {tr.from_phase
                  ? toTitle(tr.from_phase)
                  : t("console.production.fabrication.detail.phase.initial", undefined, "Initial")}{" "}
                → <strong>{toTitle(tr.to_phase)}</strong> · {fmt.date(new Date(tr.transitioned_at))}
                {tr.reason ? <span className="ms-2">{tr.reason}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] tracking-[0.18em] text-[var(--p-text-2)] uppercase">{label}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}
