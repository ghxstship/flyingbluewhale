import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { updateOrgEntity } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--p-text-2)]";
const day = (d: string | null | undefined) => (d ? String(d).slice(0, 10) : "");

type Entity = {
  id: string;
  legal_name: string;
  short_code: string;
  base_currency: string;
  jurisdiction: string | null;
  tax_id: string | null;
  parent_entity_id: string | null;
  ownership_pct: number | null;
  consolidation_method: string;
  consolidation_state: string;
  effective_from: string | null;
  effective_to: string | null;
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) return null;
  const { id } = await params;
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { t } = await getRequestT();

  const { data: entity } = await supabase
    .from("org_entities")
    .select(
      "id, legal_name, short_code, base_currency, jurisdiction, tax_id, parent_entity_id, ownership_pct, consolidation_method, consolidation_state, effective_from, effective_to",
    )
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  const e = entity as Entity | null;
  if (!e) notFound();

  const { data: parents } = await supabase
    .from("org_entities")
    .select("id, legal_name, short_code")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .neq("id", id)
    .order("legal_name");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.entities.edit.eyebrow", undefined, "Finance")}
        title={t("console.finance.entities.edit.title", undefined, "Edit Legal Entity")}
        subtitle={e.legal_name}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={updateOrgEntity.bind(null, id)}
          cancelHref={`/console/finance/entities/${id}`}
          submitLabel={t("common.saveChanges", undefined, "Save Changes")}
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.finance.entities.new.fields.legalName", undefined, "Legal Name")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <input name="legal_name" required maxLength={200} defaultValue={e.legal_name} className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.finance.entities.new.fields.shortCode", undefined, "Short Code")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <input
                name="short_code"
                required
                maxLength={20}
                defaultValue={e.short_code}
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
                maxLength={3}
                defaultValue={e.base_currency}
                className={`${INPUT} font-mono uppercase`}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.finance.entities.new.fields.jurisdiction", undefined, "Jurisdiction")}</span>
              <input
                name="jurisdiction"
                maxLength={20}
                defaultValue={e.jurisdiction ?? ""}
                className={`${INPUT} font-mono`}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.finance.entities.new.fields.taxId", undefined, "Tax ID / EIN")}</span>
              <input name="tax_id" maxLength={40} defaultValue={e.tax_id ?? ""} className={`${INPUT} font-mono`} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.finance.entities.new.fields.parentEntity", undefined, "Parent Entity — Consolidates Into")}
              </span>
              <select name="parent_entity_id" defaultValue={e.parent_entity_id ?? ""} className={INPUT}>
                <option value="">{t("console.finance.entities.new.parent.topLevel", undefined, "— (top-level)")}</option>
                {((parents ?? []) as Array<{ id: string; legal_name: string; short_code: string }>).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.legal_name} ({p.short_code})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.finance.entities.new.fields.ownershipPct", undefined, "Ownership % — This Entity in Parent")}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                name="ownership_pct"
                defaultValue={e.ownership_pct ?? 100}
                className={`${INPUT} font-mono`}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.finance.entities.new.fields.consolidationMethod", undefined, "Consolidation Method")}
              </span>
              <select name="consolidation_method" defaultValue={e.consolidation_method} className={INPUT}>
                {["full", "equity", "proportional", "none"].map((m) => (
                  <option key={m} value={m}>
                    {t(`console.finance.entities.new.consolidationMethod.${m}`, undefined, toTitle(m))}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.finance.entities.new.fields.consolidationState", undefined, "Consolidation State")}
              </span>
              <select name="consolidation_state" defaultValue={e.consolidation_state} className={INPUT}>
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
              <span className={LBL}>{t("console.finance.entities.new.fields.effectiveFrom", undefined, "Effective From")}</span>
              <input type="date" name="effective_from" defaultValue={day(e.effective_from)} className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.finance.entities.new.fields.effectiveTo", undefined, "Effective To")}</span>
              <input type="date" name="effective_to" defaultValue={day(e.effective_to)} className={INPUT} />
            </label>
          </div>
        </FormShell>
      </div>
    </>
  );
}
