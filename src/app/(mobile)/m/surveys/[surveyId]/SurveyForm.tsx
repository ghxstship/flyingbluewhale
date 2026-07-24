"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/LocaleProvider";
import { submitSurveyResponse } from "./actions";

/**
 * SurveyForm — client leaf of the survey taker. Renders one control per
 * question kind (radio, checkbox row, scale row, textarea, yes/no) and
 * submits everything through `submitSurveyResponse` via useActionState.
 * Field names are `q_<question_id>`; the action re-derives the answer set
 * from the live question list, so the names are transport, not truth.
 */

export type SurveyQuestion = {
  id: string;
  prompt: string;
  kind: string;
  options: string[];
  required: boolean;
};

const choiceRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "7px 0",
  fontSize: 14,
  cursor: "pointer",
};

export function SurveyForm({ surveyId, questions }: { surveyId: string; questions: SurveyQuestion[] }) {
  const t = useT();
  const [state, formAction, pending] = useActionState(submitSurveyResponse, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="survey_id" value={surveyId} />

      {state?.error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
          {state.error}
        </div>
      )}

      {questions.map((q, idx) => {
        const name = `q_${q.id}`;
        const fieldError = state?.fieldErrors?.[q.id];
        return (
          <div className="fld" key={q.id}>
            <label>
              {idx + 1}. {q.prompt}
              {!q.required && <> ({t("m.surveys.optional", undefined, "optional")})</>}
            </label>

            {q.kind === "single_choice" && (
              <div role="radiogroup" aria-label={q.prompt}>
                {q.options.map((opt) => (
                  <label key={opt} style={choiceRow}>
                    <input type="radio" name={name} value={opt} required={q.required} /> {opt}
                  </label>
                ))}
              </div>
            )}

            {q.kind === "multi_choice" && (
              <div>
                {q.options.map((opt) => (
                  <label key={opt} style={choiceRow}>
                    <input type="checkbox" name={name} value={opt} /> {opt}
                  </label>
                ))}
              </div>
            )}

            {q.kind === "scale" && (
              <div
                role="radiogroup"
                aria-label={q.prompt}
                style={{ display: "flex", gap: 4, justifyContent: "space-between", paddingTop: 6 }}
              >
                {q.options.map((opt) => (
                  <label
                    key={opt}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      flex: 1,
                      minWidth: 0,
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    <input type="radio" name={name} value={opt} required={q.required} />
                    <span style={{ overflowWrap: "anywhere" }}>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.kind === "text" && <textarea name={name} rows={4} maxLength={4000} required={q.required} />}

            {q.kind === "boolean" && (
              <div role="radiogroup" aria-label={q.prompt}>
                <label style={choiceRow}>
                  <input type="radio" name={name} value="yes" required={q.required} />{" "}
                  {t("m.surveys.yes", undefined, "Yes")}
                </label>
                <label style={choiceRow}>
                  <input type="radio" name={name} value="no" required={q.required} />{" "}
                  {t("m.surveys.no", undefined, "No")}
                </label>
              </div>
            )}

            {fieldError && <div className="hint">{fieldError}</div>}
          </div>
        );
      })}

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <Link
          href="/m/surveys"
          className="ps-btn ps-btn--tertiary ps-btn--lg"
          style={{ flex: 1, justifyContent: "center" }}
        >
          {t("common.cancel", undefined, "Cancel")}
        </Link>
        <button
          type="submit"
          className="ps-btn ps-btn--cta ps-btn--lg"
          style={{ flex: 2, justifyContent: "center" }}
          disabled={pending}
        >
          {pending ? t("m.surveys.submitting", undefined, "Submitting…") : t("m.surveys.submit", undefined, "Submit")}
        </button>
      </div>
    </form>
  );
}
