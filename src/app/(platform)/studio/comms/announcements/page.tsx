import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  audience: string;
  publish_state: string;
  pinned: boolean;
  published_at: string | null;
  created_at: string;
};

export default async function AnnouncementsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.comms.announcements.eyebrow", undefined, "Comms")}
          title={t("console.comms.announcements.title", undefined, "Announcements")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.comms.announcements.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("id, title, audience, publish_state, pinned, published_at, created_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.comms.announcements.eyebrow", undefined, "Comms")}
        title={t("console.comms.announcements.title", undefined, "Announcements")}
        subtitle={
          rows.length === 1
            ? t("console.comms.announcements.subtitleOne", { count: rows.length }, `${rows.length} announcement`)
            : t("console.comms.announcements.subtitleOther", { count: rows.length }, `${rows.length} announcements`)
        }
        action={
          <Button href="/studio/comms/announcements/new" size="sm">
            {t("console.comms.announcements.newLabel", undefined, "+ New")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/studio/comms/announcements/${r.id}`}
          emptyLabel={t("console.comms.announcements.emptyLabel", undefined, "No Announcements Yet")}
          emptyDescription={t(
            "console.comms.announcements.emptyDescription",
            undefined,
            "Push org-wide updates to crew, contractors, vendors, or admins. Published announcements land in the COMPVSS field feed.",
          )}
          emptyAction={
            <Button href="/studio/comms/announcements/new" size="sm">
              {t("console.comms.announcements.createFirst", undefined, "Post Your First Announcement")}
            </Button>
          }
          columns={[
            {
              key: "title",
              header: t("console.comms.announcements.columns.title", undefined, "Title"),
              render: (r) => r.title,
            },
            {
              key: "publish_state",
              header: t("console.comms.announcements.columns.state", undefined, "State"),
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
              key: "audience",
              header: t("console.comms.announcements.columns.audience", undefined, "Audience"),
              render: (r) => <Badge variant="muted">{toTitle(r.audience)}</Badge>,
            },
            {
              key: "pinned",
              header: t("console.comms.announcements.columns.pinned", undefined, "Pinned"),
              render: (r) => (r.pinned ? t("common.yes", undefined, "Yes") : "—"),
            },
          ]}
        />
      </div>
    </>
  );
}
