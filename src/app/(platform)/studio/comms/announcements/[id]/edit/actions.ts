"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(8000),
  audience: z.enum(["all", "crew", "contractors", "vendors", "admins"]),
  pinned: z.string().optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function updateAnnouncement(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit announcements" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  const { error } = await supabase
    .from("announcements")
    .update({
      title: parsed.data.title,
      body: parsed.data.body,
      audience: parsed.data.audience,
      pinned: parsed.data.pinned === "on",
    })
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) return actionFail(error.message, fd);

  revalidatePath(`/studio/comms/announcements/${parsed.data.id}`);
  revalidatePath("/studio/comms/announcements");
  redirect(`/studio/comms/announcements/${parsed.data.id}`);
}
