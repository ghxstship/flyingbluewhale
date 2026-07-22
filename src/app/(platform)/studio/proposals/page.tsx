import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { countOrgScoped, listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney, formatDate } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { Tables } from "@/lib/supabase/types";
import { bulkSendProposals } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProposalsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.proposals.title", undefined, "Proposals")} />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  // Exact count alongside the capped table page (audit A-05/A-07) — the
  // subtitle and truncation indicator stay honest past the 100-row cap.
  const [rows, totalCount] = await Promise.all([
    listOrgScoped("proposals", session.orgId, { orderBy: "updated_at" }),
    countOrgScoped("proposals", session.orgId),
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.proposals.eyebrow", undefined, "Sales")}
        title={t("console.proposals.title", undefined, "Proposals")}
        subtitle={
          totalCount === 1
            ? t("console.proposals.countOne", { count: totalCount }, `${totalCount} Proposal`)
            : t("console.proposals.countOther", { count: totalCount }, `${totalCount} Proposals`)
        }
        action={
          <Button href="/studio/proposals/new">{t("console.proposals.newAction", undefined, "+ New Proposal")}</Button>
        }
      />
      <div className="page-content">
        <DataView<Tables<"proposals">>
          rows={rows}
          totalCount={totalCount}
          rowHref={(r) => `/studio/proposals/${r.id}`}
          emptyLabel={t("console.proposals.emptyLabel", undefined, "No proposals yet")}
          emptyDescription={t(
            "console.proposals.emptyDescription",
            undefined,
            "Draft a proposal to put numbers in front of a client; signed proposals convert to projects.",
          )}
          emptyAction={
            <Button href="/studio/proposals/new" size="sm">
              {t("console.proposals.newAction", undefined, "+ New Proposal")}
            </Button>
          }
          bulkActions={[
            {
              id: "send",
              label: t("console.proposals.bulk.send", undefined, "Mark Sent"),
              perform: bulkSendProposals,
            },
          ]}
          columns={[
            {
              key: "title",
              header: t("console.proposals.columns.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "amount",
              header: t("console.proposals.columns.amount", undefined, "Amount"),
              render: (r) => formatMoney(r.amount_cents ?? 0),
              mono: true,
              accessor: (r) => Number(r.amount_cents ?? 0),
            },
            {
              key: "proposal_state",
              header: t("console.proposals.columns.proposal_state", undefined, "Status"),
              render: (r) => <StatusBadge status={r.proposal_state} />,
              accessor: (r) => r.proposal_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "expires",
              header: t("console.proposals.columns.expires", undefined, "Expires"),
              render: (r) => (r.expires_at ? formatDate(r.expires_at) : "—"),
              mono: true,
              accessor: (r) => r.expires_at ?? null,
            },
            {
              key: "updated",
              header: t("console.proposals.columns.updated", undefined, "Updated"),
              render: (r) => timeAgo(r.updated_at),
              mono: true,
              accessor: (r) => r.updated_at,
            },
          ]}
        />
      </div>
    </>
  );
}
