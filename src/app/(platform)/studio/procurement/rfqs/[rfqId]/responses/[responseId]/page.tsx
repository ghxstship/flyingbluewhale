import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import { timeAgo, toTitle } from "@/lib/format";
import { addResponseLine, deleteResponseLineById } from "./actions";
import { DeleteForm } from "@/components/DeleteForm";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type ResponseRow = {
  id: string;
  response_state: string;
  total_cents: number | null;
  notes: string | null;
  submitted_at: string | null;
  awarded_at: string | null;
  vendor_id: string | null;
  vendor: { id: string; name: string | null } | null;
};

type LineRow = {
  id: string;
  position: number;
  description: string;
  quantity: number;
  unit_price_cents: number;
  notes: string | null;
};

export default async function Page({ params }: { params: Promise<{ rfqId: string; responseId: string }> }) {
  const { rfqId, responseId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">
        {t("console.procurement.rfqs.responses.detail.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const session = await requireSession();
  const supabase = await createClient();

  const { data: rfqData } = await supabase
    .from("rfqs")
    .select("id, title, rfq_state")
    .eq("id", rfqId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  const rfq = rfqData as { id: string; title: string; rfq_state: string } | null;
  if (!rfq) notFound();

  const { data: respData } = await supabase
    .from("rfq_responses")
    .select("id, response_state, total_cents, notes, submitted_at, awarded_at, vendor_id, vendor:vendor_id(id, name)")
    .eq("id", responseId)
    .eq("requisition_id", rfqId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  const response = respData as unknown as ResponseRow | null;
  if (!response) notFound();

  // Line items were orphaned: rfq_response_lines existed in schema but
  // no surface rendered them, so a buyer could only see the headline
  // total_cents and had no way to compare apples-to-apples on individual
  // SKUs across vendors.
  const { data: linesData } = await supabase
    .from("rfq_response_lines")
    .select("id, position, description, quantity, unit_price_cents, notes")
    .eq("rfq_response_id", responseId)
    .eq("org_id", session.orgId)
    .order("position", { ascending: true });
  const lines = (linesData ?? []) as unknown as LineRow[];
  const linesTotal = lines.reduce((acc, l) => acc + Math.round(Number(l.quantity) * l.unit_price_cents), 0);
  const totalsMatch = response.total_cents != null ? response.total_cents === linesTotal : true;
  const editable = response.response_state !== "awarded" && response.response_state !== "declined";

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.rfqs.responses.detail.eyebrow", undefined, "Procurement · Response")}
        title={
          response.vendor?.name ??
          t("console.procurement.rfqs.responses.detail.unknownVendor", undefined, "Unknown Vendor")
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant={toneFor(response.response_state)}>{toTitle(response.response_state)}</Badge>
            {response.submitted_at && (
              <span className="font-mono text-xs">
                {t(
                  "console.procurement.rfqs.responses.detail.submittedAgo",
                  { ago: timeAgo(response.submitted_at) },
                  `submitted ${timeAgo(response.submitted_at)}`,
                )}
              </span>
            )}
            {response.awarded_at && (
              <span className="font-mono text-xs">
                {t(
                  "console.procurement.rfqs.responses.detail.awardedAgo",
                  { ago: timeAgo(response.awarded_at) },
                  `awarded ${timeAgo(response.awarded_at)}`,
                )}
              </span>
            )}
          </span>
        }
        breadcrumbs={[
          { label: t("console.procurement.breadcrumb", undefined, "Procurement"), href: "/studio/procurement" },
          { label: t("console.procurement.rfqs.breadcrumb", undefined, "RFQs"), href: "/studio/procurement/rfqs" },
          { label: rfq.title, href: `/studio/procurement/rfqs/${rfqId}` },
          {
            label: t("console.procurement.rfqs.responses.breadcrumb", undefined, "Responses"),
            href: `/studio/procurement/rfqs/${rfqId}/responses`,
          },
          {
            label:
              response.vendor?.name ??
              t("console.procurement.rfqs.responses.detail.responseBreadcrumb", undefined, "Response"),
          },
        ]}
        action={
          <Button href={`/studio/procurement/rfqs/${rfqId}/responses`} variant="ghost" size="sm">
            {t("common.back", undefined, "Back")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.procurement.rfqs.responses.detail.metric.headlineTotal", undefined, "Headline Total")}
            value={response.total_cents != null ? formatMoney(response.total_cents) : "—"}
          />
          <MetricCard
            label={t("console.procurement.rfqs.responses.detail.metric.lineItemSum", undefined, "Line-Item Sum")}
            value={formatMoney(linesTotal)}
            accent={!totalsMatch}
          />
          <MetricCard
            label={t("console.procurement.rfqs.responses.detail.metric.lines", undefined, "Lines")}
            value={String(lines.length)}
          />
        </div>

        {!totalsMatch && (
          <div className="surface-inset rounded-md border border-[var(--p-warning)] p-3 text-xs">
            <strong>{t("console.procurement.rfqs.responses.detail.headsUp", undefined, "Heads up:")}</strong>{" "}
            {t(
              "console.procurement.rfqs.responses.detail.mismatch",
              {
                lineSum: formatMoney(linesTotal),
                headline: response.total_cents != null ? formatMoney(response.total_cents) : "—",
              },
              `the line-item sum (${formatMoney(linesTotal)}) doesn’t match the headline total (${response.total_cents != null ? formatMoney(response.total_cents) : "—"}). Reconcile before awarding.`,
            )}
          </div>
        )}

        {response.notes && (
          <section className="surface p-4">
            <h2 className="text-sm font-semibold">
              {t("console.procurement.rfqs.responses.detail.vendorNotes", undefined, "Vendor Notes")}
            </h2>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{response.notes}</p>
          </section>
        )}

        <section className="surface p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold tracking-wide uppercase">
              {t("console.procurement.rfqs.responses.detail.lineItems", undefined, "Line Items")}
            </h2>
            <span className="font-mono text-xs text-[var(--p-text-2)]">
              {t(
                "console.procurement.rfqs.responses.detail.linesCount",
                { count: lines.length },
                `${lines.length} lines`,
              )}
            </span>
          </div>
          {lines.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t(
                "console.procurement.rfqs.responses.detail.empty",
                undefined,
                "No itemized bid. Add lines below to break out SKU-level pricing for like-for-like comparison.",
              )}
            </p>
          ) : (
            <table className="ps-table mt-3 w-full">
              <thead>
                <tr>
                  <th className="w-12 text-start">#</th>
                  <th className="text-start">
                    {t("console.procurement.rfqs.responses.detail.col.description", undefined, "Description")}
                  </th>
                  <th className="text-right">
                    {t("console.procurement.rfqs.responses.detail.col.qty", undefined, "Qty")}
                  </th>
                  <th className="text-right">
                    {t("console.procurement.rfqs.responses.detail.col.unitPrice", undefined, "Unit Price")}
                  </th>
                  <th className="text-right">
                    {t("console.procurement.rfqs.responses.detail.col.lineTotal", undefined, "Line Total")}
                  </th>
                  {editable && <th />}
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.id}>
                    <td className="font-mono text-xs text-[var(--p-text-2)]">{l.position}</td>
                    <td>
                      <div className="text-sm">{l.description}</div>
                      {l.notes && <div className="text-xs text-[var(--p-text-2)]">{l.notes}</div>}
                    </td>
                    <td className="text-right font-mono">{Number(l.quantity).toFixed(2)}</td>
                    <td className="text-right font-mono">{formatMoney(l.unit_price_cents)}</td>
                    <td className="text-right font-mono">
                      {formatMoney(Math.round(Number(l.quantity) * l.unit_price_cents))}
                    </td>
                    {editable && (
                      <td className="text-right">
                        <DeleteForm
                          action={deleteResponseLineById.bind(null, rfqId, responseId, l.id)}
                          label={t("common.remove", undefined, "Remove")}
                          confirm={t(
                            "console.procurement.rfqs.responses.deleteLineConfirm",
                            undefined,
                            "Remove this response line? The headline total is recalculated.",
                          )}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {editable && (
            <form
              action={addResponseLine}
              className="surface-inset mt-4 grid grid-cols-1 gap-2 rounded-md p-3 sm:grid-cols-6"
            >
              <input type="hidden" name="rfqId" value={rfqId} />
              <input type="hidden" name="responseId" value={responseId} />
              <input
                name="description"
                required
                placeholder={t("console.procurement.rfqs.responses.detail.col.description", undefined, "Description")}
                maxLength={500}
                className="ps-input sm:col-span-3"
              />
              <input
                name="quantity"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder={t("console.procurement.rfqs.responses.detail.col.qty", undefined, "Qty")}
                defaultValue="1"
                className="ps-input sm:col-span-1"
              />
              <input
                name="unit_price_dollars"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder={t("console.procurement.rfqs.responses.detail.placeholder.unitPrice", undefined, "Unit $")}
                className="ps-input sm:col-span-1"
              />
              <Button type="submit" size="sm" variant="secondary" className="sm:col-span-1">
                {t("console.procurement.rfqs.responses.detail.addLine", undefined, "Add Line")}
              </Button>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
