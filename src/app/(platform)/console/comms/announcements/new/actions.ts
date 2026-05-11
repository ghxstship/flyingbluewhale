"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(8000),
  audience: z.enum(["all", "crew", "contractors", "vendors", "admins"]),
  pinned: z.string().optional(),
  publish_now: z.string().optional(),
});

export type State = { error?: string } | null;

export async function createAnnouncementAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Org-wide announcements broadcast — manager+ only.
  if (!isManagerPlus(session)) return { error: "Only manager+ can publish announcements" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();

  const publish = parsed.data.publish_now === "on";
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      org_id: session.orgId,
      author_id: session.userId,
      title: parsed.data.title,
      body: parsed.data.body,
      audience: parsed.data.audience,
      pinned: parsed.data.pinned === "on",
      publish_state: publish ? "published" : "draft",
      published_at: publish ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/console/comms/announcements");
  redirect(`/console/comms/announcements/${data.id}`);
}
