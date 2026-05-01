import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { XPMS_CLASS_BY_CODE, XPMS_PHASES, formatXtcCode } from "@/lib/xpms";

export const dynamic = "force-dynamic";

type AtomRow = {
  id: string;
  identifier: string;
  name: string;
  state: "uac" | "tpc";
  phase: string;
  class_code: number;
  xtc_code: number;
  cost_cents: number | null;
  currency: string | null;
  quantity: number | null;
  unit: string | null;
};

const PHASE_NUM = Object.fromEntries(XPMS_PHASES.map((p) => [p.id, p.num]));

export default async function AtomsPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="XPMS" title="Atoms" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("xpms_atoms")
    .select("id, identifier, name, state, phase, class_code, xtc_code, cost_cents, currency, quantity, unit")
    .eq("org_id", session.orgId)
    .order("class_code")
    .order("identifier")
    .limit(500);
  const rows = (data ?? []) as AtomRow[];

  return (
    <>
      <ModuleHeader
        eyebrow="XPMS · Atomic Production System"
        title="Atoms"
        subtitle={`${rows.length} addressable units across the ten classes`}
      />
      <div className="page-content">
        {error ? <div className="surface p-4 text-sm">Could not load atoms: {error.message}</div> : null}
        {rows.length === 0 ? (
          <div className="surface p-8 text-center text-sm text-[var(--text-muted)]">
            No atoms yet. Crew, equipment, scenic, and other production rows promote to atoms automatically once they
            carry an XTC code.
          </div>
        ) : (
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Identifier</th>
                <th className="text-left">Name</th>
                <th className="text-left">Class</th>
                <th className="text-left">XTC</th>
                <th className="text-left">Phase</th>
                <th className="text-left">State</th>
                <th className="text-right">Qty</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const cls = XPMS_CLASS_BY_CODE[r.class_code];
                return (
                  <tr key={r.id}>
                    <td className="font-mono text-[11px]">{r.identifier}</td>
                    <td className="text-xs">{r.name}</td>
                    <td className="text-xs">
                      {cls ? <span style={{ color: cls.accent }}>{cls.name}</span> : r.class_code}
                    </td>
                    <td className="font-mono text-[11px]">{formatXtcCode(r.xtc_code)}</td>
                    <td className="text-xs">
                      <span className="mr-1 font-mono text-[10px] text-[var(--text-muted)]">
                        {PHASE_NUM[r.phase] ?? "?"}
                      </span>
                      {r.phase}
                    </td>
                    <td>
                      <Badge variant={r.state === "tpc" ? "success" : "info"}>{r.state.toUpperCase()}</Badge>
                    </td>
                    <td className="text-right font-mono text-xs">
                      {r.quantity ?? 1}
                      {r.unit ? <span className="ml-1 text-[var(--text-muted)]">{r.unit}</span> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
