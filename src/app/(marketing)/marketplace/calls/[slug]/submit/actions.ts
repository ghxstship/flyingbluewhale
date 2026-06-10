"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import type { FormState } from "@/components/FormShell";

const Schema = z.object({
  cover_note: z.string().min(10, "Pitch the buyer — at least 10 characters").max(4000),
  links: z.string().max(2000).optional().or(z.literal("")),
});

export async function submitToCall(slug: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const links = (parsed.data.links ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);
  for (const link of links) {
    if (!z.string().url().safeParse(link).success) {
      return actionFail(`Links must be full URLs — "${link}" is not one. One link per line.`, fd);
    }
  }

  const supabase = await createClient();

  // Resolve the call under the public-select RLS policy (published only).
  // The public_open_calls view omits org_id, so we read the base table here.
  const { data: call, error: callError } = await supabase
    .from("open_calls")
    .select("id, org_id, deadline_at")
    .eq("public_slug", slug)
    .eq("open_call_phase", "published")
    .is("deleted_at", null)
    .maybeSingle();
  if (callError) return actionFail(callError.message, fd);
  if (!call || (call.deadline_at && new Date(call.deadline_at) <= new Date())) {
    return actionFail("This call is no longer accepting submissions.", fd);
  }

  // Duplicate guard — one live submission per user per call.
  const { data: existing, error: existingError } = await supabase
    .from("open_call_submissions")
    .select("id")
    .eq("open_call_id", call.id)
    .eq("submitter_user_id", session.userId)
    .neq("submission_state", "withdrawn")
    .maybeSingle();
  if (existingError) return actionFail(existingError.message, fd);
  if (existing) {
    return actionFail("You've already submitted to this call. Track it under My Submissions.", fd);
  }

  const { error } = await supabase.from("open_call_submissions").insert({
    org_id: call.org_id,
    open_call_id: call.id,
    submitter_user_id: session.userId,
    cover_note: parsed.data.cover_note,
    attachments: links.map((url) => ({ kind: "link", url })),
  });
  if (error) {
    if (error.code === "23505") {
      return actionFail("You've already submitted to this call. Track it under My Submissions.", fd);
    }
    return actionFail(error.message, fd);
  }

  redirect("/me/submissions?submitted=1");
}
