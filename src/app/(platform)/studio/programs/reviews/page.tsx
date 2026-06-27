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
          eyebrow={t("console.programs.reviews.eyebrowWorkspace", undefined, "Workspace")}
          title={t("console.programs.reviews.title", undefined, "Program Reviews")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.programs.reviews.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("program_reviews", session.orgId, {
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
        eyebrow={t("console.programs.reviews.eyebrow", undefined, "Programs")}
        title={t("console.programs.reviews.title", undefined, "Program Reviews")}
        subtitle={`${total} ${total === 1 ? t("console.programs.reviews.record", undefined, "Record") : t("console.programs.reviews.records", undefined, "Records")}`}
        action={
          <Button href="/studio/programs/reviews/new" size="sm">
            {t("console.programs.reviews.scheduleReview", undefined, "+ Schedule review")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          totalCount={total}
          rowHref={(r) => `/studio/programs/reviews/${r.id}`}
          emptyLabel={t("console.programs.reviews.emptyLabel", undefined, "No program reviews")}
          emptyDescription={t(
            "console.programs.reviews.emptyDescription",
            undefined,
            "Stage gates, mid-event syncs, and post-mortems with attached actions.",
          )}
          emptyAction={
            <Button href="/studio/programs/reviews/new" size="sm">
              {t("console.programs.reviews.scheduleReview", undefined, "+ Schedule review")}
            </Button>
          }
          columns={[
            {
              key: "title",
              header: t("console.programs.reviews.columns.title", undefined, "Title"),
              render: (r) => String(r.title ?? "—"),
              accessor: (r) => r.title ?? null,
            },
            {
              key: "scheduled_at",
              header: t("console.programs.reviews.columns.scheduled", undefined, "Scheduled"),
              render: (r) => <span className="font-mono text-xs">{String(r.scheduled_at ?? "—")}</span>,
              accessor: (r) => r.scheduled_at ?? null,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/programs/reviews"
          searchParams={sp}
        />
      </div>
    </>
  );
}
