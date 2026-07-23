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
  question: string;
  publish_state: string;
  audience: string;
  closes_at: string | null;
  created_at: string;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.comms.polls.eyebrow", undefined, "Comms")}
          title={t("console.comms.polls.title", undefined, "Polls")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.comms.polls.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("polls")
    .select("id, question, publish_state, audience, closes_at, created_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.comms.polls.eyebrow", undefined, "Comms")}
        title={t("console.comms.polls.title", undefined, "Polls")}
        subtitle={
          rows.length === 1
            ? t("console.comms.polls.subtitleOne", { count: rows.length }, `${rows.length} poll`)
            : t("console.comms.polls.subtitleOther", { count: rows.length }, `${rows.length} polls`)
        }
        action={
          <Button href="/studio/comms/polls/new" size="sm">
            {t("console.comms.polls.newPoll", undefined, "+ New Poll")}
          </Button>
        }
      />
      <div className="page-content">
        <DataView<Row>
          rows={rows}
          rowHref={(r) => `/studio/comms/polls/${r.id}`}
          emptyLabel={t("console.comms.polls.emptyLabel", undefined, "No polls yet")}
          emptyDescription={t(
            "console.comms.polls.emptyDescription",
            undefined,
            "Quick one-question polls. Crews vote from /m/polls; results aggregate here.",
          )}
          columns={[
            {
              key: "question",
              header: t("console.comms.polls.col.question", undefined, "Question"),
              render: (r) => r.question,
            },
            {
              key: "publish_state",
              header: t("console.comms.polls.col.state", undefined, "Status"),
              render: (r) => (
                <Badge
                  variant={r.publish_state === "live" ? "success" : r.publish_state === "closed" ? "muted" : "info"}
                >
                  {r.publish_state}
                </Badge>
              ),
            },
            {
              key: "audience",
              header: t("console.comms.polls.col.audience", undefined, "Audience"),
              render: (r) => <Badge variant="muted">{toTitle(r.audience)}</Badge>,
            },
          ]}
        />
      </div>
    </>
  );
}
