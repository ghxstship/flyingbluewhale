import Link from "next/link";
import { PortalSubpage } from "@/components/PortalSubpage";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import type { Proposal } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  const project = await projectIdFromSlug(slug);
  const supabase = await createClient();
  const rows = project
    ? (((
        await supabase
          .from("proposals")
          .select("*")
          .is("deleted_at", null)
          .eq("project_id", project.id)
          .order("created_at", { ascending: false })
      ).data as unknown as Proposal[]) ?? [])
    : [];
  return (
    <PortalSubpage
      slug={slug}
      persona="client"
      title={t("p.client.proposals.title", undefined, "Proposals")}
      subtitle={t("p.client.proposals.subtitle", undefined, "Review, approve, e-sign")}
    >
      <DataTable<Proposal>
        rows={rows}
        emptyLabel={t("p.client.proposals.empty", undefined, "No Proposals to Review")}
        emptyDescription={t(
          "p.client.proposals.emptyDescription",
          undefined,
          "When your producer sends a proposal for this project, it lands here for you to review, approve, and e-sign.",
        )}
        columns={[
          {
            key: "title",
            header: t("p.client.proposals.col.title", undefined, "Title"),
            render: (r) => (
              <Link href={`/p/${slug}/client/proposals/${r.id}`} className="font-medium hover:text-[var(--p-accent)]">
                {r.title}
              </Link>
            ),
            accessor: (r) => r.id ?? null,
          },
          {
            key: "amount",
            header: t("p.client.proposals.col.amount", undefined, "Amount"),
            render: (r) => formatMoney(r.amount_cents ?? 0),
            className: "font-mono text-xs",
            accessor: (r) => Number(r.amount_cents ?? 0),
          },
          {
            key: "status",
            header: t("p.client.proposals.col.proposal_state", undefined, "Status"),
            render: (r) => <StatusBadge status={r.proposal_state} />,
            accessor: (r) => r.proposal_state,
            filterable: true,
            groupable: true,
          },
          {
            key: "sent",
            header: t("p.client.proposals.col.sent", undefined, "Sent"),
            render: (r) => (r.sent_at ? timeAgo(r.sent_at) : "—"),
            className: "font-mono text-xs",
            accessor: (r) => r.sent_at ?? null,
          },
          {
            key: "open",
            header: "",
            render: (r) => (
              <Link
                href={`/p/${slug}/client/proposals/${r.id}`}
                className="text-xs text-[var(--p-text-2)] hover:text-[var(--p-accent)]"
              >
                {t("p.client.proposals.open", undefined, "Open →")}
              </Link>
            ),
            className: "text-end",
            accessor: (r) => r.id ?? null,
          },
        ]}
      />
    </PortalSubpage>
  );
}
