import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { PagerNav } from "@/components/ui/PagerNav";
import { requireSession } from "@/lib/auth";
import { listOrgScopedPage } from "@/lib/db/resource";
import { parsePage } from "@/lib/db/pagination";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.venues.eyebrow", undefined, "Venues")}
          title={t("console.venues.title", undefined, "Venues")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.venues.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("venues", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    pageSize,
    cursor: String(offset),
  });
  const rows = result.rows;
  const total = result.totalCount;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.venues.eyebrow", undefined, "Venues")}
        title={t("console.venues.title", undefined, "Venues")}
        subtitle={`${total} ${total === 1 ? t("console.venues.recordSingular", undefined, "Record") : t("console.venues.recordPlural", undefined, "Records")}`}
        action={
          <Button href="/studio/venues/new" size="sm">
            {t("console.venues.newVenue", undefined, "+ New Venue")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataView
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          totalCount={total}
          rowHref={(r) => `/studio/venues/${r.id}`}
          emptyLabel={t("console.venues.emptyLabel", undefined, "No Venues Yet")}
          emptyDescription={t(
            "console.venues.emptyDescription",
            undefined,
            "Author each venue with its kind, cluster, and capacity. Handover state then tracks readiness from build through bump-out.",
          )}
          emptyAction={
            <Button href="/studio/venues/new" size="sm">
              {t("console.venues.createFirst", undefined, "Add Your First Venue")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.venues.columns.name", undefined, "Name"),
              render: (r) => String(r.name ?? "—"),
              accessor: (r) => r.name ?? null,
            },
            {
              key: "kind",
              header: t("console.venues.columns.kind", undefined, "Kind"),
              render: (r) => String(r.kind ?? "—"),
              accessor: (r) => r.kind ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "cluster",
              header: t("console.venues.columns.cluster", undefined, "Cluster"),
              render: (r) => String(r.cluster ?? "—"),
              accessor: (r) => r.cluster ?? null,
            },
            {
              key: "capacity",
              header: t("console.venues.columns.capacity", undefined, "Capacity"),
              render: (r) => String(r.capacity ?? "—"),
              mono: true,
              accessor: (r) => r.capacity ?? null,
            },
            {
              key: "handover_state",
              header: t("console.venues.columns.handover", undefined, "Handover"),
              render: (r) => String(r.handover_state ?? "—"),
              accessor: (r) => r.handover_state ?? null,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/venues"
          searchParams={sp}
        />
      </div>
    </>
  );
}
