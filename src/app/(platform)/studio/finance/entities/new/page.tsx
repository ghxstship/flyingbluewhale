import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { createOrgEntity } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "ps-input w-full";
const LBL = "text-xs font-medium text-[var(--p-text-2)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { t } = await getRequestT();

  const { data: parents } = await supabase
    .from("org_entities")
    .select("id, legal_name, short_code")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("legal_name");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.entities.new.eyebrow", undefined, "Finance")}
        title={t("console.finance.entities.new.title", undefined, "New Legal Entity")}
        subtitle={t(
          "console.finance.entities.new.subtitle",
          undefined,
          "One row per LLC / Ltd / Pty / subsidiary. Base currency drives FX snapshots on invoices, expenses, and pay-apps tagged to this entity.",
        )}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createOrgEntity}
          cancelHref="/studio/finance/entities"
          submitLabel={t("console.finance.entities.new.submit", undefined, "Create Entity")}
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.finance.entities.new.fields.legalName", undefined, "Legal Name")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <input name="legal_name" required placeholder="ATLVS Productions LLC" className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.finance.entities.new.fields.shortCode", undefined, "Short Code")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
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
                {t("console.finance.entities.new.fields.baseCurrency", undefined, "Base Currency")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
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
              <span className={LBL}>
                {t("console.finance.entities.new.fields.jurisdiction", undefined, "Jurisdiction")}
              </span>
              <input name="jurisdiction" placeholder="US-CA, UK, DE…" maxLength={20} className={`${INPUT} font-mono`} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.finance.entities.new.fields.taxId", undefined, "Tax ID / EIN")}</span>
              <input name="tax_id" placeholder="XX-XXXXXXX" maxLength={40} className={`${INPUT} font-mono`} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.finance.entities.new.fields.parentEntity", undefined, "Parent Entity (Consolidates Into)")}
              </span>
              <select name="parent_entity_id" className={INPUT}>
                <option value="">
                  {t("console.finance.entities.new.parent.topLevel", undefined, "(top-level)")}
                </option>
                {((parents ?? []) as Array<{ id: string; legal_name: string; short_code: string }>).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.legal_name} ({p.short_code})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t(
                  "console.finance.entities.new.fields.ownershipPct",
                  undefined,
                  "Ownership % (This Entity in Parent)",
                )}
              </span>
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
              <span className={LBL}>
                {t("console.finance.entities.new.fields.consolidationMethod", undefined, "Consolidation Method")}
              </span>
              <select name="consolidation_method" defaultValue="full" className={INPUT}>
                {["full", "equity", "proportional", "none"].map((m) => (
                  <option key={m} value={m}>
                    {t(`console.finance.entities.new.consolidationMethod.${m}`, undefined, toTitle(m))}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.finance.entities.new.fields.consolidationState", undefined, "Consolidation Status")}
              </span>
              <select name="consolidation_state" defaultValue="active" className={INPUT}>
                {["active", "pending", "dormant", "divested"].map((s) => (
                  <option key={s} value={s}>
                    {t(`console.finance.entities.new.consolidationState.${s}`, undefined, toTitle(s))}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.finance.entities.new.fields.effectiveFrom", undefined, "Effective From")}
              </span>
              <input type="date" name="effective_from" className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.finance.entities.new.fields.effectiveTo", undefined, "Effective To")}
              </span>
              <input type="date" name="effective_to" className={INPUT} />
            </label>
          </div>
        </FormShell>
      </div>
    </>
  );
}
