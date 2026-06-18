import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import type { Database } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type SpaceRow = Database["public"]["Tables"]["function_spaces"]["Row"];

export default async function SpacesPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.diary.spaces.title", undefined, "Spaces")} />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const rows = (await listOrgScoped("function_spaces", session.orgId, {
    orderBy: "sort_order",
    ascending: true,
    limit: 0,
  })) as SpaceRow[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.diary.spaces.eyebrow", undefined, "Function Diary")}
        title={t("console.diary.spaces.title", undefined, "Spaces")}
        subtitle={t("console.diary.spaces.subtitle", { count: rows.length }, `${rows.length} spaces`)}
        breadcrumbs={[
          { label: t("console.diary.spaces.breadcrumb.diary", undefined, "Function Diary"), href: "/console/sales/diary" },
          { label: t("console.diary.spaces.title", undefined, "Spaces") },
        ]}
        action={
          <Button href="/console/sales/diary/spaces/new" size="sm">
            {t("console.diary.spaces.newLabel", undefined, "+ New Space")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<SpaceRow>
          rows={rows}
          columns={[
            {
              key: "name",
              header: t("console.diary.spaces.col.name", undefined, "Name"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "venue",
              header: t("console.diary.spaces.col.venue", undefined, "Venue"),
              render: (r) => r.venue ?? "—",
              accessor: (r) => r.venue ?? null,
            },
            {
              key: "capacity",
              header: t("console.diary.spaces.col.capacity", undefined, "Capacity"),
              render: (r) => r.capacity ?? "—",
              accessor: (r) => r.capacity ?? null,
            },
            {
              key: "state",
              header: t("console.diary.spaces.col.state", undefined, "State"),
              render: (r) => <StatusBadge status={r.space_state} />,
              accessor: (r) => r.space_state,
            },
          ]}
        />
      </div>
    </>
  );
}
