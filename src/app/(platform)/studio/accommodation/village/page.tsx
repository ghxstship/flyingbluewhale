import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PagerNav } from "@/components/ui/PagerNav";
import { requireSession } from "@/lib/auth";
import { listOrgScopedPage } from "@/lib/db/resource";
import { parsePage } from "@/lib/db/pagination";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.accommodation.village.eyebrow", undefined, "Accommodation")}
          title={t("console.accommodation.village.title", undefined, "Village")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.accommodation.village.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("venues", session.orgId, {
    orderBy: "name",
    ascending: true,
    pageSize,
    cursor: String(offset),
    filters: [{ column: "kind", op: "eq", value: "village" }],
  });
  const rows = result.rows;
  const total = result.totalCount;

  const fmt = await getRequestFormatters();
  const totalCapacity = rows.reduce((s, r) => s + (r.capacity ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.accommodation.village.eyebrow", undefined, "Accommodation")}
        title={t("console.accommodation.village.title", undefined, "Village")}
        subtitle={`${total} ${total === 1 ? t("console.accommodation.village.villageSingular", undefined, "village") : t("console.accommodation.village.villagePlural", undefined, "villages")} · ${fmt.number(totalCapacity)} ${totalCapacity === 1 ? t("console.accommodation.village.bedSingular", undefined, "bed") : t("console.accommodation.village.bedPlural", undefined, "beds")}`}
        action={
          <Button href="/studio/venues/new" size="sm">
            {t("console.accommodation.village.newVenue", undefined, "+ New Venue")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          totalCount={total}
          rowHref={(r) => `/studio/venues/${r.id}`}
          emptyLabel={t("console.accommodation.village.emptyLabel", undefined, "No villages")}
          emptyDescription={t(
            "console.accommodation.village.emptyDescription",
            undefined,
            "Residential clusters live under Venues with kind='village'. Create a venue and set its kind to surface it here.",
          )}
          emptyAction={
            <Button href="/studio/venues/new" size="sm">
              {t("console.accommodation.village.newVenue", undefined, "+ New Venue")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.accommodation.village.col.name", undefined, "Name"),
              render: (r) => String(r.name ?? "—"),
              accessor: (r) => r.name ?? null,
            },
            {
              key: "cluster",
              header: t("console.accommodation.village.col.cluster", undefined, "Cluster"),
              render: (r) => String(r.cluster ?? "—"),
              accessor: (r) => r.cluster ?? null,
            },
            {
              key: "capacity",
              header: t("console.accommodation.village.col.beds", undefined, "Beds"),
              render: (r) => (
                <span className="font-mono text-xs">{r.capacity != null ? fmt.number(r.capacity as number) : "—"}</span>
              ),
              accessor: (r) => r.capacity ?? null,
            },
            {
              key: "handover",
              header: t("console.accommodation.village.col.handover", undefined, "Handover"),
              render: (r) => <StatusBadge status={String(r.handover_state ?? "—")} />,
              accessor: (r) => r.handover_state ?? null,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/accommodation/village"
          searchParams={sp}
        />
      </div>
    </>
  );
}
