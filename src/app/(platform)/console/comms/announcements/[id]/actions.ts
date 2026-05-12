"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendPushBulk } from "@/lib/push/send";

const Schema = z.object({ id: z.string().uuid() });

export async function publishAnnouncement(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const { id } = Schema.parse(Object.fromEntries(fd));
  const supabase = await createClient();
  const { data: updated } = await supabase
    .from("announcements")
    .update({ publish_state: "published", published_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .eq("publish_state", "draft")
    .select("id, title, body, audience")
    .maybeSingle();

  // Fan out push only if the conditional UPDATE actually flipped a row
  // (i.e. it was previously draft). Avoids re-pushing on a no-op
  // double-click.
  if (updated) {
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
      void sendPushBulk(userIds, {
        title: u.title,
        body: u.body.slice(0, 200),
        url: "/m/feed",
        tag: `announcement:${u.id}`,
        kind: "announcement",
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
  await supabase
    .from("announcements")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId);
  revalidatePath("/console/comms/announcements");
}

export async function archiveAnnouncement(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const { id } = Schema.parse(Object.fromEntries(fd));
  const supabase = await createClient();
  await supabase.from("announcements").update({ publish_state: "archived" }).eq("id", id).eq("org_id", session.orgId);
  revalidatePath(`/console/comms/announcements/${id}`);
  revalidatePath("/console/comms/announcements");
}
