import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { ConversationPanel } from "@/components/ConversationPanel";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDate, formatMoney } from "@/lib/i18n/format";
import { addCoLine, deleteCoLine, transitionPoChangeOrder } from "./actions";
import { StatusForm } from "@/components/StatusForm";
import { Button } from "@/components/ui/Button";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "error"> = {
  proposed: "muted",
  submitted: "info",
  in_review: "info",
  approved: "success",
  rejected: "error",
  void: "muted",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: co } = await supabase
    .from("po_change_orders")
    .select("*, purchase_order:purchase_order_id(number, title, vendor:vendor_id(name)), project:project_id(name)")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!co) notFound();

  const po = co.purchase_order as unknown as {
    number: string;
    title: string | null;
    vendor: { name: string } | null;
  } | null;

  // po_change_order_lines was orphaned: parent had only a rolled-up
  // amount_cents with no itemized breakdown, so a reviewer couldn't
  // verify what the dollars covered.
  const { data: linesData } = await supabase
    .from("po_change_order_lines")
    .select("id, position, description, quantity, unit_price_cents")
    .eq("po_change_order_id", id)
    .eq("org_id", session.orgId)
    .order("position", { ascending: true });
  type LineRow = { id: string; position: number; description: string; quantity: number; unit_price_cents: number };
  const lines = (linesData ?? []) as unknown as LineRow[];
  const linesTotal = lines.reduce((acc, l) => acc + Math.round(Number(l.quantity) * l.unit_price_cents), 0);
  const totalsMatch = lines.length === 0 || linesTotal === co.amount_cents;
  const editable = co.status === "draft" || co.status === "submitted";

  return (
    <>
      <ModuleHeader
        eyebrow="Procurement"
        breadcrumbs={[
          { label: "PO Change Orders", href: "/console/procurement/po-change-orders" },
          { label: `CO-${co.number}` },
        ]}
        title={`CO #${co.number} — ${co.title}`}
        subtitle={`${po?.number ?? "—"} · ${po?.vendor?.name ?? ""}`}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_TONE[co.status] ?? "muted"}>{toTitle(co.status)}</Badge>
            {co.status === "proposed" && (
              <StatusForm action={transitionPoChangeOrder.bind(null, id, "submitted")} label="Submit" />
            )}
            {(co.status === "submitted" || co.status === "in_review") && (
              <>
                <StatusForm action={transitionPoChangeOrder.bind(null, id, "approved")} label="Approve" />
                <StatusForm action={transitionPoChangeOrder.bind(null, id, "rejected")} label="Reject" />
              </>
            )}
          </div>
        }
      />
      <div className="page-content space-y-5">
        <section className="grid gap-3 md:grid-cols-3">
          <div className="surface p-3">
            <div className="text-xs text-[var(--text-muted)]">Amount</div>
            <div className="text-lg font-semibold">{formatMoney(co.amount_cents)}</div>
          </div>
          <div className="surface p-3">
            <div className="text-xs text-[var(--text-muted)]">Schedule impact</div>
            <div className="text-lg font-semibold">{co.schedule_impact_days} days</div>
          </div>
          <div className="surface p-3">
            <div className="text-xs text-[var(--text-muted)]">Proposed</div>
            <div className="text-lg font-semibold">{formatDate(co.proposed_at)}</div>
          </div>
        </section>
        {co.reason && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">Reason</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap">{co.reason}</p>
          </section>
        )}

        <section className="surface p-5">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold">Line Items</h3>
            <span className="font-mono text-xs text-[var(--text-muted)]">
              {lines.length} line{lines.length === 1 ? "" : "s"} · sum {formatMoney(linesTotal)}
            </span>
          </div>
          {!totalsMatch && (
            <div className="surface-inset mt-3 rounded-md border border-[var(--warning)] p-3 text-xs">
              <strong>Heads up:</strong> the line-item sum ({formatMoney(linesTotal)}) doesn&rsquo;t match the CO amount
              ({formatMoney(co.amount_cents)}). Reconcile before approving — approval rolls the CO amount onto the
              parent PO.
            </div>
          )}
          {lines.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              No itemized breakdown. Add lines below so the reviewer knows what the dollars cover.
            </p>
          ) : (
            <table className="data-table mt-3 w-full">
              <thead>
                <tr>
                  <th className="w-12 text-left">#</th>
                  <th className="text-left">Description</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-right">Line Total</th>
                  {editable && <th />}
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.id}>
                    <td className="font-mono text-xs text-[var(--text-muted)]">{l.position}</td>
                    <td className="text-sm">{l.description}</td>
                    <td className="text-right font-mono">{Number(l.quantity).toFixed(2)}</td>
                    <td className="text-right font-mono">{formatMoney(l.unit_price_cents)}</td>
                    <td className="text-right font-mono">
                      {formatMoney(Math.round(Number(l.quantity) * l.unit_price_cents))}
                    </td>
                    {editable && (
                      <td className="text-right">
                        <form action={deleteCoLine}>
                          <input type="hidden" name="coId" value={id} />
                          <input type="hidden" name="lineId" value={l.id} />
                          <Button type="submit" size="sm" variant="ghost">
                            Remove
                          </Button>
                        </form>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {editable && (
            <form
              action={addCoLine}
              className="surface-inset mt-4 grid grid-cols-1 gap-2 rounded-md p-3 sm:grid-cols-6"
            >
              <input type="hidden" name="coId" value={id} />
              <input
                name="description"
                required
                placeholder="Description"
                maxLength={500}
                className="input-base sm:col-span-3"
              />
              <input
                name="quantity"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="Qty"
                defaultValue="1"
                className="input-base sm:col-span-1"
              />
              <input
                name="unit_price_dollars"
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="Unit $"
                className="input-base sm:col-span-1"
              />
              <Button type="submit" size="sm" variant="secondary" className="sm:col-span-1">
                Add Line
              </Button>
            </form>
          )}
          {!editable && (
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              Lines are locked once the CO is in review / approved / rejected / void.
            </p>
          )}
        </section>

        <ConversationPanel orgId={session.orgId} recordType="po_change_order" recordId={id} />
      </div>
    </>
  );
}
