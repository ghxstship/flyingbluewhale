import Link from "next/link";
import { PortalSubpage } from "@/components/PortalSubpage";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import type { Proposal } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await projectIdFromSlug(slug);
  const supabase = await createClient();
  const rows = project
    ? (((
        await supabase
          .from("proposals")
          .select("*")
          .eq("project_id", project.id)
          .order("created_at", { ascending: false })
      ).data as unknown as Proposal[]) ?? [])
    : [];
  return (
    <PortalSubpage slug={slug} persona="client" title="Proposals" subtitle="Review, approve, e-sign">
      <DataTable<Proposal>
        rows={rows}
        emptyLabel="No proposals to review"
        columns={[
          {
            key: "title",
            header: "Title",
            render: (r) => (
              <Link
                href={`/p/${slug}/client/proposals/${r.id}`}
                className="font-medium hover:text-[var(--org-primary)]"
              >
                {r.title}
              </Link>
            ),
          },
          {
            key: "amount",
            header: "Amount",
            render: (r) => formatMoney(r.amount_cents ?? 0),
            className: "font-mono text-xs",
            accessor: (r) => Number(r.amount_cents ?? 0),
          },
          {
            key: "status",
            header: "Status",
            render: (r) => <StatusBadge status={r.status} />,
            accessor: (r) => r.status,
            filterable: true,
            groupable: true,
          },
          {
            key: "sent",
            header: "Sent",
            render: (r) => (r.sent_at ? timeAgo(r.sent_at) : "—"),
            className: "font-mono text-xs",
          },
          {
            key: "open",
            header: "",
            render: (r) => (
              <Link
                href={`/p/${slug}/client/proposals/${r.id}`}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--org-primary)]"
              >
                Open →
              </Link>
            ),
            className: "text-end",
          },
        ]}
      />
    </PortalSubpage>
  );
}
