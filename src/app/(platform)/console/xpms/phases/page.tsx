import { ModuleHeader } from "@/components/Shell";
import { Card, CardBody, CardHeader } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { XPMS_PHASES, XPMS_CLASSES, type XpmsPhase } from "@/lib/xpms";

export const dynamic = "force-dynamic";

type AtomPhaseRow = { phase: XpmsPhase; class_code: number; state: "uac" | "tpc" };

export default async function PhasesPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="XPMS" title="Phases" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase.from("xpms_atoms").select("phase, class_code, state").eq("org_id", session.orgId);
  const rows = (data ?? []) as AtomPhaseRow[];

  const byPhase = new Map<XpmsPhase, { uac: number; tpc: number; byClass: Record<number, number> }>();
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
        eyebrow="XPMS · 8PP — Eight Production Phases"
        title="Phases"
        subtitle="Temporal spine. Every atom carries one phase; ATLVS owns 1–4 + 8, COMPVSS owns 4–7, GVTEWAY owns 6."
      />
      <div className="page-content grid grid-cols-1 gap-4 md:grid-cols-2">
        {XPMS_PHASES.map((p) => {
          const stat = byPhase.get(p.id) ?? { uac: 0, tpc: 0, byClass: {} };
          const total = stat.uac + stat.tpc;
          return (
            <Card key={p.id}>
              <CardHeader title={`${p.num}. ${p.label}`} subtitle={p.platform} />
              <CardBody>
                <div className="mb-3 flex gap-4 font-mono text-xs">
                  <span>
                    UAC <strong>{stat.uac}</strong>
                  </span>
                  <span>
                    TPC <strong>{stat.tpc}</strong>
                  </span>
                  <span>
                    Total <strong>{total}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-[var(--text-muted)]">
                  {XPMS_CLASSES.filter((c) => stat.byClass[c.code]).map((c) => (
                    <span key={c.code} style={{ color: c.accent }}>
                      {c.name} <span className="font-mono">{stat.byClass[c.code]}</span>
                    </span>
                  ))}
                  {!total && <span>No atoms in this phase yet</span>}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </>
  );
}
