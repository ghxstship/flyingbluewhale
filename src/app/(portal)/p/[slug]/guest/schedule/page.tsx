import { PortalSubpage } from "@/components/PortalSubpage";
import { DataTable } from "@/components/DataTable";
import { createClient } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { formatDate } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import type { EventRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  const project = await projectIdFromSlug(slug);
  const supabase = await createClient();
  const rows = project
    ? (((await supabase.from("events").select("*").eq("project_id", project.id).order("starts_at", { ascending: true }))
        .data as EventRow[]) ?? [])
    : [];
  return (
    <PortalSubpage
      slug={slug}
      persona="guest"
      title={t("p.guest.schedule.title", undefined, "Schedule")}
      subtitle={t("p.guest.schedule.subtitle", undefined, "Program and set times")}
    >
      <DataTable<EventRow>
        rows={rows}
        emptyLabel={t("p.guest.schedule.empty", undefined, "Schedule posts closer to show day")}
        columns={[
          {
            key: "name",
            header: t("p.guest.schedule.col.name", undefined, "Name"),
            render: (r) => r.name,
            accessor: (r) => r.name,
          },
          {
            key: "starts",
            header: t("p.guest.schedule.col.starts", undefined, "Starts"),
            render: (r) => formatDate(r.starts_at, "long"),
            className: "font-mono text-xs",
            accessor: (r) => r.starts_at,
          },
          {
            key: "ends",
            header: t("p.guest.schedule.col.ends", undefined, "Ends"),
            render: (r) => formatDate(r.ends_at, "long"),
            className: "font-mono text-xs",
            accessor: (r) => r.ends_at,
          },
        ]}
      />
    </PortalSubpage>
  );
}
