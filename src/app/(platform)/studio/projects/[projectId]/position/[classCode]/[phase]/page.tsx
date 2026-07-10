export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { Coordinate } from "@/components/ui/CoordinateMatrix";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT, getRequestFormatters } from "@/lib/i18n/request";
import { XPMS_CLASS_BY_CODE, XPMS_ATOM_PHASES, type XpmsAtomPhase } from "@/lib/xpms";
import { listCellAtoms } from "@/lib/xpms/coordinate";

/**
 * §9.2 Functional cell — the microproject workspace for one (class × phase)
 * coordinate within a project. Header carries the Coordinate chip + rollup
 * stats; the body lists the XPMS atoms resolving to this cell (the WBS work at
 * this intersection). Project-management-within-the-intersection.
 */
export default async function CellPage({
  params,
}: {
  params: Promise<{ projectId: string; classCode: string; phase: string }>;
}) {
  const { projectId, classCode, phase } = await params;
  const code = Number(classCode);
  const cls = XPMS_CLASS_BY_CODE[code];
  const phaseDef = XPMS_ATOM_PHASES.find((p) => p.id === phase);
  if (!cls || !phaseDef) notFound();

  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: project }, cell] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name")
      .eq("org_id", session.orgId)
      .eq("id", projectId)
      .is("deleted_at", null)
      .maybeSingle(),
    listCellAtoms(session.orgId, projectId, code, phase as XpmsAtomPhase),
  ]);

  const projectName = project?.name ?? t("console.position.cell.project", undefined, "Project");

  return (
    <>
      <ModuleHeader
        eyebrow={projectName}
        title={`${cls.name} × ${phaseDef.label}`}
        subtitle={cls.oneLine}
        breadcrumbs={[
          { label: t("console.position.cell.projects", undefined, "Projects"), href: "/studio/projects" },
          { label: projectName, href: `/studio/projects/${projectId}` },
          { label: t("console.position.cell.position", undefined, "Position") },
          { label: `${cls.name} × ${phaseDef.label}` },
        ]}
        action={<Coordinate longitude={cls.name} latitude={phaseDef.label} lonColor={cls.accent} act={`P${phaseDef.num}`} />}
      />
      <div className="page-content max-w-4xl space-y-6">
        <div className="metric-grid">
          <MetricCard label={t("console.position.cell.atoms", undefined, "Atoms")} value={String(cell.atoms.length)} />
          <MetricCard
            label={t("console.position.cell.cost", undefined, "Cost")}
            value={`$${fmt.number(Math.round(cell.costTotal))}`}
          />
          <MetricCard label={t("console.position.cell.class", undefined, "Class")} value={`${code} · ${cls.name}`} />
        </div>

        {cell.atoms.length === 0 ? (
          <EmptyState
            title={t("console.position.cell.emptyTitle", undefined, "No atoms in this cell")}
            description={t(
              "console.position.cell.emptyDescription",
              undefined,
              "Nothing in this project resolves to this class × phase coordinate yet.",
            )}
          />
        ) : (
          <ul className="divide-y divide-[var(--p-border)] rounded-[var(--p-r,8px)] border border-[var(--p-border)] bg-[var(--p-surface)]">
            {cell.atoms.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-[var(--p-text-1)]">{a.name}</span>
                  <span className="font-mono text-xs text-[var(--p-text-3)]">{a.identifier}</span>
                </span>
                <span className="shrink-0 font-mono text-xs text-[var(--p-text-2)]">
                  {a.cost_cents != null ? `$${fmt.number(Math.round(a.cost_cents / 100))}` : "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
