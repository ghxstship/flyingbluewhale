import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScopedWithCount } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { scheduleKindLabel } from "@/lib/schedule/kinds";
import type { EventRow } from "@/lib/supabase/types";
import { bulkCancelEvents } from "./actions";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.events.title", undefined, "Events")} />
        <ConfigureSupabase />
      </>
    );
  const session = await requireSession();
  // Exact count alongside the capped window (F-01) — subtitle + truncation
  // indicator stay honest past the 100-row cap.
  const { rows, totalCount } = await listOrgScopedWithCount("events", session.orgId, {
    orderBy: "starts_at",
    ascending: true,
  });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.events.eyebrow", undefined, "Work")}
        title={t("console.events.title", undefined, "Events")}
        subtitle={`${totalCount} ${totalCount === 1 ? t("console.events.subtitleEventSingular", undefined, "Event") : t("console.events.subtitleEventPlural", undefined, "Events")}`}
        action={<Button href="/studio/events/new">{t("console.events.newEvent", undefined, "+ New Event")}</Button>}
      />
      <div className="page-content">
        <DataTable<EventRow>
          rows={rows}
          totalCount={totalCount}
          rowHref={(row) => (row.event_kind === "meeting" ? `/studio/meetings/${row.id}` : `/studio/events/${row.id}`)}
          emptyLabel={t("console.events.emptyLabel", undefined, "No events scheduled")}
          emptyDescription={t(
            "console.events.emptyDescription",
            undefined,
            "Events anchor schedules, set times, and venue handover. Status flows draft → planned → live → wrapped.",
          )}
          emptyAction={
            <Button href="/studio/events/new" size="sm">
              {t("console.events.newEvent", undefined, "+ New Event")}
            </Button>
          }
          bulkActions={[
            {
              id: "cancel",
              label: t("console.events.bulk.cancel", undefined, "Cancel"),
              variant: "danger",
              perform: bulkCancelEvents,
            },
          ]}
          columns={[
            {
              key: "name",
              header: t("console.events.columns.name", undefined, "Name"),
              render: (row) => row.name,
              accessor: (row) => row.name,
            },
            {
              key: "kind",
              header: t("console.events.columns.type", undefined, "Type"),
              render: (row) => scheduleKindLabel(row.event_kind),
              accessor: (row) => row.event_kind,
              filterable: true,
              groupable: true,
              className: "text-xs",
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
              key: "event_state",
              header: t("console.events.columns.event_state", undefined, "Status"),
              render: (row) => <StatusBadge status={row.event_state} />,
              accessor: (row) => row.event_state,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
