"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const QSchema = z.object({
  surveyId: z.string().uuid(),
  prompt: z.string().min(1).max(400),
  question_kind: z.enum(["single_choice", "multi_choice", "scale", "text", "boolean"]),
  options: z.string().optional().or(z.literal("")),
});

export async function addQuestion(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = QSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  const supabase = await createClient();

  const { data: survey } = await supabase
    .from("surveys")
    .select("id, publish_state")
    .eq("id", parsed.data.surveyId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!survey || (survey as { publish_state: string }).publish_state !== "draft") return;

  const options =
    parsed.data.question_kind === "single_choice" ||
    parsed.data.question_kind === "multi_choice" ||
    parsed.data.question_kind === "scale"
      ? (parsed.data.options ?? "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 12)
      : [];

  const { count } = await supabase
    .from("survey_questions")
    .select("id", { count: "exact", head: true })
    .eq("survey_id", parsed.data.surveyId);
  const { error } = await supabase.from("survey_questions").insert({
    survey_id: parsed.data.surveyId,
    ordinal: (count ?? 0) + 1,
    prompt: parsed.data.prompt,
    question_kind: parsed.data.question_kind,
    options,
    required: true,
  });
  if (error) throw new Error(`Could not create survey question: ${error.message}`);
  revalidatePath(`/console/comms/surveys/${parsed.data.surveyId}`);
}

const IdSchema = z.object({ id: z.string().uuid() });

export async function publishSurvey(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const idParsed = IdSchema.safeParse(Object.fromEntries(fd));
  if (!idParsed.success) throw new Error(idParsed.error.issues[0]?.message ?? "Invalid input");
  const { id } = idParsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("surveys")
    .update({ publish_state: "published" })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .eq("publish_state", "draft");
  if (error) throw new Error(`Could not update survey: ${error.message}`);
  revalidatePath(`/console/comms/surveys/${id}`);
  revalidatePath("/console/comms/surveys");
}

export async function closeSurvey(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const idParsed = IdSchema.safeParse(Object.fromEntries(fd));
  if (!idParsed.success) throw new Error(idParsed.error.issues[0]?.message ?? "Invalid input");
  const { id } = idParsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("surveys")
    .update({ publish_state: "closed" })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .eq("publish_state", "published");
  if (error) throw new Error(`Could not update survey: ${error.message}`);
  revalidatePath(`/console/comms/surveys/${id}`);
  revalidatePath("/console/comms/surveys");
}
