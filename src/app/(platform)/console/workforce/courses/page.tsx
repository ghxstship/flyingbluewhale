import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  summary: string | null;
  publish_state: string;
  duration_minutes: number | null;
  required_for_role: string | null;
  created_at: string;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.workforce.courses.eyebrow", undefined, "Workforce")}
          title={t("console.workforce.courses.title", undefined, "Courses")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.workforce.courses.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("id, title, summary, publish_state, duration_minutes, required_for_role, created_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.courses.eyebrow", undefined, "Workforce")}
        title={t("console.workforce.courses.title", undefined, "Courses")}
        subtitle={
          rows.length === 1
            ? t("console.workforce.courses.subtitleOne", { count: rows.length }, `${rows.length} course`)
            : t("console.workforce.courses.subtitleOther", { count: rows.length }, `${rows.length} courses`)
        }
        action={
          <div className="flex items-center gap-2">
            <Button href="/console/workforce/courses/generate" size="sm" variant="ghost">
              {t("console.workforce.courses.generateWithAI", undefined, "Generate with AI")}
            </Button>
            <Button href="/console/workforce/courses/new" size="sm">
              {t("console.workforce.courses.newCourse", undefined, "+ New Course")}
            </Button>
          </div>
        }
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/workforce/courses/${r.id}`}
          emptyLabel={t("console.workforce.courses.emptyLabel", undefined, "No Courses Yet")}
          emptyDescription={t(
            "console.workforce.courses.emptyDescription",
            undefined,
            "Author micro-learning content with lessons and a quiz, then assign it to crew — they complete it from the COMPVSS learning tab.",
          )}
          emptyAction={
            <Button href="/console/workforce/courses/new" size="sm">
              {t("console.workforce.courses.createFirst", undefined, "Create Your First Course")}
            </Button>
          }
          columns={[
            {
              key: "title",
              header: t("console.workforce.courses.columns.title", undefined, "Title"),
              render: (r) => r.title,
            },
            {
              key: "publish_state",
              header: t("console.workforce.courses.columns.state", undefined, "State"),
              render: (r) => (
                <Badge
                  variant={
                    r.publish_state === "published" ? "success" : r.publish_state === "archived" ? "muted" : "info"
                  }
                >
                  {r.publish_state}
                </Badge>
              ),
            },
            {
              key: "duration_minutes",
              header: t("console.workforce.courses.columns.duration", undefined, "Duration"),
              render: (r) =>
                r.duration_minutes
                  ? t(
                      "console.workforce.courses.durationMinutes",
                      { minutes: r.duration_minutes },
                      `${r.duration_minutes} min`,
                    )
                  : "—",
            },
            {
              key: "required_for_role",
              header: t("console.workforce.courses.columns.role", undefined, "Role"),
              render: (r) => r.required_for_role ?? "—",
            },
          ]}
        />
      </div>
    </>
  );
}
