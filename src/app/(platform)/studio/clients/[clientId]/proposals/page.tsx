import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney, formatDate } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  amount_cents: number | null;
  proposal_state: string;
  sent_at: string | null;
  signed_at: string | null;
};

export default async function Page({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  if (!hasSupabase) return null;
  const { t } = await getRequestT();
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("proposals")
    .select("id,title,amount_cents,proposal_state,sent_at,signed_at")
    .eq("org_id", session.orgId)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.clients.proposals.eyebrow", undefined, "Client")}
        title={t("console.clients.proposals.title", undefined, "Proposals")}
        subtitle={t("console.clients.proposals.subtitle", undefined, "Proposals sent to this client.")}
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/studio/proposals/${r.id}`}
          emptyLabel={t("console.clients.proposals.emptyLabel", undefined, "No Proposals")}
          emptyDescription={t(
            "console.clients.proposals.emptyDescription",
            undefined,
            "No proposals have been sent to this client yet.",
          )}
          columns={[
            {
              key: "title",
              header: t("console.clients.proposals.col.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
              sortable: true,
            },
            {
              key: "proposal_state",
              header: t("console.clients.proposals.col.proposal_state", undefined, "Status"),
              render: (r) => <StatusBadge status={r.proposal_state} />,
              accessor: (r) => r.proposal_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "sent_at",
              header: t("console.clients.proposals.col.sent", undefined, "Sent"),
              render: (r) => (r.sent_at ? formatDate(r.sent_at) : "—"),
              accessor: (r) => r.sent_at ?? "",
              mono: true,
              sortable: true,
            },
            {
              key: "signed_at",
              header: t("console.clients.proposals.col.signed", undefined, "Signed"),
              render: (r) => (r.signed_at ? formatDate(r.signed_at) : "—"),
              accessor: (r) => r.signed_at ?? "",
              mono: true,
              sortable: true,
            },
            {
              key: "amount_cents",
              header: t("console.clients.proposals.col.amount", undefined, "Amount"),
              render: (r) => (r.amount_cents != null ? formatMoney(r.amount_cents) : "—"),
              accessor: (r) => r.amount_cents ?? 0,
              tabular: true,
              sortable: true,
              className: "text-right",
              headerClassName: "text-right",
            },
          ]}
        />
      </div>
    </>
  );
}
