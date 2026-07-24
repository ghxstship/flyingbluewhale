"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  audience: z.enum(["all", "crew", "contractors", "vendors", "admins"]),
  anonymous: z.string().optional(),
  publish_now: z.string().optional(),
  closes_at: z.string().optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createSurveyAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.publish-surveys", "Only manager+ can publish surveys") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  const publish = parsed.data.publish_now === "on";
  // datetime-local submits a naive local timestamp; Date() interprets it in
  // the server's zone and toISOString() normalizes to UTC. Empty → no deadline.
  const closesAt = parsed.data.closes_at ? new Date(parsed.data.closes_at) : null;
  if (closesAt && Number.isNaN(closesAt.getTime())) return actionFail(actionErrorMessage("invalid.close-date", "Invalid close date."), fd);
  const { data: survey, error } = await supabase
    .from("surveys")
    .insert({
      org_id: session.orgId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      audience: parsed.data.audience,
      anonymous: parsed.data.anonymous === "on",
      closes_at: closesAt ? closesAt.toISOString() : null,
      publish_state: publish ? "published" : "draft",
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  revalidatePath("/studio/comms/surveys");
  redirect(`/studio/comms/surveys/${survey.id}`);
}
