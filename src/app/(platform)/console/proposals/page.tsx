import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney, formatDate } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import type { Tables } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function ProposalsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.proposals.title", undefined, "Proposals")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.proposals.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const rows = await listOrgScoped("proposals", session.orgId, { orderBy: "updated_at" });

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.proposals.eyebrow", undefined, "Sales")}
        title={t("console.proposals.title", undefined, "Proposals")}
        subtitle={
          rows.length === 1
            ? t("console.proposals.countOne", { count: rows.length }, `${rows.length} Proposal`)
            : t("console.proposals.countOther", { count: rows.length }, `${rows.length} Proposals`)
        }
        action={
          <Button href="/console/proposals/new">{t("console.proposals.newAction", undefined, "+ New Proposal")}</Button>
        }
      />
      <div className="page-content">
        <DataTable<Tables<"proposals">>
          rows={rows}
          rowHref={(r) => `/console/proposals/${r.id}`}
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
              className: "font-mono text-xs",
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
              className: "font-mono text-xs",
              accessor: (r) => r.expires_at ?? null,
            },
            {
              key: "updated",
              header: t("console.proposals.columns.updated", undefined, "Updated"),
              render: (r) => timeAgo(r.updated_at),
              className: "font-mono text-xs",
              accessor: (r) => r.updated_at,
            },
          ]}
        />
      </div>
    </>
  );
}
