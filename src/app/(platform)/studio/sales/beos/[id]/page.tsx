import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { getOrgScoped, listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { beoTotalCents, groupBySection, type BeoLineItem, type BeoState } from "@/lib/beos";
import { BeoStateControls } from "./BeoStateControls";
import { AddBeoLineForm } from "./AddBeoLineForm";
import { BeoLineRow } from "./BeoLineRow";

export const dynamic = "force-dynamic";

type Beo = {
  id: string;
  beo_number: string | null;
  event_name: string;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  space: string | null;
  headcount: number;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  beo_state: BeoState;
  revision: number;
  notes: string | null;
  sent_at: string | null;
  signed_at: string | null;
  created_at: string;
};

export default async function BeoDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();

  const beo = (await getOrgScoped("beos", session.orgId, id)) as unknown as Beo | null;
  if (!beo) notFound();

  const lines = (await listOrgScoped("beo_line_items", session.orgId, {
    filters: [{ column: "beo_id", op: "eq", value: id }],
    orderBy: "sort_order",
    ascending: true,
    // Cap defensively — a single BEO's line items are bounded by the doc,
    // but the perf audit flagged the unbounded `limit: 0`. 500 is far past
    // any real BEO.
    limit: 500,
  })) as unknown as BeoLineItem[];

  const sections = groupBySection(lines);
  const grandTotal = beoTotalCents(lines);

  const timeRange =
    beo.start_time || beo.end_time ? `${beo.start_time ?? "—"} – ${beo.end_time ?? "—"}` : "—";

  return (
    <>
      <ModuleHeader
        eyebrow={`BEO · ${beo.beo_number ?? beo.id.slice(0, 8)} · rev ${beo.revision}`}
        title={beo.event_name}
        subtitle={`${beo.event_date ?? "Unscheduled"} · ${beo.headcount} pax · created ${timeAgo(beo.created_at)}`}
        breadcrumbs={[
          { label: "Sales", href: "/studio/sales/beos" },
          { label: "BEOs", href: "/studio/sales/beos" },
          { label: beo.event_name },
        ]}
        action={<BeoStateControls id={beo.id} state={beo.beo_state} />}
      />

      <div className="page-content space-y-6">
        {/* Header card — printable banquet event order header */}
        <div className="metric-grid">
          <Field label="Status">
            <StatusBadge status={beo.beo_state} />
          </Field>
          <Field label="Date">{beo.event_date ?? "—"}</Field>
          <Field label="Time">{timeRange}</Field>
          <Field label="Space">{beo.space ?? "—"}</Field>
          <Field label="Headcount">{String(beo.headcount)}</Field>
          <Field label="Sent">{beo.sent_at ? timeAgo(beo.sent_at) : "—"}</Field>
          <Field label="Signed">{beo.signed_at ? timeAgo(beo.signed_at) : "—"}</Field>
        </div>

        {(beo.contact_name || beo.contact_email || beo.contact_phone) && (
          <div className="surface p-5">
            <h3 className="text-base font-semibold">On-site contact</h3>
            <p className="mt-2 text-sm text-[var(--p-text-2)]">
              {[beo.contact_name, beo.contact_email, beo.contact_phone].filter(Boolean).join(" · ")}
            </p>
          </div>
        )}

        {/* Line sections — F&B, AV, staffing, … */}
        {sections.length === 0 ? (
          <div className="surface p-5 text-sm text-[var(--p-text-2)]">No line items yet. Add one below.</div>
        ) : (
          sections.map((s) => (
            <div key={s.section} className="surface p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">{s.label}</h3>
                <span className="text-sm font-medium tabular-nums">{formatMoney(s.subtotal_cents)}</span>
              </div>
              <table className="ps-table mt-3 w-full">
                <thead>
                  <tr>
                    <th className="text-left">Item</th>
                    <th className="num">Qty</th>
                    <th className="num">Unit</th>
                    <th className="num">Total</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {s.lines.map((line) => (
                    <BeoLineRow key={line.id} line={line} beoId={beo.id} />
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}

        <div className="surface-raised flex items-center justify-between p-5">
          <span className="text-sm font-semibold tracking-wide text-[var(--p-text-2)]">Grand total</span>
          <span className="text-lg font-semibold tabular-nums">{formatMoney(grandTotal)}</span>
        </div>

        {/* Add-line form */}
        <div className="surface p-5">
          <h3 className="text-base font-semibold">Add line item</h3>
          <div className="mt-3">
            <AddBeoLineForm beoId={beo.id} />
          </div>
        </div>

        {beo.notes && (
          <div className="surface p-5">
            <h3 className="text-base font-semibold">Notes</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{beo.notes}</p>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="surface p-3">
      <div className="text-[11px] font-semibold tracking-wide text-[var(--p-text-2)]">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
