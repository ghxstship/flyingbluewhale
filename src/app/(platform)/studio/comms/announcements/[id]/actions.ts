"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { writeInboxBulk } from "@/lib/inbox";
import { resolveAnnouncementRecipients, type AnnouncementAudience } from "@/lib/db/announcements";

const Schema = z.object({ id: z.string().uuid() });

export async function publishAnnouncement(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  const { id } = parsed.data;
  const supabase = await createClient();
  const { error, data: updated } = await supabase
    .from("announcements")
    .update({ publish_state: "published", published_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .eq("publish_state", "draft")
    .select("id, title, body, audience, project_id, team_id")
    .maybeSingle();
  if (error) throw new Error(`Could not update announcement: ${error.message}`);

  // Fan out push only if the conditional UPDATE actually flipped a row
  // (i.e. it was previously draft). Avoids re-pushing on a no-op
  // double-click. Push fan-out is best-effort — when the service-role
  // key is missing in dev, the publish still succeeds; only the push
  // is skipped.
  if (updated && isServiceClientAvailable()) {
    const u = updated as {
      id: string;
      title: string;
      body: string;
      audience: AnnouncementAudience;
      project_id: string | null;
      team_id: string | null;
    };
    const service = createServiceClient();
    // Shared audience resolution (src/lib/db/announcements.ts) — same mapping
    // as the create-time fan-out and the feed read side. Also honors the
    // project/team narrowing this action previously ignored.
    const userIds = await resolveAnnouncementRecipients(service, {
      orgId: session.orgId,
      audience: u.audience,
      teamId: u.team_id,
      projectId: u.project_id,
    });
    if (userIds.length > 0) {
      // Source-keyed upsert collapses re-publish into the same inbox
      // row (one announcement → one inbox card per recipient, even on
      // re-publish from draft).
      void writeInboxBulk(userIds, {
        orgId: session.orgId,
        kind: "announcement",
        sourceType: "announcements",
        sourceId: u.id,
        actorId: session.userId,
        title: u.title,
        body: u.body,
        href: "/m/feed",
      });
    }
  }
  revalidatePath(`/studio/comms/announcements/${id}`);
  revalidatePath("/studio/comms/announcements");
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not update announcement: ${error.message}`);
  revalidatePath("/studio/comms/announcements");
}

export async function archiveAnnouncement(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  const { id } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .update({ publish_state: "archived" })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(`Could not update announcement: ${error.message}`);
  revalidatePath(`/studio/comms/announcements/${id}`);
  revalidatePath("/studio/comms/announcements");
}
