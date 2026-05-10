import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { addResponse } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "input-base focus-ring";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

export default async function Page({ params }: { params: Promise<{ reqId: string }> }) {
  const { reqId } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: vendors } = await supabase
    .from("vendors")
    .select("id, name")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("name");

  return (
    <>
      <ModuleHeader
        eyebrow="Procurement"
        title="Add Bid Response"
        subtitle="Record a vendor's quote against this RFQ."
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={addResponse.bind(null, reqId)}
          cancelHref={`/console/procurement/requisitions/${reqId}/leveling`}
          submitLabel="Add"
        >
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              Vendor<span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <select name="vendor_id" required className={INPUT}>
              <option value="">Select…</option>
              {(vendors ?? []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Total ($)</span>
            <input type="number" step="any" name="total" className={INPUT} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Notes</span>
            <textarea name="notes" rows={3} className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
