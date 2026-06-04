import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.venues.training.eyebrow", undefined, "Workspace")}
          title={t("console.venues.training.title", undefined, "Training Venues")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.venues.training.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("venues", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
    filters: [{ column: "kind", op: "eq", value: "training" }],
  });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.venues.training.eyebrow", undefined, "Workspace")}
        title={t("console.venues.training.title", undefined, "Training Venues")}
        subtitle={t(
          "console.venues.training.recordCount",
          { count: rows.length, plural: rows.length === 1 ? "" : "s" },
          `${rows.length} Record${rows.length === 1 ? "" : "s"}`,
        )}
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/venues/${r.id}`}
          emptyLabel={t("console.venues.training.emptyLabel", undefined, "No training venues")}
          emptyDescription={t(
            "console.venues.training.emptyDescription",
            undefined,
            "Sub-set of venues filtered to training spaces. Edit the venue record itself for capacity, layout, and handover state.",
          )}
          columns={[
            {
              key: "name",
              header: t("console.venues.training.columns.name", undefined, "Name"),
              render: (r) => String(r.name ?? "—"),
              accessor: (r) => r.name ?? null,
            },
            {
              key: "kind",
              header: t("console.venues.training.columns.kind", undefined, "Kind"),
              render: (r) => String(r.kind ?? "—"),
              accessor: (r) => r.kind ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "capacity",
              header: t("console.venues.training.columns.capacity", undefined, "Capacity"),
              render: (r) => <span className="font-mono text-xs">{String(r.capacity ?? "—")}</span>,
              accessor: (r) => r.capacity ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
