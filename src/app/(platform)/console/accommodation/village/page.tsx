import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page() {
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
  const rows = await listOrgScoped("venues", session.orgId, {
    orderBy: "name",
    ascending: true,
    limit: 500,
    filters: [{ column: "kind", op: "eq", value: "village" }],
  });

  const fmt = await getRequestFormatters();
  const totalCapacity = rows.reduce((s, r) => s + (r.capacity ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.accommodation.village.eyebrow", undefined, "Accommodation")}
        title={t("console.accommodation.village.title", undefined, "Village")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.accommodation.village.villageSingular", undefined, "village") : t("console.accommodation.village.villagePlural", undefined, "villages")} · ${fmt.number(totalCapacity)} ${totalCapacity === 1 ? t("console.accommodation.village.bedSingular", undefined, "bed") : t("console.accommodation.village.bedPlural", undefined, "beds")}`}
        action={
          <Button href="/console/venues/new" size="sm">
            {t("console.accommodation.village.newVenue", undefined, "+ New Venue")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/venues/${r.id}`}
          emptyLabel={t("console.accommodation.village.emptyLabel", undefined, "No villages")}
          emptyDescription={t(
            "console.accommodation.village.emptyDescription",
            undefined,
            "Residential clusters live under Venues with kind='village'. Create a venue and set its kind to surface it here.",
          )}
          emptyAction={
            <Button href="/console/venues/new" size="sm">
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
      </div>
    </>
  );
}
