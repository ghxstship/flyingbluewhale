import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createGoodsReceipt } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">
        {t("console.procurement.receiving.new.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const session = await requireSession();
  const supabase = await createClient();

  const { data: poData } = await supabase
    .from("purchase_orders")
    .select("id, number, title")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("number")
    .limit(1000);
  const pos = (poData ?? []) as { id: string; number: string; title: string }[];

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.receiving.new.eyebrow", undefined, "Receiving")}
        title={t("console.procurement.receiving.new.title", undefined, "New goods receipt")}
      />
      <div className="page-content max-w-2xl">
        {pos.length === 0 ? (
          <EmptyState
            title={t("console.procurement.receiving.new.noPosTitle", undefined, "No purchase orders")}
            description={t(
              "console.procurement.receiving.new.noPosDescription",
              undefined,
              "Create a purchase order before recording a goods receipt against it.",
            )}
            action={
              <Button href="/studio/procurement/purchase-orders" size="sm">
                {t("console.procurement.receiving.new.goToPos", undefined, "Purchase orders")}
              </Button>
            }
          />
        ) : (
          <FormShell
            action={createGoodsReceipt}
            cancelHref="/studio/procurement/receiving"
            submitLabel={t("common.create", undefined, "Create")}
          >
            <div>
              <label htmlFor="po_id" className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.procurement.receiving.new.poLabel", undefined, "Purchase Order")}
              </label>
              <select id="po_id" name="po_id" required className="ps-input mt-1.5 w-full" defaultValue="">
                <option value="" disabled>
                  {t("console.procurement.receiving.new.poPlaceholder", undefined, "Select a purchase order…")}
                </option>
                {pos.map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.number} · {po.title}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label={t("console.procurement.receiving.new.receiptNumberLabel", undefined, "Receipt number")}
              name="receipt_number"
              required
              maxLength={64}
              placeholder="GR-0001"
            />
            <Input
              label={t("console.procurement.receiving.new.receivedAtLabel", undefined, "Received at")}
              name="received_at"
              type="date"
              defaultValue={today}
              required
            />
            <label className="flex items-center gap-2 text-sm text-[var(--p-text-1)]">
              <input type="checkbox" name="partial" className="size-4 accent-[var(--p-accent)]" />
              {t("console.procurement.receiving.new.partialLabel", undefined, "Partial delivery")}
            </label>
            <div>
              <label htmlFor="notes" className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.procurement.receiving.new.notesLabel", undefined, "Notes")}
              </label>
              <textarea id="notes" name="notes" rows={3} maxLength={1000} className="ps-input mt-1.5 w-full" />
            </div>
          </FormShell>
        )}
      </div>
    </>
  );
}
