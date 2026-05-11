import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { publishAnnouncement, archiveAnnouncement } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) return <div className="page-content">Configure Supabase.</div>;
  const { id } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("announcements")
    .select("id, title, body, audience, pinned, publish_state, published_at, created_at")
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
  };

  const { count: readCount } = await supabase
    .from("announcement_reads")
    .select("announcement_id", { count: "exact", head: true })
    .eq("announcement_id", id);

  return (
    <>
      <ModuleHeader
        eyebrow="Announcement"
        title={a.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge
              variant={a.publish_state === "published" ? "success" : a.publish_state === "archived" ? "muted" : "info"}
            >
              {a.publish_state}
            </Badge>
            <Badge variant="muted">{a.audience}</Badge>
            {a.pinned && <Badge variant="warning">Pinned</Badge>}
            <span className="font-mono text-xs">{readCount ?? 0} read</span>
          </span>
        }
      />
      <div className="page-content max-w-2xl space-y-4">
        <article className="surface p-6 text-sm whitespace-pre-wrap">{a.body}</article>
        <div className="flex gap-2">
          {a.publish_state === "draft" && (
            <form action={publishAnnouncement}>
              <input type="hidden" name="id" value={a.id} />
              <Button type="submit">Publish</Button>
            </form>
          )}
          {a.publish_state !== "archived" && (
            <form action={archiveAnnouncement}>
              <input type="hidden" name="id" value={a.id} />
              <Button type="submit" variant="secondary">Archive</Button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
