import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { submitSurvey } from "../actions";

export const dynamic = "force-dynamic";

type Question = {
  id: string;
  ordinal: number;
  prompt: string;
  question_kind: string;
  options: unknown;
  required: boolean;
};

export default async function SurveyPage({ params }: { params: Promise<{ surveyId: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("common.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const { surveyId } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: survey } = await supabase
    .from("surveys")
    .select("id, title, description, anonymous, publish_state")
    .eq("id", surveyId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!survey || (survey as { publish_state: string }).publish_state !== "published") notFound();

  const { data: questions } = await supabase
    .from("survey_questions")
    .select("id, ordinal, prompt, question_kind, options, required")
    .eq("survey_id", surveyId)
    .order("ordinal");

  const list = (questions ?? []) as Question[];

  return (
    <div className="px-4 pt-6 pb-24">
      <h1 className="text-xl font-semibold">{(survey as { title: string }).title}</h1>
      {(survey as { description: string | null }).description && (
        <p className="mt-1 text-xs text-[var(--p-text-2)]">{(survey as { description: string }).description}</p>
      )}

      <form action={submitSurvey} className="mt-5 space-y-4">
        <input type="hidden" name="surveyId" value={surveyId} />
        {list.map((q) => {
          const opts = Array.isArray(q.options) ? (q.options as string[]) : [];
          return (
            <fieldset key={q.id} className="surface p-4">
              <legend className="text-sm font-semibold">
                {q.ordinal}. {q.prompt}
              </legend>
              {q.question_kind === "single_choice" || q.question_kind === "scale" ? (
                <div className="mt-2 space-y-1.5">
                  {opts.map((o, idx) => (
                    <label key={idx} className="flex items-center gap-2 text-xs">
                      <input type="radio" name={`q_${q.id}`} value={o} required={q.required} />
                      {o}
                    </label>
                  ))}
                </div>
              ) : q.question_kind === "multi_choice" ? (
                <div className="mt-2 space-y-1.5">
                  {opts.map((o, idx) => (
                    <label key={idx} className="flex items-center gap-2 text-xs">
                      <input type="checkbox" name={`q_${q.id}`} value={o} />
                      {o}
                    </label>
                  ))}
                </div>
              ) : q.question_kind === "boolean" ? (
                <div className="mt-2 flex gap-3 text-xs">
                  <label className="flex items-center gap-1">
                    <input type="radio" name={`q_${q.id}`} value="yes" required={q.required} />{" "}
                    {t("common.yes", undefined, "Yes")}
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" name={`q_${q.id}`} value="no" required={q.required} />{" "}
                    {t("common.no", undefined, "No")}
                  </label>
                </div>
              ) : (
                <textarea
                  name={`q_${q.id}`}
                  rows={3}
                  required={q.required}
                  className="mt-2 w-full rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] px-3 py-2 text-xs"
                />
              )}
            </fieldset>
          );
        })}
        <button type="submit" className="ps-btn w-full">
          {t("common.submit", undefined, "Submit")}
        </button>
      </form>
    </div>
  );
}
