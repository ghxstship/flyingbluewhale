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
          eyebrow={t("console.workforce.rosters.eyebrowFallback", undefined, "Workspace")}
          title={t("console.workforce.rosters.title", undefined, "Rosters")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.workforce.rosters.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("rosters", session.orgId, { orderBy: "created_at", ascending: false, limit: 500 });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.rosters.eyebrow", undefined, "Workforce")}
        title={t("console.workforce.rosters.title", undefined, "Rosters")}
        subtitle={
          rows.length === 1
            ? t("console.workforce.rosters.subtitleOne", { count: rows.length }, `${rows.length} Record`)
            : t("console.workforce.rosters.subtitleOther", { count: rows.length }, `${rows.length} Records`)
        }
        action={
          <Button href="/console/workforce/rosters/new" size="sm">
            {t("console.workforce.rosters.newRoster", undefined, "+ New Roster")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/workforce/rosters/${r.id}`}
          emptyLabel={t("console.workforce.rosters.emptyLabel", undefined, "No rosters")}
          emptyDescription={t(
            "console.workforce.rosters.emptyDescription",
            undefined,
            "Daily rosters drive scheduling, sign-in, and call-time delivery for the workforce.",
          )}
          emptyAction={
            <Button href="/console/workforce/rosters/new" size="sm">
              {t("console.workforce.rosters.newRoster", undefined, "+ New Roster")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.workforce.rosters.col.name", undefined, "Name"),
              render: (r) => String(r.name ?? "—"),
              accessor: (r) => r.name ?? null,
            },
            {
              key: "day_of",
              header: t("console.workforce.rosters.col.day", undefined, "Day"),
              render: (r) => <span className="font-mono text-xs">{String(r.day_of ?? "—")}</span>,
              accessor: (r) => r.day_of ?? null,
            },
            {
              key: "state",
              header: t("console.workforce.rosters.col.state", undefined, "State"),
              render: (r) => String(r.state ?? "—"),
              accessor: (r) => r.state ?? null,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
