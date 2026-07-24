"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  question: z.string().min(1).max(300),
  options: z.string().min(1),
  audience: z.enum(["all", "crew", "contractors", "vendors", "admins"]),
  publish_now: z.string().optional(),
  closes_at: z.string().optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createPollAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.publish-polls", "Only manager+ can publish polls") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const options = parsed.data.options
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
  if (options.length < 2) return { error: actionErrorMessage("need-at-least-2-options", "Need at least 2 options") };

  const supabase = await createClient();
  const live = parsed.data.publish_now === "on";
  // datetime-local submits a naive local timestamp; Date() interprets it in
  // the server's zone and toISOString() normalizes to UTC. Empty → no deadline.
  const closesAt = parsed.data.closes_at ? new Date(parsed.data.closes_at) : null;
  if (closesAt && Number.isNaN(closesAt.getTime())) return actionFail("Invalid close date.", fd);
  const { data: poll, error } = await supabase
    .from("polls")
    .insert({
      org_id: session.orgId,
      question: parsed.data.question,
      audience: parsed.data.audience,
      closes_at: closesAt ? closesAt.toISOString() : null,
      publish_state: live ? "live" : "draft",
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  const { error: insertError } = await supabase
    .from("poll_options")
    .insert(options.map((label, idx) => ({ poll_id: poll.id, ordinal: idx + 1, label })));
  if (insertError) return actionFail(insertError.message, fd);

  revalidatePath("/studio/comms/polls");
  redirect(`/studio/comms/polls/${poll.id}`);
}
