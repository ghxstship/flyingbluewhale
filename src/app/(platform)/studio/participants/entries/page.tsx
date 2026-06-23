import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
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
          eyebrow={t("console.participants.entries.eyebrowWorkspace", undefined, "Workspace")}
          title={t("console.participants.entries.title", undefined, "Entries")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.participants.entries.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("delegation_entries", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.participants.entries.eyebrow", undefined, "Participants")}
        title={t("console.participants.entries.title", undefined, "Entries")}
        subtitle={
          rows.length === 1
            ? t("console.participants.entries.recordCount.one", { count: rows.length }, `${rows.length} Record`)
            : t("console.participants.entries.recordCount.other", { count: rows.length }, `${rows.length} Records`)
        }
        action={
          <Button href="/studio/participants/entries/new" size="sm">
            {t("console.participants.entries.newEntry", undefined, "+ New Entry")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/studio/participants/entries/${r.id}`}
          emptyLabel={t("console.participants.entries.emptyLabel", undefined, "No participant entries")}
          emptyDescription={t(
            "console.participants.entries.emptyDescription",
            undefined,
            "Per-discipline entries from each delegation; status flows through nominate → confirm → on-site.",
          )}
          emptyAction={
            <Button href="/studio/participants/entries/new" size="sm">
              {t("console.participants.entries.newEntry", undefined, "+ New Entry")}
            </Button>
          }
          columns={[
            {
              key: "participant_name",
              header: t("console.participants.entries.columns.participant", undefined, "Participant"),
              render: (r) => String(r.participant_name ?? "—"),
              accessor: (r) => r.participant_name ?? null,
            },
            {
              key: "discipline",
              header: t("console.participants.entries.columns.discipline", undefined, "Discipline"),
              render: (r) => String(r.discipline ?? "—"),
              accessor: (r) => r.discipline ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "event",
              header: t("console.participants.entries.columns.event", undefined, "Event"),
              render: (r) => String(r.event ?? "—"),
              accessor: (r) => r.event ?? null,
            },
            {
              key: "status",
              header: t("console.participants.entries.columns.status", undefined, "Status"),
              render: (r) => String(r.status ?? "—"),
              accessor: (r) => r.status ?? null,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
