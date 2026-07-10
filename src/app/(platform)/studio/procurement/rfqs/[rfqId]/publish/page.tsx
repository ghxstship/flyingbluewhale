import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { notFound } from "next/navigation";
import { publishRfqAction } from "./actions";

export const dynamic = "force-dynamic";

type Rfq = {
  id: string;
  title: string;
  visibility: string;
  trade_categories: string[];
  region: string | null;
  budget_band: string | null;
  due_at: string | null;
  requires_prequalification: boolean;
  requires_insurance: boolean;
  requires_w9: boolean;
  nda_required: boolean;
};

export default async function Page({ params }: { params: Promise<{ rfqId: string }> }) {
  const { rfqId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase.from("rfqs").select("*").eq("id", rfqId).eq("org_id", session.orgId).maybeSingle();
  if (!data) return notFound();
  const r = data as Rfq;
  const { t } = await getRequestT();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.rfqs.publish.eyebrow", { title: r.title }, `Procurement · ${r.title}`)}
        title={t("console.procurement.rfqs.publish.title", undefined, "Publish RFQ")}
        subtitle={t("console.procurement.rfqs.publish.subtitle", undefined, "Publish to the public marketplace.")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={publishRfqAction}
          cancelHref={`/studio/procurement/rfqs/${r.id}`}
          submitLabel={t("console.procurement.rfqs.publish.submit", undefined, "Update Visibility")}
        >
          <input type="hidden" name="rfq_id" value={r.id} />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.procurement.rfqs.publish.visibilityLabel", undefined, "Visibility")}
            </label>
            <select name="visibility" className="ps-input mt-1.5 w-full" defaultValue={r.visibility}>
              <option value="private">
                {t("console.procurement.rfqs.publish.visibility.private", undefined, "Private (invited vendors only)")}
              </option>
              <option value="network">
                {t(
                  "console.procurement.rfqs.publish.visibility.network",
                  undefined,
                  "Network (your prequalified pool)",
                )}
              </option>
              <option value="public">
                {t(
                  "console.procurement.rfqs.publish.visibility.public",
                  undefined,
                  "Public (listed in /marketplace/rfqs)",
                )}
              </option>
            </select>
          </div>
          <Input
            label={t(
              "console.procurement.rfqs.publish.tradeCategoriesLabel",
              undefined,
              "Trade Categories (Comma-separated)",
            )}
            name="trade_categories"
            defaultValue={r.trade_categories.join(", ")}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("console.procurement.rfqs.publish.regionLabel", undefined, "Region")}
              name="region"
              defaultValue={r.region ?? ""}
            />
            <Input
              label={t("console.procurement.rfqs.publish.budgetBandLabel", undefined, "Budget Band")}
              name="budget_band"
              defaultValue={r.budget_band ?? ""}
              placeholder="$10k-$25k"
            />
          </div>
          <Input
            label={t("console.procurement.rfqs.publish.bidDeadlineLabel", undefined, "Bid Deadline")}
            name="due_at"
            type="datetime-local"
            defaultValue={r.due_at ? r.due_at.slice(0, 16) : ""}
          />
          <fieldset className="surface-inset flex flex-col gap-2 p-3">
            <legend className="text-xs font-medium tracking-wide uppercase">
              {t("console.procurement.rfqs.publish.complianceGates", undefined, "Compliance Gates")}
            </legend>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="requires_prequalification" defaultChecked={r.requires_prequalification} />
              {t(
                "console.procurement.rfqs.publish.gate.prequalification",
                undefined,
                "Vendors must complete prequalification before bidding",
              )}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="requires_insurance" defaultChecked={r.requires_insurance} />
              {t("console.procurement.rfqs.publish.gate.insurance", undefined, "Current COI on file required")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="requires_w9" defaultChecked={r.requires_w9} />
              {t("console.procurement.rfqs.publish.gate.w9", undefined, "W-9 / W-8 on file required")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="nda_required" defaultChecked={r.nda_required} />
              {t("console.procurement.rfqs.publish.gate.nda", undefined, "NDA acceptance required to view scope")}
            </label>
          </fieldset>
        </FormShell>
      </div>
    </>
  );
}
