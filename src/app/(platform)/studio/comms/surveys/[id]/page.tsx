import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { addQuestion, publishSurvey, closeSurvey } from "./actions";

export const dynamic = "force-dynamic";

type Q = { id: string; ordinal: number; prompt: string; question_kind: string; options: unknown; required: boolean };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">{t("console.common.configureSupabase", undefined, "Configure Supabase.")}</div>
    );
  const { id } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: survey } = await supabase
    .from("surveys")
    .select("id, title, description, anonymous, publish_state, audience, closes_at")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!survey) notFound();
  const s = survey as {
    id: string;
    title: string;
    description: string | null;
    anonymous: boolean;
    publish_state: string;
    audience: string;
    closes_at: string | null;
  };
  // Mirror the taker: a passed deadline closes the survey for respondents
  // even before the state flips, so the console badge must agree.
  const effectiveState =
    s.publish_state === "published" && s.closes_at && Date.parse(s.closes_at) <= Date.now()
      ? "closed"
      : s.publish_state;

  const [{ data: questions }, { count: responseCount }, { data: responses }] = await Promise.all([
    supabase
      .from("survey_questions")
      .select("id, ordinal, prompt, question_kind, options, required")
      .eq("survey_id", id)
      .order("ordinal"),
    supabase.from("survey_responses").select("id", { count: "exact", head: true }).eq("survey_id", id),
    supabase
      .from("survey_responses")
      .select("id, answers, submitted_at")
      .eq("survey_id", id)
      .order("submitted_at", { ascending: false })
      .limit(200),
  ]);
  const qs = (questions ?? []) as Q[];

  // Tally per-question answer distribution. Single-choice/scale/boolean
  // get straight count-by-value; multi-choice splits the array into
  // independent ticks; free-text is left as a sample of the latest 5
  // responses for context (no aggregation makes sense).
  const respList = (responses ?? []) as Array<{ id: string; answers: Record<string, unknown>; submitted_at: string }>;
  const tallies: Record<string, Map<string, number>> = {};
  const textSamples: Record<string, string[]> = {};
  for (const q of qs) {
    tallies[q.id] = new Map<string, number>();
    textSamples[q.id] = [];
  }
  for (const r of respList) {
    for (const q of qs) {
      const ans = r.answers?.[q.id];
      if (ans == null) continue;
      // Both maps are seeded for every question in the loop above.
      const tally = tallies[q.id]!;
      const samples = textSamples[q.id]!;
      if (q.question_kind === "text") {
        if (samples.length < 5 && typeof ans === "string") samples.push(ans);
      } else if (Array.isArray(ans)) {
        for (const v of ans) {
          const k = String(v);
          tally.set(k, (tally.get(k) ?? 0) + 1);
        }
      } else {
        const k = String(ans);
        tally.set(k, (tally.get(k) ?? 0) + 1);
      }
    }
  }

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.comms.surveys.detail.eyebrow", undefined, "Survey")}
        title={s.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge
              variant={effectiveState === "published" ? "success" : effectiveState === "closed" ? "muted" : "info"}
            >
              {effectiveState}
            </Badge>
            <Badge variant="muted">{toTitle(s.audience)}</Badge>
            {s.anonymous && (
              <Badge variant="info">{t("console.comms.surveys.detail.anonymous", undefined, "Anonymous")}</Badge>
            )}
            <span className="font-mono text-xs">
              {t(
                "console.comms.surveys.detail.responsesCount",
                { count: responseCount ?? 0 },
                `${responseCount ?? 0} responses`,
              )}
            </span>
          </span>
        }
        action={
          <div className="flex gap-2">
            {s.publish_state === "draft" && (
              <form action={publishSurvey}>
                <input type="hidden" name="id" value={s.id} />
                <button type="submit" className="ps-btn ps-btn--sm">
                  {t("console.comms.surveys.detail.publish", undefined, "Publish")}
                </button>
              </form>
            )}
            {s.publish_state === "published" && (
              <form action={closeSurvey}>
                <input type="hidden" name="id" value={s.id} />
                <button type="submit" className="ps-btn ps-btn--ghost ps-btn--sm">
                  {t("console.comms.surveys.detail.close", undefined, "Close")}
                </button>
              </form>
            )}
          </div>
        }
      />
      <div className="page-content max-w-3xl space-y-4">
        {s.description && <div className="surface p-4 text-sm text-[var(--p-text-2)]">{s.description}</div>}
        <section className="surface p-4">
          <h2 className="text-sm font-semibold">
            {t("console.comms.surveys.detail.questions", undefined, "Questions")}
          </h2>
          <ol className="mt-3 space-y-2">
            {qs.map((q) => {
              const tally = tallies[q.id] ?? new Map<string, number>();
              const totalAns = Array.from(tally.values()).reduce((a, b) => a + b, 0);
              const opts = Array.isArray(q.options) ? (q.options as string[]) : [];
              const isText = q.question_kind === "text";
              return (
                <li key={q.id} className="rounded-md border border-[var(--p-border)] p-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="muted">{q.question_kind}</Badge>
                    <span className="font-mono text-xs text-[var(--p-text-2)]">#{q.ordinal}</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold">{q.prompt}</div>
                  {isText ? (
                    <ul className="mt-2 space-y-1 text-xs text-[var(--p-text-2)]">
                      {(textSamples[q.id] ?? []).map((s, i) => (
                        <li key={i} className="italic">
                          &ldquo;{s}&rdquo;
                        </li>
                      ))}
                      {(textSamples[q.id] ?? []).length === 0 && (
                        <li>
                          {t("console.comms.surveys.detail.noTextResponses", undefined, "No text responses yet.")}
                        </li>
                      )}
                    </ul>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {(opts.length > 0 ? opts : Array.from(tally.keys()).sort()).map((o, idx) => {
                        const count = tally.get(o) ?? 0;
                        const pct = totalAns > 0 ? Math.round((count / totalAns) * 100) : 0;
                        return (
                          <li key={idx} className="text-xs">
                            <div className="flex items-center justify-between">
                              <span>{o}</span>
                              <span className="font-mono">
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--p-surface-2)]">
                              <div className="h-full rounded-full bg-[var(--p-accent)]" style={{ width: `${pct}%` }} />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
          {s.publish_state === "draft" && (
            <form action={addQuestion} className="mt-4 space-y-2 border-t border-[var(--p-border)] pt-4">
              <input type="hidden" name="surveyId" value={s.id} />
              <input
                type="text"
                name="prompt"
                placeholder={t("console.comms.surveys.detail.promptPlaceholder", undefined, "Question prompt")}
                required
                maxLength={400}
                className="ps-input w-full"
              />
              <select name="question_kind" className="ps-input w-full" defaultValue="single_choice">
                <option value="single_choice">
                  {t("console.comms.surveys.detail.kind.singleChoice", undefined, "Single choice")}
                </option>
                <option value="multi_choice">
                  {t("console.comms.surveys.detail.kind.multiChoice", undefined, "Multiple choice")}
                </option>
                <option value="scale">{t("console.comms.surveys.detail.kind.scale", undefined, "Scale")}</option>
                <option value="text">{t("console.comms.surveys.detail.kind.text", undefined, "Text")}</option>
                <option value="boolean">{t("console.comms.surveys.detail.kind.boolean", undefined, "Yes/No")}</option>
              </select>
              <textarea
                name="options"
                rows={3}
                placeholder={t(
                  "console.comms.surveys.detail.optionsPlaceholder",
                  undefined,
                  "Options · One per Line · Only for Choice/Scale",
                )}
                className="ps-input w-full"
              />
              <button type="submit" className="ps-btn ps-btn--ghost ps-btn--sm">
                {t("console.comms.surveys.detail.addQuestion", undefined, "+ Add Question")}
              </button>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
