import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { ConversationPanel } from "@/components/ConversationPanel";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import { transitionPayApp, updatePayAppLine } from "./actions";
import { StatusForm } from "@/components/StatusForm";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

const INPUT = "w-24 rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-2 py-1 text-xs";

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
  const { t } = await getRequestT();
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
  const isEditable = app.application_state === "draft";

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.payApps.detail.eyebrow", undefined, "Finance")}
        breadcrumbs={[
          {
            label: t("console.finance.payApps.detail.breadcrumb", undefined, "Pay Apps"),
            href: "/console/finance/pay-apps",
          },
          { label: `#${app.application_number}` },
        ]}
        title={t(
          "console.finance.payApps.detail.title",
          { number: app.application_number },
          `Application #${app.application_number}`,
        )}
        subtitle={`${t("console.finance.payApps.detail.poLabel", undefined, "PO")} ${(app.purchase_order as unknown as { number: string } | null)?.number ?? "—"} · ${(app.vendor as unknown as { name: string | null } | null)?.name ?? "—"} · ${fmt(app.period_start)} — ${fmt(app.period_end)}`}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_TONE[app.application_state] ?? "muted"}>{toTitle(app.application_state)}</Badge>
            {/* AIA G702/G703 PDF — round 51. Opens in a new tab; server route
                signs the storage URL with a 60-second TTL. */}
            <a
              href={`/api/v1/pay-apps/${id}/pdf`}
              target="_blank"
              rel="noopener"
              className="rounded-md border border-[var(--p-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--p-surface)]"
            >
              {t("console.finance.payApps.detail.aiaPdf", undefined, "AIA PDF")}
            </a>
            {app.application_state === "draft" && (
              <StatusForm
                action={transitionPayApp.bind(null, id, "submitted")}
                label={t("console.finance.payApps.detail.submit", undefined, "Submit")}
              />
            )}
            {app.application_state === "submitted" && (
              <>
                <StatusForm
                  action={transitionPayApp.bind(null, id, "approved")}
                  label={t("console.finance.payApps.detail.approve", undefined, "Approve")}
                />
                <StatusForm
                  action={transitionPayApp.bind(null, id, "rejected")}
                  label={t("console.finance.payApps.detail.reject", undefined, "Reject")}
                />
              </>
            )}
            {app.application_state === "approved" && (
              <StatusForm
                action={transitionPayApp.bind(null, id, "paid")}
                label={t("console.finance.payApps.detail.markPaid", undefined, "Mark paid")}
              />
            )}
          </div>
        }
      />
      <div className="page-content space-y-5">
        <section className="grid gap-3 md:grid-cols-4">
          <div className="surface p-3">
            <div className="text-xs text-[var(--p-text-2)]">
              {t("console.finance.payApps.detail.completed", undefined, "Completed")}
            </div>
            <div className="text-lg font-semibold">{formatMoney(app.total_completed_cents)}</div>
          </div>
          <div className="surface p-3">
            <div className="text-xs text-[var(--p-text-2)]">
              {t(
                "console.finance.payApps.detail.retention",
                { pct: app.retention_pct },
                `Retention (${app.retention_pct}%)`,
              )}
            </div>
            <div className="text-lg font-semibold">{formatMoney(app.total_retention_cents)}</div>
          </div>
          <div className="surface p-3">
            <div className="text-xs text-[var(--p-text-2)]">
              {t("console.finance.payApps.detail.previouslyPaid", undefined, "Previously paid")}
            </div>
            <div className="text-lg font-semibold">{formatMoney(app.total_previously_paid_cents)}</div>
          </div>
          <div className="surface p-3 ring-2 ring-[var(--p-accent)]">
            <div className="text-xs text-[var(--p-text-2)]">
              {t("console.finance.payApps.detail.dueThisPeriod", undefined, "Due this period")}
            </div>
            <div className="text-lg font-semibold">{formatMoney(app.total_due_cents)}</div>
          </div>
        </section>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">
            {t("console.finance.payApps.detail.scheduleOfValues", undefined, "Schedule of Values")}
          </h3>
          <table className="ps-table mt-3">
            <thead>
              <tr>
                <th>{t("console.finance.payApps.detail.columns.description", undefined, "Description")}</th>
                <th>{t("console.finance.payApps.detail.columns.scheduledValue", undefined, "Scheduled value")}</th>
                <th>{t("console.finance.payApps.detail.columns.pctToDate", undefined, "% to date")}</th>
                <th>{t("console.finance.payApps.detail.columns.thisPeriod", undefined, "This period $")}</th>
                <th>{t("console.finance.payApps.detail.columns.retention", undefined, "Retention $")}</th>
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
                          className="rounded border border-[var(--p-border)] px-2 py-0.5 text-[10px]"
                        >
                          {t("console.finance.payApps.detail.set", undefined, "set")}
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
