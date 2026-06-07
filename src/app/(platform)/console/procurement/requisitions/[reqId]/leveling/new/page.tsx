import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { addResponse } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--p-text-2)]";

export default async function Page({ params }: { params: Promise<{ reqId: string }> }) {
  const { reqId } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const { t } = await getRequestT();
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
        eyebrow={t("console.procurement.requisitions.leveling.new.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.requisitions.leveling.new.title", undefined, "Add Bid Response")}
        subtitle={t(
          "console.procurement.requisitions.leveling.new.subtitle",
          undefined,
          "Record a vendor's quote against this RFQ.",
        )}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={addResponse.bind(null, reqId)}
          cancelHref={`/console/procurement/requisitions/${reqId}/leveling`}
          submitLabel={t("common.add", undefined, "Add")}
        >
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.procurement.requisitions.leveling.new.vendorLabel", undefined, "Vendor")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
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
              {t("console.procurement.requisitions.leveling.new.totalLabel", undefined, "Total ($)")}
            </span>
            <input type="number" step="any" name="total" className={INPUT} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("common.notes", undefined, "Notes")}</span>
            <textarea name="notes" rows={3} className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
