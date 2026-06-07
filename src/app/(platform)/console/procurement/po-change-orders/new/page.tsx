import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createPoChangeOrder } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--p-text-2)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
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
        eyebrow={t("console.procurement.poChangeOrders.new.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.poChangeOrders.new.title", undefined, "New PO change order")}
        subtitle={t(
          "console.procurement.poChangeOrders.new.subtitle",
          undefined,
          "Adjust commitment value and schedule on an existing PO.",
        )}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createPoChangeOrder}
          cancelHref="/console/procurement/po-change-orders"
          submitLabel={t("console.procurement.poChangeOrders.new.submit", undefined, "Propose")}
        >
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.procurement.poChangeOrders.new.purchaseOrder", undefined, "Purchase order")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <select name="purchase_order_id" required className={INPUT}>
              <option value="">{t("common.selectPlaceholder", undefined, "Select…")}</option>
              {(pos ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.number} — {p.title ?? ""}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.procurement.poChangeOrders.new.titleLabel", undefined, "Title")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <input
              name="title"
              required
              placeholder={t(
                "console.procurement.poChangeOrders.new.titlePlaceholder",
                undefined,
                "Add 4 dimmers + cabling for FOH expansion",
              )}
              className={INPUT}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.procurement.poChangeOrders.new.reason", undefined, "Reason")}</span>
            <textarea
              name="reason"
              rows={3}
              placeholder={t(
                "console.procurement.poChangeOrders.new.reasonPlaceholder",
                undefined,
                "Why is this change happening?",
              )}
              className={INPUT}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.procurement.poChangeOrders.new.amount", undefined, "Amount ($)")}</span>
              <input type="number" step="any" name="amount" defaultValue="0" className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.procurement.poChangeOrders.new.scheduleImpact", undefined, "Schedule Impact — Days")}
              </span>
              <input type="number" name="schedule_impact_days" defaultValue="0" className={INPUT} />
            </label>
          </div>
        </FormShell>
      </div>
    </>
  );
}
