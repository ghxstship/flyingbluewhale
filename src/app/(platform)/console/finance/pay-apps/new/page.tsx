import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createPayApp } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const { t } = await getRequestT();
  const session = await requireSession();
  const supabase = await createClient();
  const { data: pos } = await supabase
    .from("purchase_orders")
    .select("id, number, title, project_id, vendor_id, project:project_id(name), vendor:vendor_id(name)")
    .eq("org_id", session.orgId)
    .in("status", ["sent", "acknowledged", "fulfilled"])
    .order("number", { ascending: false })
    .limit(200);

  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.payApps.new.eyebrow", undefined, "Finance")}
        title={t("console.finance.payApps.new.title", undefined, "New Pay Application")}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createPayApp}
          cancelHref="/console/finance/pay-apps"
          submitLabel={t("console.finance.payApps.new.submit", undefined, "Create Draft")}
        >
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.finance.payApps.new.purchaseOrder", undefined, "Purchase order")}
              <span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <select name="purchase_order_id" required className={INPUT}>
              <option value="">{t("common.selectEllipsis", undefined, "Select…")}</option>
              {(pos ?? []).map((p) => {
                const project = p.project as unknown as { name: string | null } | null;
                const vendor = p.vendor as unknown as { name: string | null } | null;
                return (
                  <option key={p.id} value={p.id}>
                    {p.number} — {p.title ?? project?.name ?? vendor?.name ?? "—"}
                  </option>
                );
              })}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.finance.payApps.new.periodStart", undefined, "Period start")}
                <span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <input type="date" name="period_start" required defaultValue={monthAgo} className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.finance.payApps.new.periodEnd", undefined, "Period end")}
                <span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <input type="date" name="period_end" required defaultValue={today} className={INPUT} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.finance.payApps.new.retentionPct", undefined, "Retention %")}</span>
            <input
              type="number"
              name="retention_pct"
              min="0"
              max="100"
              step="0.1"
              defaultValue="10"
              className={INPUT}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.finance.payApps.new.notes", undefined, "Notes")}</span>
            <textarea name="notes" rows={3} className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
