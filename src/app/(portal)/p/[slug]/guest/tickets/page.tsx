import { PortalSubpage } from "@/components/PortalSubpage";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";
import type { Ticket } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await projectIdFromSlug(slug);
  const supabase = await createClient();
  const rows = project ? (await supabase
    .from("tickets")
    .select("*")
    .eq("project_id", project.id)
    .order("issued_at", { ascending: false })).data as Ticket[] ?? [] : [];
  return (
    <PortalSubpage slug={slug} persona="guest" title="Tickets" subtitle="Your tickets for this event">
      <DataTable<Ticket>
        rows={rows}
        emptyLabel="No tickets yet — buy or claim to get started"
        columns={[
          { key: "code", header: "Code", render: (r) => <span className="font-mono text-xs">{r.code}</span> },
          { key: "tier", header: "Tier", render: (r) => r.tier },
          { key: "holder", header: "Holder", render: (r) => r.holder_name ?? "—" },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
    </PortalSubpage>
  );
}
