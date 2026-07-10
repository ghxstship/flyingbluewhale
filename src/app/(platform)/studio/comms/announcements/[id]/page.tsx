import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { buttonVariants } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import Link from "next/link";
import { publishAnnouncement, archiveAnnouncement, deleteAnnouncement } from "./actions";
import { DeleteForm } from "@/components/DeleteForm";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">
        {t("console.comms.announcements.detail.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const { id } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("announcements")
    .select("id, title, body, audience, pinned, publish_state, published_at, created_at, read_count")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) notFound();
  const a = data as {
    id: string;
    title: string;
    body: string;
    audience: string;
    pinned: boolean;
    publish_state: string;
    published_at: string | null;
    created_at: string;
    read_count: number;
  };
  const readCount = a.read_count;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.comms.announcements.detail.eyebrow", undefined, "Announcement")}
        title={a.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge
              variant={a.publish_state === "published" ? "success" : a.publish_state === "archived" ? "muted" : "info"}
            >
              {a.publish_state}
            </Badge>
            <Badge variant="muted">{toTitle(a.audience)}</Badge>
            {a.pinned && (
              <Badge variant="warning">{t("console.comms.announcements.detail.pinned", undefined, "Pinned")}</Badge>
            )}
            <span className="font-mono text-xs">
              {t("console.comms.announcements.detail.readCount", { count: readCount ?? 0 }, `${readCount ?? 0} read`)}
            </span>
          </span>
        }
      />
      <div className="page-content max-w-2xl space-y-4">
        <article className="surface p-6 text-sm whitespace-pre-wrap">{a.body}</article>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/studio/comms/announcements/${a.id}/edit`}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            {t("common.edit", undefined, "Edit")}
          </Link>
          {a.publish_state === "draft" && (
            <form action={publishAnnouncement}>
              <input type="hidden" name="id" value={a.id} />
              <button type="submit" className="ps-btn ps-btn--sm">
                {t("console.comms.announcements.detail.publish", undefined, "Publish")}
              </button>
            </form>
          )}
          {a.publish_state !== "archived" && (
            <form action={archiveAnnouncement}>
              <input type="hidden" name="id" value={a.id} />
              <button type="submit" className="ps-btn ps-btn--ghost ps-btn--sm">
                {t("console.comms.announcements.detail.archive", undefined, "Archive")}
              </button>
            </form>
          )}
          <DeleteForm
            action={deleteAnnouncement.bind(null, a.id)}
            confirm={t(
              "console.comms.announcements.detail.deleteConfirm",
              undefined,
              "Soft-delete this announcement? It will stop appearing in /m/feed.",
            )}
            undo={{ table: "announcements", id: a.id, redirectTo: "/studio/comms/announcements" }}
          />
        </div>
      </div>
    </>
  );
}
