import { PortalSubpage } from "@/components/PortalSubpage";
import { DataTable } from "@/components/DataTable";
import { createClient } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { formatDate } from "@/lib/i18n/format";
import type { EventRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await projectIdFromSlug(slug);
  const supabase = await createClient();
  const rows = project ? (await supabase
    .from("events")
    .select("*")
    .eq("project_id", project.id)
    .order("starts_at", { ascending: true })).data as EventRow[] ?? [] : [];
  return (
    <PortalSubpage slug={slug} persona="guest" title="Schedule" subtitle="Program and set times">
      <DataTable<EventRow>
        rows={rows}
        emptyLabel="Schedule posts closer to show day"
        columns={[
          { key: "name", header: "Name", render: (r) => r.name },
          { key: "starts", header: "Starts", render: (r) => formatDate(r.starts_at, "long"), className: "font-mono text-xs" },
          { key: "ends", header: "Ends", render: (r) => formatDate(r.ends_at, "long"), className: "font-mono text-xs" },
        ]}
      />
    </PortalSubpage>
  );
}
