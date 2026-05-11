import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { addQuestion, publishSurvey, closeSurvey } from "./actions";

export const dynamic = "force-dynamic";

type Q = { id: string; ordinal: number; prompt: string; question_kind: string; options: unknown; required: boolean };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!hasSupabase) return <div className="page-content">Configure Supabase.</div>;
  const { id } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: survey } = await supabase
    .from("surveys")
    .select("id, title, description, anonymous, publish_state, audience")
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
  };

  const [{ data: questions }, { count: responseCount }] = await Promise.all([
    supabase
      .from("survey_questions")
      .select("id, ordinal, prompt, question_kind, options, required")
      .eq("survey_id", id)
      .order("ordinal"),
    supabase.from("survey_responses").select("id", { count: "exact", head: true }).eq("survey_id", id),
  ]);
  const qs = (questions ?? []) as Q[];

  return (
    <>
      <ModuleHeader
        eyebrow="Survey"
        title={s.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge
              variant={s.publish_state === "published" ? "success" : s.publish_state === "closed" ? "muted" : "info"}
            >
              {s.publish_state}
            </Badge>
            <Badge variant="muted">{s.audience}</Badge>
            {s.anonymous && <Badge variant="info">Anonymous</Badge>}
            <span className="font-mono text-xs">{responseCount ?? 0} responses</span>
          </span>
        }
        action={
          <div className="flex gap-2">
            {s.publish_state === "draft" && (
              <form action={publishSurvey}>
                <input type="hidden" name="id" value={s.id} />
                <Button type="submit" size="sm">Publish</Button>
              </form>
            )}
            {s.publish_state === "published" && (
              <form action={closeSurvey}>
                <input type="hidden" name="id" value={s.id} />
                <Button type="submit" size="sm" variant="secondary">Close</Button>
              </form>
            )}
          </div>
        }
      />
      <div className="page-content max-w-3xl space-y-4">
        {s.description && <div className="surface p-4 text-sm text-[var(--text-secondary)]">{s.description}</div>}
        <section className="surface p-4">
          <h2 className="text-sm font-semibold">Questions</h2>
          <ol className="mt-3 space-y-2">
            {qs.map((q) => (
              <li key={q.id} className="rounded-md border border-[var(--border-color)] p-3">
                <div className="flex items-center justify-between">
                  <Badge variant="muted">{q.question_kind}</Badge>
                  <span className="font-mono text-xs text-[var(--text-muted)]">#{q.ordinal}</span>
                </div>
                <div className="mt-1 text-sm font-semibold">{q.prompt}</div>
                {Array.isArray(q.options) && (q.options as string[]).length > 0 && (
                  <ul className="mt-1 text-xs text-[var(--text-secondary)]">
                    {(q.options as string[]).map((o, idx) => (
                      <li key={idx}>○ {o}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
          {s.publish_state === "draft" && (
            <form action={addQuestion} className="mt-4 space-y-2 border-t border-[var(--border-color)] pt-4">
              <input type="hidden" name="surveyId" value={s.id} />
              <input
                type="text"
                name="prompt"
                placeholder="Question prompt"
                required
                maxLength={400}
                className="input-base w-full"
              />
              <select name="question_kind" className="input-base w-full" defaultValue="single_choice">
                <option value="single_choice">Single choice</option>
                <option value="multi_choice">Multiple choice</option>
                <option value="scale">Scale</option>
                <option value="text">Text</option>
                <option value="boolean">Yes/No</option>
              </select>
              <textarea
                name="options"
                rows={3}
                placeholder="Options (one per line) — only for choice/scale"
                className="input-base w-full"
              />
              <Button type="submit" size="sm" variant="secondary">+ Add Question</Button>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
