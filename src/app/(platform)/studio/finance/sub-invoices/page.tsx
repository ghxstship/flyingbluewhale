import Link from "next/link";
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
  waiverBadge,
  waiverOnFile,
  type SubInvoiceState,
} from "@/lib/subcontractor";
import { transitionSubInvoiceForm } from "./actions";

export const dynamic = "force-dynamic";

// Phase A §09 (kit 20 REPO_LANDING §1): the sub_invoices table is merged
// into `invoices` behind the source facet. This route stays as the AP lens —
// same store as /studio/finance/invoices, filtered to source='ap_sub', with
// the waiver gate + Waiver Blocked view the kit contract requires.

type Row = {
  id: string;
  number: string;
  amount_cents: number;
  retainage_pct: number;
  invoice_state: SubInvoiceState;
  issued_at: string | null;
  lien_waiver_id: string | null;
  vendor: { name: string | null } | null;
  work_order: { title: string | null } | null;
  waiver: { waiver_state: string | null } | null;
};

const TRANSITION_LABEL: Partial<Record<SubInvoiceState, string>> = {
  approved: "Approve",
  rejected: "Reject",
  paid: "Mark paid",
};

export default async function SubInvoicesPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  if (!hasSupabase) return null;
  const [{ view }, session] = await Promise.all([searchParams, requireSession()]);
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data } = await supabase
    .from("invoices")
    .select(
      "id, number, amount_cents, retainage_pct, invoice_state, issued_at, lien_waiver_id, vendor:vendor_id(name), work_order:work_order_id(title), waiver:lien_waiver_id(waiver_state)",
    )
    .eq("org_id", session.orgId)
    .eq("source", "ap_sub")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as unknown as Row[];

  const isBlocked = (r: Row) => !waiverOnFile(r.waiver?.waiver_state) && r.invoice_state !== "paid";
  const blocked = rows.filter(isBlocked);
  const visible = view === "blocked" ? blocked : rows;

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
          "Inbound subcontractor payment applications. An AP lens on Invoices: waiver on file before pay releases.",
        )}
        action={
          <Button href="/studio/finance/invoices" size="sm" variant="secondary">
            {t("console.finance.subInvoices.allInvoices", undefined, "All Invoices")}
          </Button>
        }
      />
      <div className="metric-grid mb-6">
        <MetricCard
          label={t("console.finance.subInvoices.outstanding", undefined, "Outstanding")}
          value={formatCents(outstandingCents)}
        />
        <MetricCard label={t("console.finance.subInvoices.paid", undefined, "Paid")} value={formatCents(paidCents)} />
        <MetricCard
          label={t("console.finance.subInvoices.blocked", undefined, "Waiver Blocked")}
          value={String(blocked.length)}
        />
        <MetricCard label={t("console.finance.subInvoices.count", undefined, "Invoices")} value={String(rows.length)} />
      </div>

      {/* Views — All · Waiver Blocked (the kit's `blocked` saved view). */}
      <div className="mb-4 flex gap-2">
        <Link
          href="/studio/finance/sub-invoices"
          className={`ps-badge ${view !== "blocked" ? "ps-badge--accent" : "ps-badge--neutral"}`}
        >
          {t("console.finance.subInvoices.viewAll", undefined, "All")}
        </Link>
        <Link
          href="/studio/finance/sub-invoices?view=blocked"
          className={`ps-badge ${view === "blocked" ? "ps-badge--accent" : "ps-badge--neutral"}`}
        >
          {t("console.finance.subInvoices.viewBlocked", undefined, "Waiver Blocked")}
        </Link>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={
            view === "blocked"
              ? t("console.finance.subInvoices.blockedEmpty", undefined, "Nothing blocked on a waiver")
              : t("console.finance.subInvoices.empty", undefined, "No sub-invoices yet")
          }
          description={
            view === "blocked"
              ? t(
                  "console.finance.subInvoices.blockedEmptyBody",
                  undefined,
                  "Every open sub-invoice has its lien waiver on file. Pay can release.",
                )
              : t(
                  "console.finance.subInvoices.emptyBody",
                  undefined,
                  "Subcontractor invoices appear here once a work order is approved and the sub submits a payment application.",
                )
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((r) => {
            const wb = waiverBadge(r.waiver?.waiver_state);
            const payBlocked = !waiverOnFile(r.waiver?.waiver_state);
            return (
              <li
                key={r.id}
                className="surface flex flex-wrap items-center gap-3 rounded-[var(--p-r-lg)] border border-[var(--p-border)] p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-[var(--p-text-2)]">{r.number}</span>
                    <span className="font-semibold">{r.vendor?.name ?? "Vendor"}</span>
                    <Badge variant={SUB_INVOICE_BADGE[r.invoice_state]}>
                      {SUB_INVOICE_STATE_LABELS[r.invoice_state]}
                    </Badge>
                    <Badge variant={wb.variant}>{wb.label}</Badge>
                    {r.retainage_pct > 0 && (
                      <Badge variant="muted">
                        {t(
                          "console.finance.subInvoices.retainage",
                          { pct: r.retainage_pct },
                          `Retainage ${r.retainage_pct}%`,
                        )}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-[var(--p-text-2)]">
                    {r.work_order?.title ?? "—"} · {r.issued_at ?? "—"}
                  </div>
                </div>
                <span className="font-mono text-lg">{formatCents(r.amount_cents)}</span>
                <div className="flex gap-2">
                  {(NEXT_SUB_INVOICE_STATES[r.invoice_state] ?? []).map((to) => {
                    // The waiver gate: Mark paid is replaced by the unblock
                    // path until the linked waiver is on file.
                    if (to === "paid" && payBlocked) {
                      return (
                        <Button key={to} href="/studio/finance/lien-waivers/new" size="sm" variant="secondary">
                          {t("console.finance.subInvoices.requestWaiver", undefined, "Request waiver")}
                        </Button>
                      );
                    }
                    return (
                      <form key={to} action={transitionSubInvoiceForm.bind(null, r.id, to)}>
                        <Button type="submit" variant={to === "rejected" ? "danger" : "secondary"} size="sm">
                          {TRANSITION_LABEL[to] ?? SUB_INVOICE_STATE_LABELS[to]}
                        </Button>
                      </form>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
