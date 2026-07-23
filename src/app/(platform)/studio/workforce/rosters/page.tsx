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
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("rosters", session.orgId, {
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
        eyebrow={t("console.workforce.rosters.eyebrow", undefined, "Workforce")}
        title={t("console.workforce.rosters.title", undefined, "Rosters")}
        subtitle={
          total === 1
            ? t("console.workforce.rosters.subtitleOne", { count: total }, `${total} Record`)
            : t("console.workforce.rosters.subtitleOther", { count: total }, `${total} Records`)
        }
        action={
          <div className="flex items-center gap-2">
            <Button href="/studio/operations/schedule?lane=crew&kind=shift" size="sm" variant="secondary">
              {t("console.workforce.rosters.openSchedule", undefined, "Open in Schedule")}
            </Button>
            <Button href="/studio/workforce/rosters/new" size="sm">
              {t("console.workforce.rosters.newRoster", undefined, "+ New Roster")}
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-3">
        <DataView
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          totalCount={total}
          rowHref={(r) => `/studio/workforce/rosters/${r.id}`}
          emptyLabel={t("console.workforce.rosters.emptyLabel", undefined, "No rosters")}
          emptyDescription={t(
            "console.workforce.rosters.emptyDescription",
            undefined,
            "Daily rosters drive scheduling, sign-in, and call-time delivery for the workforce.",
          )}
          emptyAction={
            <Button href="/studio/workforce/rosters/new" size="sm">
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
              render: (r) => String(r.day_of ?? "—"),
              mono: true,
              accessor: (r) => r.day_of ?? null,
            },
            {
              key: "state",
              header: t("console.workforce.rosters.col.state", undefined, "Status"),
              render: (r) => String(r.state ?? "—"),
              accessor: (r) => r.state ?? null,
              filterable: true,
              groupable: true,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/workforce/rosters"
          searchParams={sp}
        />
      </div>
    </>
  );
}
