import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataView } from "@/components/views/DataViewServer";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  publish_state: string;
  audience: string;
  anonymous: boolean;
  closes_at: string | null;
  created_at: string;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.comms.surveys.eyebrow", undefined, "Comms")}
          title={t("console.comms.surveys.title", undefined, "Surveys")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.comms.surveys.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("surveys")
    .select("id, title, publish_state, audience, anonymous, closes_at, created_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.comms.surveys.eyebrow", undefined, "Comms")}
        title={t("console.comms.surveys.title", undefined, "Surveys")}
        subtitle={
          rows.length === 1
            ? t("console.comms.surveys.subtitleOne", { count: rows.length }, `${rows.length} survey`)
            : t("console.comms.surveys.subtitleOther", { count: rows.length }, `${rows.length} surveys`)
        }
        action={
          <Button href="/studio/comms/surveys/new" size="sm">
            {t("console.comms.surveys.newSurvey", undefined, "+ New Survey")}
          </Button>
        }
      />
      <div className="page-content">
        <DataView<Row>
          rows={rows}
          rowHref={(r) => `/studio/comms/surveys/${r.id}`}
          emptyLabel={t("console.comms.surveys.emptyLabel", undefined, "No surveys yet")}
          emptyDescription={t(
            "console.comms.surveys.emptyDescription",
            undefined,
            "Pulse, eNPS, and suggestion-box surveys. Anonymous mode strips respondent_id.",
          )}
          columns={[
            {
              key: "title",
              header: t("console.comms.surveys.columns.title", undefined, "Title"),
              render: (r) => r.title,
            },
            {
              key: "publish_state",
              header: t("console.comms.surveys.columns.state", undefined, "Status"),
              // A passed closes_at closes the survey for respondents even
              // before the state flips, so the badge must agree with the
              // taker (/m/surveys) instead of showing a green "published".
              render: (r) => {
                const deadlinePassed =
                  r.publish_state === "published" && !!r.closes_at && Date.parse(r.closes_at) <= Date.now();
                const effective = deadlinePassed ? "closed" : r.publish_state;
                return (
                  <Badge variant={effective === "published" ? "success" : effective === "closed" ? "muted" : "info"}>
                    {effective}
                  </Badge>
                );
              },
            },
            {
              key: "audience",
              header: t("console.comms.surveys.columns.audience", undefined, "Audience"),
              render: (r) => <Badge variant="muted">{toTitle(r.audience)}</Badge>,
            },
            {
              key: "anonymous",
              header: t("console.comms.surveys.columns.anon", undefined, "Anon"),
              render: (r) => (r.anonymous ? t("common.yes", undefined, "Yes") : "—"),
            },
          ]}
        />
      </div>
    </>
  );
}
