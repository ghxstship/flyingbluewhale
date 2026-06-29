import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DocStatusRow } from "@/components/ui/DocStatusRow";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import {
  DISPATCH_MODE_LABELS,
  DOC_KIND_LABELS,
  NEXT_WORK_ORDER_STATES,
  VERDICT_BADGE,
  VERDICT_LABELS,
  WORK_ORDER_STATE_LABELS,
  formatCents,
  type DispatchMode,
  type DocStatus,
  type EligibilityVerdict,
  type WorkOrderState,
} from "@/lib/subcontractor";
import { awardWorkOrderForm, transitionWorkOrderForm } from "../actions";

export const dynamic = "force-dynamic";

type WO = {
  id: string;
  title: string;
  trade: string;
  site_address: string | null;
  start_date: string | null;
  end_date: string | null;
  budget_guide_cents: number | null;
  dispatch_mode: DispatchMode;
  visibility: string;
  work_order_state: WorkOrderState;
  awarded_vendor_id: string | null;
};
type Bid = { id: string; vendor_id: string; amount_cents: number; note: string | null };
type DocRow = { vendor_id: string; doc_kind: string; expires_on: string | null; doc_status: DocStatus; remaining_pct: number | null };

const STATE_TONE: Record<WorkOrderState, "muted" | "info" | "success" | "warning" | "error"> = {
  draft: "muted", posted: "info", "bids-in": "info", awarded: "success", "in-progress": "info",
  complete: "success", approved: "success", invoiced: "warning", closed: "muted", cancelled: "error",
};

export default async function WorkOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) return null;
  const { id } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data: wo } = await supabase
    .from("work_orders")
    .select(
      "id, title, trade, site_address, start_date, end_date, budget_guide_cents, dispatch_mode, visibility, work_order_state, awarded_vendor_id",
    )
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .single();
  if (!wo) notFound();
  const order = wo as WO;

  const [{ data: bidsData }, { data: eligData }, { data: vendorsData }, { data: docsData }] = await Promise.all([
    supabase.from("work_order_bids").select("id, vendor_id, amount_cents, note").eq("work_order_id", id),
    supabase.from("v_sub_eligibility").select("vendor_id, verdict").eq("org_id", session.orgId).eq("trade", order.trade),
    supabase.from("vendors").select("id, name").eq("org_id", session.orgId).limit(500),
    supabase
      .from("v_compliance_doc_status")
      .select("vendor_id, doc_kind, expires_on, doc_status, remaining_pct")
      .eq("org_id", session.orgId),
  ]);

  const bids = (bidsData ?? []) as Bid[];
  const verdictByVendor = new Map<string, EligibilityVerdict>(
    ((eligData ?? []) as { vendor_id: string; verdict: EligibilityVerdict }[]).map((e) => [e.vendor_id, e.verdict]),
  );
  const nameById = new Map<string, string>(
    ((vendorsData ?? []) as { id: string; name: string | null }[]).map((v) => [v.id, v.name ?? "Vendor"]),
  );
  const docsByVendor = new Map<string, DocRow[]>();
  for (const d of (docsData ?? []) as DocRow[]) {
    const list = docsByVendor.get(d.vendor_id) ?? [];
    list.push(d);
    docsByVendor.set(d.vendor_id, list);
  }

  const nextStates = NEXT_WORK_ORDER_STATES[order.work_order_state] ?? [];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.production.workOrders.eyebrow", undefined, "Production")}
        title={order.title}
        subtitle={`${order.trade} · ${DISPATCH_MODE_LABELS[order.dispatch_mode]}`}
      />

      <div className="mb-6 flex items-center gap-3">
        <Badge variant={STATE_TONE[order.work_order_state]}>{WORK_ORDER_STATE_LABELS[order.work_order_state]}</Badge>
        <span className="text-xs text-[var(--p-text-2)]">{order.visibility === "public" ? "Public" : "Private"}</span>
        <Link
          href={`/studio/production/work-orders/${order.id}/thread`}
          className="ms-auto text-sm text-[var(--p-accent-text)] hover:underline"
        >
          {t("console.production.workOrders.thread.open", undefined, "Open thread →")}
        </Link>
      </div>

      <div className="metric-grid mb-6">
        <div className="surface rounded-[var(--p-r-lg)] border border-[var(--p-border)] p-4">
          <div className="text-xs text-[var(--p-text-2)]">{t("console.production.workOrders.budget", undefined, "Budget guide")}</div>
          <div className="mt-1 font-mono text-lg">{formatCents(order.budget_guide_cents)}</div>
        </div>
        <div className="surface rounded-[var(--p-r-lg)] border border-[var(--p-border)] p-4">
          <div className="text-xs text-[var(--p-text-2)]">{t("console.production.workOrders.field.site", undefined, "Site")}</div>
          <div className="mt-1 text-sm">{order.site_address || "—"}</div>
        </div>
        <div className="surface rounded-[var(--p-r-lg)] border border-[var(--p-border)] p-4">
          <div className="text-xs text-[var(--p-text-2)]">{t("console.production.workOrders.dates", undefined, "Dates")}</div>
          <div className="mt-1 text-sm">{order.start_date || "—"} → {order.end_date || "—"}</div>
        </div>
      </div>

      {/* State transitions */}
      {nextStates.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-[var(--p-text-2)]">{t("console.production.workOrders.advance", undefined, "Advance:")}</span>
          {nextStates.map((to) => (
            <form key={to} action={transitionWorkOrderForm.bind(null, order.id, to)}>
              <Button type="submit" variant="secondary">{WORK_ORDER_STATE_LABELS[to]}</Button>
            </form>
          ))}
        </div>
      )}

      {/* Eligibility-gated bid inbox */}
      <section className="surface rounded-[var(--p-r-lg)] border border-[var(--p-border)] p-5">
        <h2 className="mb-1 text-base font-semibold">{t("console.production.workOrders.bids", undefined, "Bid inbox")}</h2>
        <p className="mb-4 text-xs text-[var(--p-text-2)]">
          {t("console.production.workOrders.bidsHint", undefined, "Award is blocked for subs missing required compliance docs for this trade.")}
        </p>
        {bids.length === 0 ? (
          <EmptyState size="compact" title={t("console.production.workOrders.noBids", undefined, "No bids yet")} />
        ) : (
          <ul className="flex flex-col gap-4">
            {bids.map((b) => {
              const verdict = verdictByVendor.get(b.vendor_id) ?? "eligible";
              const blocked = verdict === "blocked";
              const awarded = order.awarded_vendor_id === b.vendor_id;
              return (
                <li key={b.id} className="rounded-[var(--p-r-md)] border border-[var(--p-border)] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{nameById.get(b.vendor_id) ?? "Vendor"}</span>
                    <Badge variant={VERDICT_BADGE[verdict]}>{VERDICT_LABELS[verdict]}</Badge>
                    <span className="ms-auto font-mono">{formatCents(b.amount_cents)}</span>
                  </div>
                  {b.note && <p className="mt-1 text-sm text-[var(--p-text-2)]">{b.note}</p>}
                  <div className="mt-2">
                    {(docsByVendor.get(b.vendor_id) ?? []).map((d, i) => (
                      <DocStatusRow
                        key={`${d.doc_kind}-${i}`}
                        name={DOC_KIND_LABELS[d.doc_kind] ?? d.doc_kind}
                        expiresOn={d.expires_on ?? undefined}
                        status={d.doc_status}
                        remainingPct={d.remaining_pct ?? undefined}
                      />
                    ))}
                  </div>
                  {awarded ? (
                    <p className="mt-3 text-sm font-medium text-[var(--p-success-text)]">
                      {t("console.production.workOrders.awarded", undefined, "Awarded")}
                    </p>
                  ) : (
                    ["posted", "bids-in"].includes(order.work_order_state) && (
                      <form action={awardWorkOrderForm.bind(null, order.id, b.vendor_id)} className="mt-3">
                        <Button type="submit" disabled={blocked} title={blocked ? "Sub is blocked: resolve compliance first" : undefined}>
                          {t("console.production.workOrders.award", undefined, "Award")}
                        </Button>
                      </form>
                    )
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
