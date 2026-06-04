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
  const rows = await listOrgScoped("program_reviews", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.programs.reviews.eyebrow", undefined, "Programs")}
        title={t("console.programs.reviews.title", undefined, "Program Reviews")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.programs.reviews.record", undefined, "Record") : t("console.programs.reviews.records", undefined, "Records")}`}
        action={
          <Button href="/console/programs/reviews/new" size="sm">
            {t("console.programs.reviews.scheduleReview", undefined, "+ Schedule review")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/console/programs/reviews/${r.id}`}
          emptyLabel={t("console.programs.reviews.emptyLabel", undefined, "No program reviews")}
          emptyDescription={t(
            "console.programs.reviews.emptyDescription",
            undefined,
            "Stage gates, mid-event syncs, and post-mortems with attached actions.",
          )}
          emptyAction={
            <Button href="/console/programs/reviews/new" size="sm">
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
      </div>
    </>
  );
}
