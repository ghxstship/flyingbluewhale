import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataView } from "@/components/views/DataViewServer";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  description: string | null;
  target_role: string | null;
  publish_state: string;
  created_at: string;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.workforce.onboarding.eyebrow", undefined, "Workforce")}
          title={t("console.workforce.onboarding.title", undefined, "Onboarding")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.workforce.onboarding.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("new_hire_flows")
    .select("id, name, description, target_role, publish_state, created_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.onboarding.eyebrow", undefined, "Workforce")}
        title={t("console.workforce.onboarding.title", undefined, "Onboarding")}
        subtitle={t(
          "console.workforce.onboarding.subtitle",
          { count: rows.length, suffix: rows.length === 1 ? "" : "s" },
          `${rows.length} flow${rows.length === 1 ? "" : "s"} · new-hire journeys for /m/onboarding`,
        )}
        action={
          <Button href="/studio/workforce/onboarding/new" size="sm">
            {t("console.workforce.onboarding.newFlow", undefined, "+ New Flow")}
          </Button>
        }
      />
      <div className="page-content">
        <DataView<Row>
          rows={rows}
          rowHref={(r) => `/studio/workforce/onboarding/${r.id}`}
          emptyLabel={t("console.workforce.onboarding.emptyLabel", undefined, "No flows yet")}
          emptyDescription={t(
            "console.workforce.onboarding.emptyDescription",
            undefined,
            "Build a step-by-step new-hire journey: read SOPs, sign forms, complete courses. Assignees see it on /m/onboarding.",
          )}
          columns={[
            {
              key: "name",
              header: t("console.workforce.onboarding.col.name", undefined, "Name"),
              render: (r) => r.name,
            },
            {
              key: "publish_state",
              header: t("console.workforce.onboarding.col.state", undefined, "State"),
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
              key: "target_role",
              header: t("console.workforce.onboarding.col.role", undefined, "Role"),
              render: (r) => r.target_role ?? "—",
            },
          ]}
        />
      </div>
    </>
  );
}
