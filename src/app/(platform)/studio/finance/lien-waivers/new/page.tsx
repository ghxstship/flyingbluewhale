import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { createLienWaiver } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--p-text-2)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const [{ data: projects }, { data: vendors }] = await Promise.all([
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).is("deleted_at", null).order("name"),
    supabase.from("vendors").select("id, name").eq("org_id", session.orgId).is("deleted_at", null).order("name"),
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.lienWaivers.new.eyebrow", undefined, "Finance")}
        title={t("console.finance.lienWaivers.new.title", undefined, "New Lien Waiver")}
        subtitle={t(
          "console.finance.lienWaivers.new.subtitle",
          undefined,
          "Statutory release of mechanic's lien rights. Conditional waivers release on payment clearing; unconditional waivers release on signature.",
        )}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createLienWaiver}
          cancelHref="/studio/finance/lien-waivers"
          submitLabel={t("console.finance.lienWaivers.new.submit", undefined, "Create Waiver")}
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.finance.lienWaivers.new.project", undefined, "Project")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <select name="project_id" required className={INPUT}>
                <option value="">{t("common.selectPlaceholder", undefined, "Select…")}</option>
                {((projects ?? []) as Array<{ id: string; name: string }>).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.finance.lienWaivers.new.subVendor", undefined, "Sub / Vendor")}</span>
              <select name="vendor_id" className={INPUT}>
                <option value="">—</option>
                {((vendors ?? []) as Array<{ id: string; name: string }>).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.finance.lienWaivers.new.type", undefined, "Type")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <select name="waiver_type" required className={INPUT} defaultValue="conditional">
                {["conditional", "unconditional"].map((opt) => (
                  <option key={opt} value={opt}>
                    {toTitle(opt)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.finance.lienWaivers.new.scope", undefined, "Scope")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <select name="waiver_scope" required className={INPUT} defaultValue="partial">
                {["partial", "final"].map((s) => (
                  <option key={s} value={s}>
                    {toTitle(s)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <MoneyInput
              label={t("console.finance.lienWaivers.new.amountUsd", undefined, "Amount (USD)")}
              name="amount_cents"
            />
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.finance.lienWaivers.new.throughDate", undefined, "Through date")}</span>
              <input type="date" name="through_date" className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.finance.lienWaivers.new.stateJurisdiction", undefined, "State jurisdiction")}
              </span>
              <input
                name="state_jurisdiction"
                placeholder={t(
                  "console.finance.lienWaivers.new.stateJurisdictionPlaceholder",
                  undefined,
                  "CA, NV, TX…",
                )}
                maxLength={4}
                className={`${INPUT} font-mono`}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.finance.lienWaivers.new.notes", undefined, "Notes")}</span>
            <textarea name="notes" rows={3} className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
