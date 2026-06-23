export const dynamic = "force-dynamic";

import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { CapacityBar } from "@/components/ui/CapacityBar";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { forecastByPerson, PERSON_PHASE_CAPACITY } from "@/lib/xpms/coordinate";
import { XPMS_ATOM_PHASES } from "@/lib/xpms";

/**
 * §9.3 Workload forecast — person (down) × phase (across) effort load, pivoted
 * from real tasks (`effort` × `assigned_to`, resolved to a phase via the atom
 * link). Per-person utilization uses the `PERSON_PHASE_CAPACITY` baseline;
 * overallocated people glow via <CapacityBar>. The roster/time-off-derived
 * capacity is the documented next step.
 */
export default async function ForecastPage() {
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();

  const { rows } = await forecastByPerson(session.orgId);

  const names = new Map<string, string>();
  if (rows.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, name")
      .in(
        "id",
        rows.map((r) => r.userId),
      );
    for (const u of (users ?? []) as { id: string; name: string | null }[]) {
      names.set(u.id, u.name ?? t("console.position.forecast.unnamed", undefined, "Unassigned"));
    }
  }

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.position.forecast.eyebrow", undefined, "The Chart")}
        title={t("console.position.forecast.title", undefined, "Workload forecast")}
        subtitle={t("console.position.forecast.subtitle", undefined, "Effort load per person, across phases")}
        breadcrumbs={[
          { label: t("console.position.title", undefined, "Position"), href: "/studio/position" },
          { label: t("console.position.forecast.title", undefined, "Workload forecast") },
        ]}
      />
      <div className="page-content max-w-6xl">
        {rows.length === 0 ? (
          <EmptyState
            title={t("console.position.forecast.emptyTitle", undefined, "No assigned effort yet")}
            description={t(
              "console.position.forecast.emptyDescription",
              undefined,
              "Assign tasks (with an effort estimate) that carry an XPMS atom, and per-person load lights up across the phases here.",
            )}
          />
        ) : (
          <div className="surface overflow-x-auto p-0">
            <table className="ps-table w-full" style={{ minWidth: 760 }}>
              <thead>
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-[0.08em] text-[var(--p-text-3)] uppercase">
                    {t("console.position.forecast.person", undefined, "Person")}
                  </th>
                  {XPMS_ATOM_PHASES.map((p) => (
                    <th
                      key={p.id}
                      className="px-2 py-2.5 text-center font-mono text-[11px] text-[var(--p-text-3)]"
                      title={p.label}
                    >
                      {p.num}
                    </th>
                  ))}
                  <th className="px-4 py-2.5 text-left text-xs font-semibold tracking-[0.08em] text-[var(--p-text-3)] uppercase">
                    {t("console.position.forecast.utilization", undefined, "Utilization")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const activePhases = [...r.byPhase.keys()].length;
                  const capacity = Math.max(1, activePhases) * PERSON_PHASE_CAPACITY;
                  return (
                    <tr key={r.userId} className="border-t border-[var(--p-border)]">
                      <td className="px-4 py-2.5 text-sm font-medium text-[var(--p-text-1)]">
                        {names.get(r.userId) ?? r.userId.slice(0, 8)}
                      </td>
                      {XPMS_ATOM_PHASES.map((p) => {
                        const v = r.byPhase.get(p.id) ?? 0;
                        const over = v > PERSON_PHASE_CAPACITY;
                        return (
                          <td
                            key={p.id}
                            className="num px-2 py-2.5 text-center font-mono text-xs"
                            style={{ color: over ? "var(--p-danger-text)" : v > 0 ? "var(--p-text-1)" : "var(--p-text-3)" }}
                          >
                            {v > 0 ? v : "·"}
                          </td>
                        );
                      })}
                      <td className="px-4 py-2.5" style={{ minWidth: 180 }}>
                        <CapacityBar load={r.total} capacity={capacity} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
