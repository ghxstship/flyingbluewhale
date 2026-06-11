"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({ surveyId: z.string().uuid() });

export type State = { error?: string } | null;

export async function submitSurvey(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const entries = Object.fromEntries(fd.entries());
  const parsed = Schema.safeParse({ surveyId: entries.surveyId });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();

  const { data: survey } = await supabase
    .from("surveys")
    .select("id, anonymous, publish_state")
    .eq("id", parsed.data.surveyId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!survey || (survey as { publish_state: string }).publish_state !== "published") {
    return { error: "This survey is no longer accepting responses" };
  }

  // Collate q_<id> → answer (handle multi-select by reading getAll).
  const answers: Record<string, string | string[]> = {};
  const seen = new Set<string>();
  for (const k of fd.keys()) {
    if (!k.startsWith("q_") || seen.has(k)) continue;
    seen.add(k);
    const values = fd.getAll(k).map((v) => String(v));
    answers[k.slice(2)] = values.length === 1 ? values[0]! : values;
  }

  const { error } = await supabase.from("survey_responses").insert({
    survey_id: parsed.data.surveyId,
    respondent_id: (survey as { anonymous: boolean }).anonymous ? null : session.userId,
    answers,
  });
  if (error) return { error: `Could not submit survey: ${error.message}` };

  revalidatePath("/m/surveys");
  redirect("/m/surveys");
}
