import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { XPMS_CLASS_BY_CODE } from "@/lib/xpms";

export const dynamic = "force-dynamic";

type Row = {
  org_id: string;
  project_id: string | null;
  class_code: number;
  reason: string;
  entries: number;
  qty_delta_total: number | null;
  cost_delta_cents_total: number | null;
};

export default async function VariancePage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="XPMS" title="Variance Ledger" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("v_xpms_variance_summary")
    .select("org_id, project_id, class_code, reason, entries, qty_delta_total, cost_delta_cents_total")
    .eq("org_id", session.orgId);
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow="XPMS · Variance"
        title="Variance Ledger"
        subtitle="UAC ↔ TPC delta as a first-class object. Reason codes per entry."
      />
      <div className="page-content">
        {rows.length === 0 ? (
          <div className="surface p-8 text-center text-sm text-[var(--text-muted)]">
            No variance entries yet. Variance accrues when a TPC atom diverges from its UAC origin (no-shows,
            substitutions, quantity deltas, spec changes, weather, …).
          </div>
        ) : (
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Class</th>
                <th className="text-left">Reason</th>
                <th className="text-right">Entries</th>
                <th className="text-right">Qty Δ</th>
                <th className="text-right">Cost Δ (cents)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const c = XPMS_CLASS_BY_CODE[r.class_code];
                return (
                  <tr key={i}>
                    <td className="text-xs">{c ? <span style={{ color: c.accent }}>{c.name}</span> : r.class_code}</td>
                    <td>
                      <Badge variant="muted">{r.reason}</Badge>
                    </td>
                    <td className="text-right font-mono text-xs">{r.entries}</td>
                    <td className="text-right font-mono text-xs">{r.qty_delta_total ?? 0}</td>
                    <td className="text-right font-mono text-xs">{r.cost_delta_cents_total ?? 0}</td>
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
