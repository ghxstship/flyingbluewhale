import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/i18n/format";
import { STATUS_TONE } from "@/lib/marketplace";
import { toTitle } from "@/lib/format";
import { addSettlementLine, deleteSettlementLine } from "./actions";

const LINE_KIND_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  revenue: "success",
  expense: "warning",
  adjustment: "info",
  tax: "muted",
  fee: "muted",
  split: "info",
};

export const dynamic = "force-dynamic";

type Settlement = {
  id: string;
  show_date: string;
  status: string;
  gross_box_office_cents: number;
  sales_tax_cents: number;
  amusement_tax_cents: number;
  cc_fee_cents: number;
  nbor_cents: number;
  paid_attendance: number;
  comp_count: number;
  walkout_count: number;
  bar_revenue_cents: number;
  merch_revenue_cents: number;
  other_revenue_cents: number;
  artist_payout_cents: number;
  agent_commission_cents: number;
  support_act_payout_cents: number;
  deposit_received_cents: number;
  balance_due_cents: number;
  finalized_at: string | null;
  talent_offer_id: string | null;
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("settlements")
    .select("*")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!data) return notFound();
  const s = data as Settlement;

  // settlement_lines is an itemized breakdown that was orphaned at the
  // UI layer until now — the rolled-up cents columns on settlements
  // only tell you the bottom line, not which receipts justify it.
  const { data: linesData } = await supabase
    .from("settlement_lines")
    .select("id, kind, category, description, amount_cents, sort_order, evidence_url, created_at")
    .eq("settlement_id", s.id)
    .eq("org_id", session.orgId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  type LineRow = {
    id: string;
    kind: string;
    category: string | null;
    description: string | null;
    amount_cents: number;
    sort_order: number;
    evidence_url: string | null;
    created_at: string;
  };
  const lines = (linesData ?? []) as unknown as LineRow[];
  const lineTotal = lines.reduce((acc, l) => acc + l.amount_cents, 0);
  const editable = !s.finalized_at;

  return (
    <>
      <ModuleHeader
        eyebrow="Settlement"
        title={s.show_date}
        subtitle={s.finalized_at ? `Finalized ${new Date(s.finalized_at).toLocaleString()}` : "Draft / reconciling"}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_TONE[s.status] ?? "muted"}>{toTitle(s.status)}</Badge>
            {s.talent_offer_id && (
              <Button href={`/console/bookings/deals/${s.talent_offer_id}/settlement`} size="sm" variant="ghost">
                Edit on deal
              </Button>
            )}
          </div>
        }
      />
      <div className="page-content max-w-3xl space-y-5">
        <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="surface p-4">
            <div className="text-label text-[var(--text-muted)]">GBOR</div>
            <div className="font-mono text-lg">{formatMoney(s.gross_box_office_cents)}</div>
          </div>
          <div className="surface p-4">
            <div className="text-label text-[var(--text-muted)]">NBOR</div>
            <div className="font-mono text-lg">{formatMoney(s.nbor_cents)}</div>
          </div>
          <div className="surface p-4">
            <div className="text-label text-[var(--text-muted)]">Balance Due</div>
            <div className="font-mono text-lg">{formatMoney(s.balance_due_cents)}</div>
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">Revenue</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-[var(--text-secondary)]">Paid attendance</dt>
            <dd className="font-mono">{s.paid_attendance}</dd>
            <dt className="text-[var(--text-secondary)]">Comps</dt>
            <dd className="font-mono">{s.comp_count}</dd>
            <dt className="text-[var(--text-secondary)]">Walkouts</dt>
            <dd className="font-mono">{s.walkout_count}</dd>
            <dt className="text-[var(--text-secondary)]">Bar</dt>
            <dd className="font-mono">{formatMoney(s.bar_revenue_cents)}</dd>
            <dt className="text-[var(--text-secondary)]">Merch</dt>
            <dd className="font-mono">{formatMoney(s.merch_revenue_cents)}</dd>
            <dt className="text-[var(--text-secondary)]">Other</dt>
            <dd className="font-mono">{formatMoney(s.other_revenue_cents)}</dd>
          </dl>
        </section>

        <section className="surface p-5">
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">Deductions</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-[var(--text-secondary)]">Sales tax</dt>
            <dd className="font-mono">{formatMoney(s.sales_tax_cents)}</dd>
            <dt className="text-[var(--text-secondary)]">Amusement tax</dt>
            <dd className="font-mono">{formatMoney(s.amusement_tax_cents)}</dd>
            <dt className="text-[var(--text-secondary)]">CC fees</dt>
            <dd className="font-mono">{formatMoney(s.cc_fee_cents)}</dd>
          </dl>
        </section>

        <section className="surface p-5">
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">Splits</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-[var(--text-secondary)]">Artist payout</dt>
            <dd className="font-mono">{formatMoney(s.artist_payout_cents)}</dd>
            <dt className="text-[var(--text-secondary)]">Agent commission</dt>
            <dd className="font-mono">{formatMoney(s.agent_commission_cents)}</dd>
            <dt className="text-[var(--text-secondary)]">Support act</dt>
            <dd className="font-mono">{formatMoney(s.support_act_payout_cents)}</dd>
            <dt className="text-[var(--text-secondary)]">Deposit received</dt>
            <dd className="font-mono">{formatMoney(s.deposit_received_cents)}</dd>
          </dl>
        </section>

        <section className="surface p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold tracking-wide uppercase">Line Items</h2>
            <span className="font-mono text-xs text-[var(--text-muted)]">
              {lines.length} line{lines.length === 1 ? "" : "s"} · net {formatMoney(lineTotal)}
            </span>
          </div>
          {lines.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              No itemized lines yet. Lines back the rolled-up cents columns with the receipts that justify them.
            </p>
          ) : (
            <table className="data-table mt-3 w-full">
              <thead>
                <tr>
                  <th className="text-left">Kind</th>
                  <th className="text-left">Category</th>
                  <th className="text-left">Description</th>
                  <th className="text-right">Amount</th>
                  {editable && <th />}
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <Badge variant={LINE_KIND_TONE[l.kind] ?? "muted"}>{toTitle(l.kind)}</Badge>
                    </td>
                    <td className="text-xs">{l.category ?? "—"}</td>
                    <td className="text-xs">{l.description ?? "—"}</td>
                    <td className="text-right font-mono">{formatMoney(l.amount_cents)}</td>
                    {editable && (
                      <td className="text-right">
                        <form action={deleteSettlementLine}>
                          <input type="hidden" name="settlementId" value={s.id} />
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
              action={addSettlementLine}
              className="surface-inset mt-4 grid grid-cols-1 gap-2 rounded-md p-3 sm:grid-cols-6"
            >
              <input type="hidden" name="settlementId" value={s.id} />
              <select name="kind" required defaultValue="expense" className="input-base sm:col-span-1">
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
                <option value="adjustment">Adjustment</option>
                <option value="tax">Tax</option>
                <option value="fee">Fee</option>
                <option value="split">Split</option>
              </select>
              <input name="category" placeholder="Category" maxLength={80} className="input-base sm:col-span-1" />
              <input
                name="description"
                placeholder="Description"
                maxLength={240}
                className="input-base sm:col-span-2"
              />
              <input
                name="amount_dollars"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                className="input-base sm:col-span-1"
              />
              <Button type="submit" size="sm" variant="secondary" className="sm:col-span-1">
                Add Line
              </Button>
            </form>
          )}
          {!editable && (
            <p className="mt-3 text-xs text-[var(--text-muted)]">Settlement is finalized — line items are locked.</p>
          )}
        </section>
      </div>
    </>
  );
}
