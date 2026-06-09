"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { writeInboxBulk } from "@/lib/inbox";

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
    .select("id, title, body, audience")
    .maybeSingle();
  if (error) throw new Error(`Could not update announcement: ${error.message}`);

  // Fan out push only if the conditional UPDATE actually flipped a row
  // (i.e. it was previously draft). Avoids re-pushing on a no-op
  // double-click. Push fan-out is best-effort — when the service-role
  // key is missing in dev, the publish still succeeds; only the push
  // is skipped.
  if (updated && isServiceClientAvailable()) {
    const u = updated as { id: string; title: string; body: string; audience: string };
    const service = createServiceClient();
    const roleFilter: ("owner" | "admin" | "manager" | "member")[] | null =
      u.audience === "all"
        ? null
        : u.audience === "admins"
          ? ["owner", "admin"]
          : u.audience === "crew"
            ? ["member"]
            : null;
    let query = service.from("memberships").select("user_id").eq("org_id", session.orgId).is("deleted_at", null);
    if (roleFilter) query = query.in("role", roleFilter);
    const { data: recipients } = await query;
    const userIds = ((recipients ?? []) as Array<{ user_id: string }>).map((r) => r.user_id);
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
  revalidatePath(`/console/comms/announcements/${id}`);
  revalidatePath("/console/comms/announcements");
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
  revalidatePath("/console/comms/announcements");
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
  revalidatePath(`/console/comms/announcements/${id}`);
  revalidatePath("/console/comms/announcements");
}
