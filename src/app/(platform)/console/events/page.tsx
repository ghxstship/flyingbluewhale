import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import type { EventRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.events.title", undefined, "Events")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.events.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("events", session.orgId, { orderBy: "starts_at", ascending: true });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.events.eyebrow", undefined, "Work")}
        title={t("console.events.title", undefined, "Events")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.events.subtitleEventSingular", undefined, "Event") : t("console.events.subtitleEventPlural", undefined, "Events")}`}
        action={<Button href="/console/events/new">{t("console.events.newEvent", undefined, "+ New Event")}</Button>}
      />
      <div className="page-content">
        <DataTable<EventRow>
          rows={rows}
          rowHref={(row) => `/console/events/${row.id}`}
          emptyLabel={t("console.events.emptyLabel", undefined, "No events scheduled")}
          emptyDescription={t(
            "console.events.emptyDescription",
            undefined,
            "Events anchor schedules, set times, and venue handover. Status flows draft → planned → live → wrapped.",
          )}
          emptyAction={
            <Button href="/console/events/new" size="sm">
              {t("console.events.newEvent", undefined, "+ New Event")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.events.columns.name", undefined, "Name"),
              render: (row) => row.name,
              accessor: (row) => row.name,
            },
            {
              key: "starts",
              header: t("console.events.columns.starts", undefined, "Starts"),
              render: (row) => formatDate(row.starts_at, "long"),
              className: "font-mono text-xs",
              accessor: (row) => row.starts_at,
            },
            {
              key: "ends",
              header: t("console.events.columns.ends", undefined, "Ends"),
              render: (row) => formatDate(row.ends_at, "long"),
              className: "font-mono text-xs",
              accessor: (row) => row.ends_at,
            },
            {
              key: "status",
              header: t("console.events.columns.status", undefined, "Status"),
              render: (row) => <StatusBadge status={row.status} />,
              accessor: (row) => row.status,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
