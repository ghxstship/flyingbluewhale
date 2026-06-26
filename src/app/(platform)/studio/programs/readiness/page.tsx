import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
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
          eyebrow={t("console.programs.readiness.eyebrowWorkspace", undefined, "Workspace")}
          title={t("console.programs.readiness.title", undefined, "Readiness Exercises")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.programs.readiness.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("readiness_exercises", session.orgId, {
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
        eyebrow={t("console.programs.readiness.eyebrow", undefined, "Programs")}
        title={t("console.programs.readiness.title", undefined, "Readiness Exercises")}
        subtitle={`${total} ${total === 1 ? t("console.programs.readiness.record", undefined, "Record") : t("console.programs.readiness.records", undefined, "Records")}`}
        action={
          <Button href="/studio/programs/readiness/new" size="sm">
            {t("console.programs.readiness.newExercise", undefined, "+ New Exercise")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          totalCount={total}
          rowHref={(r) => `/studio/programs/readiness/${r.id}`}
          emptyLabel={t("console.programs.readiness.emptyLabel", undefined, "No readiness exercises")}
          emptyDescription={t(
            "console.programs.readiness.emptyDescription",
            undefined,
            "Tabletop drills, full-scale rehearsals, and after-action reviews live here.",
          )}
          emptyAction={
            <Button href="/studio/programs/readiness/new" size="sm">
              {t("console.programs.readiness.newExercise", undefined, "+ New Exercise")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.programs.readiness.columns.name", undefined, "Name"),
              render: (r) => String(r.name ?? "—"),
              accessor: (r) => r.name ?? null,
            },
            {
              key: "kind",
              header: t("console.programs.readiness.columns.kind", undefined, "Kind"),
              render: (r) => String(r.kind ?? "—"),
              accessor: (r) => r.kind ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "scheduled_at",
              header: t("console.programs.readiness.columns.scheduled", undefined, "Scheduled"),
              render: (r) => <span className="font-mono text-xs">{String(r.scheduled_at ?? "—")}</span>,
              accessor: (r) => r.scheduled_at ?? null,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/programs/readiness"
          searchParams={sp}
        />
      </div>
    </>
  );
}
