import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { audiencesForViewer } from "@/lib/db/announcements";
import { SurveyForm, type SurveyQuestion } from "./SurveyForm";

export const dynamic = "force-dynamic";

/**
 * /m/surveys/[surveyId] — the survey taker. Renders the question set
 * (ordinal order) as one submit-once form; every gate the submit action
 * enforces (published, deadline, audience, one response per user) is
 * mirrored here so the caller never types into a form that will bounce.
 */

type SurveyRow = {
  id: string;
  title: string;
  description: string | null;
  anonymous: boolean;
  publish_state: string;
  closes_at: string | null;
  audience: string;
};

type QuestionRow = {
  id: string;
  ordinal: number;
  prompt: string;
  question_kind: string;
  options: unknown;
  required: boolean;
};

function ClosedNotice({ title, message, back }: { title: string; message: string; back: string }) {
  return (
    <div className="screen screen-anim">
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {title}
      </h1>
      <p className="form-intro">{message}</p>
      <Link href="/m/surveys" className="ps-btn ps-btn--tertiary ps-btn--lg" style={{ justifyContent: "center" }}>
        {back}
      </Link>
    </div>
  );
}

export default async function SurveyTakerPage({ params }: { params: Promise<{ surveyId: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="screen screen-anim">
        <p className="form-intro">{t("common.configureSupabase", undefined, "Configure Supabase.")}</p>
      </div>
    );
  }

  const { surveyId } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: surveyData } = await supabase
    .from("surveys")
    .select("id, title, description, anonymous, publish_state, closes_at, audience")
    .eq("id", surveyId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  const survey = surveyData as SurveyRow | null;
  if (!survey || survey.publish_state === "draft") notFound();

  const audiences = audiencesForViewer(session.role ?? null, session.persona ?? null);
  if (!(audiences as string[]).includes(survey.audience)) notFound();

  const open = survey.publish_state === "published" && (!survey.closes_at || Date.parse(survey.closes_at) > Date.now());
  if (!open) {
    return (
      <ClosedNotice
        title={survey.title}
        message={t("m.surveys.closedNotice", undefined, "This survey has closed and is no longer taking responses.")}
        back={t("m.surveys.back", undefined, "Back to Surveys")}
      />
    );
  }

  // Attributed surveys are one-shot; anonymous ones cannot be checked (no
  // respondent id is stored) so the form always renders for them.
  if (!survey.anonymous) {
    const { data: existing } = await supabase
      .from("survey_responses")
      .select("id")
      .eq("survey_id", survey.id)
      .eq("respondent_id", session.userId)
      .limit(1);
    if ((existing ?? []).length > 0) {
      return (
        <ClosedNotice
          title={survey.title}
          message={t("m.surveys.alreadyResponded", undefined, "You already responded to this survey. Thank you.")}
          back={t("m.surveys.back", undefined, "Back to Surveys")}
        />
      );
    }
  }

  const { data: qData } = await supabase
    .from("survey_questions")
    .select("id, ordinal, prompt, question_kind, options, required")
    .eq("survey_id", survey.id)
    .order("ordinal");
  const questions: SurveyQuestion[] = ((qData ?? []) as QuestionRow[]).map((q) => ({
    id: q.id,
    prompt: q.prompt,
    kind: q.question_kind,
    options: (Array.isArray(q.options) ? q.options : []).map(String),
    required: q.required,
  }));

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">
        {survey.anonymous
          ? t("m.surveys.taker.eyebrowAnonymous", undefined, "Survey · Anonymous")
          : t("m.surveys.taker.eyebrow", undefined, "Survey")}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {survey.title}
      </h1>
      {survey.description && <p className="form-intro">{survey.description}</p>}
      {survey.anonymous && (
        <p className="form-intro">
          {t(
            "m.surveys.anonymousNote",
            undefined,
            "Responses to this survey are anonymous. Your name is not recorded with your answers.",
          )}
        </p>
      )}
      {questions.length === 0 ? (
        <p className="form-intro">{t("m.surveys.noQuestions", undefined, "This survey has no questions yet.")}</p>
      ) : (
        <SurveyForm surveyId={survey.id} questions={questions} />
      )}
    </div>
  );
}
