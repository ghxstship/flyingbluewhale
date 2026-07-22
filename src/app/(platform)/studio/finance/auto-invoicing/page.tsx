import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  proposal_state: string;
  amount_cents: number | null;
  deposit_percent: number | null;
  signed_at: string | null;
  client: { name: string | null } | null;
};

/**
 * Auto-Invoicing (kit 20 Finance · Settle tab) — the billing schedule
 * derived from signed proposals and their payment terms (the org's
 * deposit/balance split, src/lib/payment-terms.ts SSOT). Each signed
 * proposal owes a deposit invoice at signature and a balance invoice at
 * the terms milestone; this queue shows what should be raised next.
 * Rules are derived, never stored — the proposal is the SSOT.
 */
export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.autoInvoicing.eyebrow", undefined, "Finance · Settle")}
          title={t("console.autoInvoicing.title", undefined, "Auto-Invoicing")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.autoInvoicing.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("proposals")
    .select("id, title, proposal_state, amount_cents, deposit_percent, signed_at, client:client_id(name)")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .in("proposal_state", ["signed", "approved"])
    .order("signed_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];
  const depositCents = (r: Row) =>
    r.amount_cents != null ? Math.round((r.amount_cents * (r.deposit_percent ?? 50)) / 100) : null;
  const balanceCents = (r: Row) => (r.amount_cents != null ? r.amount_cents - (depositCents(r) ?? 0) : null);
  const scheduled = rows.reduce((n, r) => n + (r.amount_cents ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.autoInvoicing.eyebrow", undefined, "Finance · Settle")}
        title={t("console.autoInvoicing.title", undefined, "Auto-Invoicing")}
        subtitle={t(
          "console.autoInvoicing.subtitle",
          undefined,
          "Billing schedules derived from signed proposals and their payment terms.",
        )}
        action={
          <Button href="/studio/finance/invoices/new" size="sm">
            {t("console.autoInvoicing.raise", undefined, "+ Raise Invoice")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.autoInvoicing.metric.proposals", undefined, "Signed Proposals")}
            value={fmt.number(rows.length)}
            accent
          />
          <MetricCard
            label={t("console.autoInvoicing.metric.scheduled", undefined, "Scheduled Value")}
            value={fmt.money(scheduled)}
          />
          <MetricCard
            label={t("console.autoInvoicing.metric.terms", undefined, "Default Split")}
            value={t("console.autoInvoicing.metric.termsValue", undefined, "Deposit / Balance")}
          />
        </div>
        <DataView<Row>
          rows={rows}
          rowHref={(r) => `/studio/proposals/${r.id}`}
          emptyLabel={t("console.autoInvoicing.emptyLabel", undefined, "No signed proposals to bill")}
          emptyDescription={t(
            "console.autoInvoicing.emptyDescription",
            undefined,
            "When a proposal signs, its deposit and balance schedule appears here ready to raise as invoices.",
          )}
          emptyAction={
            <Button href="/studio/proposals" size="sm">
              {t("console.autoInvoicing.openProposals", undefined, "Open Proposals")}
            </Button>
          }
          columns={[
            {
              key: "title",
              header: t("console.autoInvoicing.column.proposal", undefined, "Proposal"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "client",
              header: t("console.autoInvoicing.column.client", undefined, "Client"),
              render: (r) => r.client?.name ?? "—",
              accessor: (r) => r.client?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "state",
              header: t("console.autoInvoicing.column.state", undefined, "State"),
              render: (r) => <Badge variant={toneFor(r.proposal_state)}>{toTitle(r.proposal_state)}</Badge>,
              accessor: (r) => r.proposal_state,
              filterable: true,
            },
            {
              key: "deposit",
              header: t("console.autoInvoicing.column.deposit", undefined, "Deposit Due"),
              render: (r) => {
                const d = depositCents(r);
                return d != null ? `${fmt.money(d)} · ${r.deposit_percent ?? 50}%` : "—";
              },
              mono: true,
              accessor: (r) => depositCents(r),
            },
            {
              key: "balance",
              header: t("console.autoInvoicing.column.balance", undefined, "Balance Due"),
              render: (r) => {
                const b = balanceCents(r);
                return b != null ? fmt.money(b) : "—";
              },
              mono: true,
              accessor: (r) => balanceCents(r),
            },
            {
              key: "signed",
              header: t("console.autoInvoicing.column.signed", undefined, "Signed"),
              render: (r) => (r.signed_at ? fmt.dateParts(r.signed_at, { month: "short", day: "numeric" }) : "—"),
              mono: true,
              accessor: (r) => r.signed_at,
            },
          ]}
        />
      </div>
    </>
  );
}
