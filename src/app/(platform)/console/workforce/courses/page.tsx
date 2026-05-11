import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

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
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Workforce" title="Courses" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
        eyebrow="Workforce"
        title="Courses"
        subtitle={`${rows.length} course${rows.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/workforce/courses/new" size="sm">
            + New Course
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/workforce/courses/${r.id}`}
          emptyLabel="No courses yet"
          emptyDescription="Author micro-learning content with lessons + a quiz. Assign to crew via /m/learning."
          columns={[
            { key: "title", header: "Title", render: (r) => r.title },
            {
              key: "publish_state",
              header: "State",
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
              header: "Duration",
              render: (r) => (r.duration_minutes ? `${r.duration_minutes} min` : "—"),
            },
            {
              key: "required_for_role",
              header: "Role",
              render: (r) => r.required_for_role ?? "—",
            },
          ]}
        />
      </div>
    </>
  );
}
