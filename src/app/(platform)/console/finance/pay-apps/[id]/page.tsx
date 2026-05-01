import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { ConversationPanel } from "@/components/ConversationPanel";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { transitionPayApp, updatePayAppLine } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-24 rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1 text-xs";

const STATUS_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  draft: "muted",
  submitted: "info",
  in_review: "info",
  approved: "success",
  rejected: "error",
  paid: "success",
};

function fmt(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString();
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: app } = await supabase
    .from("payment_applications")
    .select("*, vendor:vendor_id(name), purchase_order:purchase_order_id(number, title)")
    .eq("org_id", session.orgId)
    .eq("id", id)
    .maybeSingle();
  if (!app) notFound();

  const { data: lines } = await supabase
    .from("payment_application_lines")
    .select("*, po_line:po_line_item_id(description, quantity, unit_price_cents)")
    .eq("payment_application_id", id);

  const allLines = lines ?? [];
  const isEditable = app.status === "draft";

  return (
    <>
      <ModuleHeader
        eyebrow="Finance"
        breadcrumbs={[
          { label: "Pay Apps", href: "/console/finance/pay-apps" },
          { label: `#${app.application_number}` },
        ]}
        title={`Application #${app.application_number}`}
        subtitle={`PO ${(app.purchase_order as unknown as { number: string } | null)?.number ?? "—"} · ${(app.vendor as unknown as { name: string | null } | null)?.name ?? "—"} · ${fmt(app.period_start)} — ${fmt(app.period_end)}`}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_TONE[app.status] ?? "muted"}>{app.status.replace("_", " ")}</Badge>
            {app.status === "draft" && (
              <form action={transitionPayApp.bind(null, id, "submitted")}>
                <button className="surface-raised hover-lift rounded-md px-3 py-1.5 text-xs font-medium" type="submit">
                  Submit
                </button>
              </form>
            )}
            {app.status === "submitted" && (
              <>
                <form action={transitionPayApp.bind(null, id, "approved")}>
                  <button
                    className="surface-raised hover-lift rounded-md px-3 py-1.5 text-xs font-medium"
                    type="submit"
                  >
                    Approve
                  </button>
                </form>
                <form action={transitionPayApp.bind(null, id, "rejected")}>
                  <button
                    className="surface-raised hover-lift rounded-md px-3 py-1.5 text-xs font-medium"
                    type="submit"
                  >
                    Reject
                  </button>
                </form>
              </>
            )}
            {app.status === "approved" && (
              <form action={transitionPayApp.bind(null, id, "paid")}>
                <button className="surface-raised hover-lift rounded-md px-3 py-1.5 text-xs font-medium" type="submit">
                  Mark paid
                </button>
              </form>
            )}
          </div>
        }
      />
      <div className="page-content space-y-5">
        <section className="grid gap-3 md:grid-cols-4">
          <div className="surface p-3">
            <div className="text-xs text-[var(--text-muted)]">Completed</div>
            <div className="text-lg font-semibold">{formatMoney(app.total_completed_cents)}</div>
          </div>
          <div className="surface p-3">
            <div className="text-xs text-[var(--text-muted)]">Retention ({app.retention_pct}%)</div>
            <div className="text-lg font-semibold">{formatMoney(app.total_retention_cents)}</div>
          </div>
          <div className="surface p-3">
            <div className="text-xs text-[var(--text-muted)]">Previously paid</div>
            <div className="text-lg font-semibold">{formatMoney(app.total_previously_paid_cents)}</div>
          </div>
          <div className="surface p-3 ring-2 ring-[var(--accent)]">
            <div className="text-xs text-[var(--text-muted)]">Due this period</div>
            <div className="text-lg font-semibold">{formatMoney(app.total_due_cents)}</div>
          </div>
        </section>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">Schedule of values</h3>
          <table className="data-table mt-3">
            <thead>
              <tr>
                <th>Description</th>
                <th>Scheduled value</th>
                <th>% to date</th>
                <th>This period $</th>
                <th>Retention $</th>
              </tr>
            </thead>
            <tbody>
              {allLines.map((ln) => (
                <tr key={ln.id}>
                  <td>{(ln.po_line as unknown as { description: string } | null)?.description ?? "—"}</td>
                  <td className="font-mono text-xs">{formatMoney(ln.scheduled_value_cents)}</td>
                  <td>
                    {isEditable ? (
                      <form action={updatePayAppLine.bind(null, id, ln.id)} className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          name="pct"
                          step="0.01"
                          min="0"
                          max="100"
                          defaultValue={Number(ln.pct_complete_to_date)}
                          className={INPUT}
                        />
                        <button
                          type="submit"
                          className="rounded border border-[var(--border-color)] px-2 py-0.5 text-[10px]"
                        >
                          set
                        </button>
                      </form>
                    ) : (
                      `${Number(ln.pct_complete_to_date).toFixed(2)}%`
                    )}
                  </td>
                  <td className="font-mono text-xs">{formatMoney(ln.this_period_cents)}</td>
                  <td className="font-mono text-xs">{formatMoney(ln.retention_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <ConversationPanel orgId={session.orgId} recordType="payment_application" recordId={id} />
      </div>
    </>
  );
}
