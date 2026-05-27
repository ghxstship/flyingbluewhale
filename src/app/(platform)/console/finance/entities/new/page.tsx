import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { toTitle } from "@/lib/format";
import { createOrgEntity } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: parents } = await supabase
    .from("org_entities")
    .select("id, legal_name, short_code")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("legal_name");

  return (
    <>
      <ModuleHeader
        eyebrow="Finance"
        title="New Legal Entity"
        subtitle="One row per LLC / Ltd / Pty / subsidiary. Base currency drives FX snapshots on invoices, expenses, and pay-apps tagged to this entity."
      />
      <div className="page-content max-w-2xl">
        <FormShell action={createOrgEntity} cancelHref="/console/finance/entities" submitLabel="Create Entity">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                Legal Name<span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <input name="legal_name" required placeholder="ATLVS Productions LLC" className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                Short Code<span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <input
                name="short_code"
                required
                placeholder="ATLVS-US"
                maxLength={20}
                className={`${INPUT} font-mono`}
              />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                Base Currency<span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <input
                name="base_currency"
                required
                placeholder="USD"
                maxLength={3}
                defaultValue="USD"
                className={`${INPUT} font-mono uppercase`}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Jurisdiction</span>
              <input name="jurisdiction" placeholder="US-CA, UK, DE…" maxLength={20} className={`${INPUT} font-mono`} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Tax ID / EIN</span>
              <input name="tax_id" placeholder="XX-XXXXXXX" maxLength={40} className={`${INPUT} font-mono`} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Parent Entity (consolidates into)</span>
              <select name="parent_entity_id" className={INPUT}>
                <option value="">— (top-level)</option>
                {((parents ?? []) as Array<{ id: string; legal_name: string; short_code: string }>).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.legal_name} ({p.short_code})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Ownership % (this entity in parent)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                name="ownership_pct"
                defaultValue="100"
                className={`${INPUT} font-mono`}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Consolidation Method</span>
              <select name="consolidation_method" defaultValue="full" className={INPUT}>
                {["full", "equity", "proportional", "none"].map((m) => (
                  <option key={m} value={m}>
                    {toTitle(m)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Consolidation State</span>
              <select name="consolidation_state" defaultValue="active" className={INPUT}>
                {["active", "pending", "dormant", "divested"].map((s) => (
                  <option key={s} value={s}>
                    {toTitle(s)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Effective From</span>
              <input type="date" name="effective_from" className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Effective To</span>
              <input type="date" name="effective_to" className={INPUT} />
            </label>
          </div>
        </FormShell>
      </div>
    </>
  );
}
