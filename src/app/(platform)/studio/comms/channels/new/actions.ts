"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { CHANNEL_KINDS } from "@/lib/messaging/queries";

const Schema = z.object({
  name: z.string().min(1).max(200),
  kind: z.enum(CHANNEL_KINDS),
  topic: z.string().max(500).optional().or(z.literal("")),
  project_id: z.string().uuid().optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createChannel(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Creating a channel is org-config — manager+.
  if (!isManagerPlus(session)) return { error: "Only manager+ can create channels" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // If a project was chosen, verify it is org-scoped before binding.
  if (parsed.data.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", parsed.data.project_id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!project) return actionFail("Project not found", fd);
  }

  const { data, error } = await supabase
    .from("message_channels")
    .insert({
      org_id: session.orgId,
      kind: parsed.data.kind,
      name: parsed.data.name,
      topic: parsed.data.topic || null,
      project_id: parsed.data.project_id || null,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  revalidatePath("/studio/comms/channels");
  redirect(`/studio/comms/channels/${data.id}`);
}
