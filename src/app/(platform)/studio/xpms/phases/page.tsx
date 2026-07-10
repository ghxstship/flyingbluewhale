import { ModuleHeader } from "@/components/Shell";
import { Card, CardBody, CardHeader } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createClient } from "@/lib/supabase/server";
import { XPMS_ATOM_PHASES, XPMS_CLASSES, type XpmsAtomPhase } from "@/lib/xpms";

export const dynamic = "force-dynamic";

type AtomPhaseRow = { phase: XpmsAtomPhase; class_code: number; state: "uac" | "tpc" };

export default async function PhasesPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="XPMS" title={t("console.xpms.phases.title", undefined, "Phases")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.xpms.phases.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase.from("xpms_atoms").select("phase, class_code, state").eq("org_id", session.orgId);
  const rows = (data ?? []) as AtomPhaseRow[];

  const byPhase = new Map<XpmsAtomPhase, { uac: number; tpc: number; byClass: Record<number, number> }>();
  rows.forEach((r) => {
    const cur = byPhase.get(r.phase) ?? { uac: 0, tpc: 0, byClass: {} };
    if (r.state === "tpc") cur.tpc++;
    else cur.uac++;
    cur.byClass[r.class_code] = (cur.byClass[r.class_code] ?? 0) + 1;
    byPhase.set(r.phase, cur);
  });

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.xpms.phases.eyebrow", undefined, "XPMS · 8PP · Eight Production Phases")}
        title={t("console.xpms.phases.title", undefined, "Phases")}
        subtitle={t("console.xpms.phases.subtitle", undefined, "Temporal spine across project lifecycle.")}
      />
      <div className="page-content grid grid-cols-1 gap-4 md:grid-cols-2">
        {XPMS_ATOM_PHASES.map((p) => {
          const stat = byPhase.get(p.id) ?? { uac: 0, tpc: 0, byClass: {} };
          const total = stat.uac + stat.tpc;
          return (
            <Card key={p.id}>
              <CardHeader title={`${p.num}. ${p.label}`} subtitle={p.platform} />
              <CardBody>
                <div className="mb-3 flex gap-4 font-mono text-xs">
                  <span>
                    {t("console.xpms.phases.uac", undefined, "UAC")} <strong>{stat.uac}</strong>
                  </span>
                  <span>
                    {t("console.xpms.phases.tpc", undefined, "TPC")} <strong>{stat.tpc}</strong>
                  </span>
                  <span>
                    {t("console.xpms.phases.total", undefined, "Total")} <strong>{total}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-[var(--p-text-2)]">
                  {XPMS_CLASSES.filter((c) => stat.byClass[c.code]).map((c) => (
                    <span key={c.code} style={{ color: c.accent }}>
                      {c.name} <span className="font-mono">{stat.byClass[c.code]}</span>
                    </span>
                  ))}
                  {!total && <span>{t("console.xpms.phases.empty", undefined, "No atoms in this phase yet")}</span>}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </>
  );
}
