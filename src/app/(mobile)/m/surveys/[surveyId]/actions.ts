"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { audiencesForViewer } from "@/lib/db/announcements";

/**
 * Survey taker action — the ONLY writer of `survey_responses` in the app.
 * Validates the survey is org-scoped, published, inside its deadline, and
 * targeted at an audience the caller belongs to, then re-validates every
 * answer against the live question set (never trusting the client's field
 * names alone).
 */

export type State = { error?: string; fieldErrors?: Record<string, string> } | null;

const Schema = z.object({ survey_id: z.string().uuid() });

type SurveyRow = {
  id: string;
  anonymous: boolean;
  publish_state: string;
  closes_at: string | null;
  audience: string;
};

type QuestionRow = {
  id: string;
  question_kind: string;
  options: unknown;
  required: boolean;
};

export async function submitSurveyResponse(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse({ survey_id: fd.get("survey_id") });
  if (!parsed.success) return { error: "Invalid submission." };
  const supabase = await createClient();

  const { data: surveyData } = await supabase
    .from("surveys")
    .select("id, anonymous, publish_state, closes_at, audience")
    .eq("id", parsed.data.survey_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  const survey = surveyData as SurveyRow | null;
  if (!survey) return { error: "Survey not found." };
  if (survey.publish_state !== "published") return { error: "This survey is not open." };
  // Hard gate on the deadline even while publish_state is still
  // "published" — flipping the state at the deadline is a separate close
  // automation, and a stale tab must not slip a response past it.
  if (survey.closes_at && Date.parse(survey.closes_at) <= Date.now()) {
    return { error: "This survey has closed." };
  }
  const audiences = audiencesForViewer(session.role ?? null, session.persona ?? null);
  if (!audiences.includes(survey.audience as (typeof audiences)[number])) {
    return { error: "This survey is not addressed to you." };
  }

  // One response per user — enforceable only when responses are attributed.
  // For anonymous surveys there is deliberately nothing to check against
  // (see the insert comment below).
  if (!survey.anonymous) {
    const { data: existing } = await supabase
      .from("survey_responses")
      .select("id")
      .eq("survey_id", survey.id)
      .eq("respondent_id", session.userId)
      .limit(1);
    if ((existing ?? []).length > 0) return { error: "You already responded." };
  }

  const { data: qData } = await supabase
    .from("survey_questions")
    .select("id, question_kind, options, required")
    .eq("survey_id", survey.id)
    .order("ordinal");
  const questions = (qData ?? []) as QuestionRow[];
  if (questions.length === 0) return { error: "This survey has no questions yet." };

  const answers: Record<string, string | string[]> = {};
  const fieldErrors: Record<string, string> = {};
  for (const q of questions) {
    const key = `q_${q.id}`;
    const opts = (Array.isArray(q.options) ? q.options : []).map(String);
    if (q.question_kind === "multi_choice") {
      const vals = fd.getAll(key).filter((v): v is string => typeof v === "string" && opts.includes(v));
      if (vals.length > 0) answers[q.id] = vals;
      else if (q.required) fieldErrors[q.id] = "Pick at least one option.";
    } else if (q.question_kind === "text") {
      const val = fd.get(key);
      const text = typeof val === "string" ? val.trim().slice(0, 4000) : "";
      if (text) answers[q.id] = text;
      else if (q.required) fieldErrors[q.id] = "An answer is required.";
    } else if (q.question_kind === "boolean") {
      const val = fd.get(key);
      if (val === "yes" || val === "no") answers[q.id] = val === "yes" ? "Yes" : "No";
      else if (q.required) fieldErrors[q.id] = "Pick yes or no.";
    } else {
      // single_choice and scale both submit one option from the list.
      const val = fd.get(key);
      if (typeof val === "string" && opts.includes(val)) answers[q.id] = val;
      else if (q.required) fieldErrors[q.id] = "Pick an option.";
    }
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Answer the required questions.", fieldErrors };
  }

  // Anonymous surveys insert respondent_id = NULL (the RLS WITH CHECK on
  // survey_responses explicitly allows respondent_id IS NULL) and record
  // NOTHING else identifying — no user id, email, device marker, or
  // client-side fingerprint (no localStorage flag either). The honest
  // consequence: a double-response cannot be detected server-side for
  // anonymous surveys, so a determined user can submit twice. That is the
  // accepted price of real anonymity.
  const { error } = await supabase.from("survey_responses").insert({
    survey_id: survey.id,
    respondent_id: survey.anonymous ? null : session.userId,
    answers,
    submitted_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  redirect("/m/surveys?done=1");
}
