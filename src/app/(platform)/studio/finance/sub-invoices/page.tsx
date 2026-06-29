import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import {
  NEXT_SUB_INVOICE_STATES,
  SUB_INVOICE_BADGE,
  SUB_INVOICE_STATE_LABELS,
  formatCents,
  type SubInvoiceState,
} from "@/lib/subcontractor";
import { transitionSubInvoiceForm } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  amount_cents: number;
  invoice_state: SubInvoiceState;
  submitted_on: string;
  vendor: { name: string | null } | null;
  work_order: { title: string | null } | null;
};

const TRANSITION_LABEL: Partial<Record<SubInvoiceState, string>> = {
  approved: "Approve",
  rejected: "Reject",
  paid: "Mark paid",
};

export default async function SubInvoicesPage() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data } = await supabase
    .from("sub_invoices")
    .select("id, amount_cents, invoice_state, submitted_on, vendor:vendor_id(name), work_order:work_order_id(title)")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("submitted_on", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as unknown as Row[];

  const outstanding = rows.filter((r) => r.invoice_state === "submitted" || r.invoice_state === "approved");
  const outstandingCents = outstanding.reduce((s, r) => s + r.amount_cents, 0);
  const paidCents = rows.filter((r) => r.invoice_state === "paid").reduce((s, r) => s + r.amount_cents, 0);

  return (
    // data-brand makes the printable invoice inherit the org/client white-label
    // palette (same contract as kit-documents / kit-reports).
    <div data-brand="atlvs">
      <ModuleHeader
        eyebrow={t("console.finance.subInvoices.eyebrow", undefined, "Finance")}
        title={t("console.finance.subInvoices.title", undefined, "Sub Invoices")}
        subtitle={t(
          "console.finance.subInvoices.subtitle",
          undefined,
          "Inbound subcontractor payment applications, submitted against approved work orders.",
        )}
      />
      <div className="metric-grid mb-6">
        <MetricCard label={t("console.finance.subInvoices.outstanding", undefined, "Outstanding")} value={formatCents(outstandingCents)} />
        <MetricCard label={t("console.finance.subInvoices.paid", undefined, "Paid")} value={formatCents(paidCents)} />
        <MetricCard label={t("console.finance.subInvoices.count", undefined, "Invoices")} value={String(rows.length)} />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={t("console.finance.subInvoices.empty", undefined, "No sub-invoices yet")}
          description={t(
            "console.finance.subInvoices.emptyBody",
            undefined,
            "Subcontractor invoices appear here once a work order is approved and the sub submits a payment application.",
          )}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.id} className="surface flex flex-wrap items-center gap-3 rounded-[var(--p-r-lg)] border border-[var(--p-border)] p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{r.vendor?.name ?? "Vendor"}</span>
                  <Badge variant={SUB_INVOICE_BADGE[r.invoice_state]}>{SUB_INVOICE_STATE_LABELS[r.invoice_state]}</Badge>
                </div>
                <div className="text-xs text-[var(--p-text-2)]">
                  {r.work_order?.title ?? "—"} · {r.submitted_on}
                </div>
              </div>
              <span className="font-mono text-lg">{formatCents(r.amount_cents)}</span>
              <div className="flex gap-2">
                {(NEXT_SUB_INVOICE_STATES[r.invoice_state] ?? []).map((to) => (
                  <form key={to} action={transitionSubInvoiceForm.bind(null, r.id, to)}>
                    <Button type="submit" variant={to === "rejected" ? "danger" : "secondary"} size="sm">
                      {TRANSITION_LABEL[to] ?? SUB_INVOICE_STATE_LABELS[to]}
                    </Button>
                  </form>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
