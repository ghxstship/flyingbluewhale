"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  question: z.string().min(1).max(300),
  options: z.string().min(1),
  audience: z.enum(["all", "crew", "contractors", "vendors", "admins"]),
  publish_now: z.string().optional(),
});

export type State = { error?: string } | null;

export async function createPollAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can publish polls" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const options = parsed.data.options
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
  if (options.length < 2) return { error: "Need at least 2 options" };

  const supabase = await createClient();
  const live = parsed.data.publish_now === "on";
  const { data: poll, error } = await supabase
    .from("polls")
    .insert({
      org_id: session.orgId,
      question: parsed.data.question,
      audience: parsed.data.audience,
      publish_state: live ? "live" : "draft",
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const { error: insertError } = await supabase
    .from("poll_options")
    .insert(options.map((label, idx) => ({ poll_id: poll.id, ordinal: idx + 1, label })));
  if (insertError) return { error: insertError.message };

  revalidatePath("/console/comms/polls");
  redirect(`/console/comms/polls/${poll.id}`);
}
