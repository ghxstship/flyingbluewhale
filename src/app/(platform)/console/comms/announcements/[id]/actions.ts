"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({ id: z.string().uuid() });

export async function publishAnnouncement(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const { id } = Schema.parse(Object.fromEntries(fd));
  const supabase = await createClient();
  await supabase
    .from("announcements")
    .update({ publish_state: "published", published_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .eq("publish_state", "draft");
  revalidatePath(`/console/comms/announcements/${id}`);
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
