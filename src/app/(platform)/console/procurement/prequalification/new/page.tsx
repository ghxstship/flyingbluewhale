import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { invitePrequalification } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const [{ data: vendors }, { data: qs }] = await Promise.all([
    supabase.from("vendors").select("id, name").eq("org_id", session.orgId).order("name"),
    supabase
      .from("prequalification_questionnaires")
      .select("id, name, code")
      .eq("org_id", session.orgId)
      .eq("active", true)
      .order("name"),
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.prequalification.new.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.prequalification.new.title", undefined, "Invite Vendor to Prequalify")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={invitePrequalification}
          cancelHref="/console/procurement/prequalification"
          submitLabel={t("console.procurement.prequalification.new.submit", undefined, "Send Invitation")}
        >
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.procurement.prequalification.new.vendorLabel", undefined, "Vendor")}
              <span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <select name="vendor_id" required className={INPUT}>
              <option value="">{t("common.selectPlaceholder", undefined, "Select…")}</option>
              {(vendors ?? []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.procurement.prequalification.new.questionnaireLabel", undefined, "Questionnaire")}
              <span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <select name="questionnaire_id" required className={INPUT}>
              <option value="">{t("common.selectPlaceholder", undefined, "Select…")}</option>
              {(qs ?? []).map((q) => (
                <option key={q.id} value={q.id}>
                  {q.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.procurement.prequalification.new.expiresLabel", undefined, "Expires")}
            </span>
            <input type="date" name="expires_at" className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
