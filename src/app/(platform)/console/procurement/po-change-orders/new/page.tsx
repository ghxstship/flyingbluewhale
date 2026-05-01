import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { createPoChangeOrder } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: pos } = await supabase
    .from("purchase_orders")
    .select("id, number, title, project_id")
    .eq("org_id", session.orgId)
    .in("status", ["sent", "acknowledged", "fulfilled"])
    .order("number", { ascending: false })
    .limit(200);

  return (
    <>
      <ModuleHeader
        eyebrow="Procurement"
        title="New PO change order"
        subtitle="Adjust commitment value and schedule on an existing PO."
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createPoChangeOrder}
          cancelHref="/console/procurement/po-change-orders"
          submitLabel="Propose"
        >
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              Purchase order<span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <select name="purchase_order_id" required className={INPUT}>
              <option value="">Select…</option>
              {(pos ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.number} — {p.title ?? ""}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              Title<span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input name="title" required placeholder="Add 4 dimmers + cabling for FOH expansion" className={INPUT} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Reason</span>
            <textarea name="reason" rows={3} placeholder="Why is this change happening?" className={INPUT} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Amount ($)</span>
              <input type="number" step="any" name="amount" defaultValue="0" className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Schedule impact (days)</span>
              <input type="number" name="schedule_impact_days" defaultValue="0" className={INPUT} />
            </label>
          </div>
        </FormShell>
      </div>
    </>
  );
}
