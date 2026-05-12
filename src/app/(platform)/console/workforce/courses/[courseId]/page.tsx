import { formatDate } from "@/lib/i18n/format";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { addLesson, addQuizQuestion, publishCourse, assignCourse, setCompletionBadge, deleteCourse } from "./actions";
import { DeleteForm } from "@/components/DeleteForm";

export const dynamic = "force-dynamic";

type Lesson = { id: string; ordinal: number; title: string; body: string | null; lesson_kind: string };
type Question = { id: string; ordinal: number; prompt: string; choices: unknown; correct_index: number };
type Assignment = { id: string; assignee_id: string; assignment_state: string; assigned_at: string };

export default async function Page({ params }: { params: Promise<{ courseId: string }> }) {
  if (!hasSupabase) return <div className="page-content">Configure Supabase.</div>;
  const { courseId } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, summary, publish_state, duration_minutes, completion_badge_id")
    .eq("id", courseId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!course) notFound();
  const c = course as {
    id: string;
    title: string;
    summary: string | null;
    publish_state: string;
    duration_minutes: number | null;
    completion_badge_id: string | null;
  };

  const { data: badges } = await supabase
    .from("badges")
    .select("id, code, name, icon")
    .eq("org_id", session.orgId)
    .order("name");
  const badgeList = (badges ?? []) as Array<{ id: string; code: string; name: string; icon: string | null }>;

  const [{ data: lessons }, { data: questions }, { data: assignments }, { data: members }] = await Promise.all([
    supabase
      .from("course_lessons")
      .select("id, ordinal, title, body, lesson_kind")
      .eq("course_id", courseId)
      .order("ordinal"),
    supabase
      .from("course_quiz_questions")
      .select("id, ordinal, prompt, choices, correct_index")
      .eq("course_id", courseId)
      .order("ordinal"),
    supabase
      .from("course_assignments")
      .select("id, assignee_id, assignment_state, assigned_at")
      .eq("course_id", courseId)
      .order("assigned_at", { ascending: false }),
    supabase
      .from("memberships")
      .select("user_id, users:users!inner(id, email, name)")
      .eq("org_id", session.orgId)
      .is("deleted_at", null),
  ]);

  const lessonList = (lessons ?? []) as Lesson[];
  const questionList = (questions ?? []) as Question[];
  const assignmentList = (assignments ?? []) as Assignment[];
  const memberList = (
    (members ?? []) as unknown as Array<{
      user_id: string;
      users: { id: string; email: string; name: string | null } | null;
    }>
  )
    .map((m) => m.users)
    .filter((u): u is { id: string; email: string; name: string | null } => !!u);
  const memberMap = new Map(memberList.map((m) => [m.id, m.name ?? m.email]));
  const assignedIds = new Set(assignmentList.map((a) => a.assignee_id));

  return (
    <>
      <ModuleHeader
        eyebrow="Course"
        title={c.title}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant={c.publish_state === "published" ? "success" : "info"}>{c.publish_state}</Badge>
            {c.duration_minutes && <span className="font-mono text-xs">{c.duration_minutes} min</span>}
            <span className="font-mono text-xs">
              {lessonList.length} lessons · {questionList.length} questions · {assignmentList.length} assignees
            </span>
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            {c.publish_state === "draft" && (
              <form action={publishCourse}>
                <input type="hidden" name="courseId" value={c.id} />
                <Button type="submit" size="sm">
                  Publish
                </Button>
              </form>
            )}
            <DeleteForm
              action={deleteCourse.bind(null, c.id)}
              confirm="Soft-delete this course? Existing assignments stay; new assignments will fail."
            />
          </div>
        }
      />
      <div className="page-content grid gap-4 lg:grid-cols-2">
        <section className="surface p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold">Completion Badge</h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Optional. When set, any assignee who passes the quiz auto-receives this badge.
          </p>
          <form action={setCompletionBadge} className="mt-3 flex items-end gap-2">
            <input type="hidden" name="courseId" value={c.id} />
            <select name="badge_id" defaultValue={c.completion_badge_id ?? ""} className="input-base flex-1">
              <option value="">— None —</option>
              {badgeList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.icon ? `${b.icon} ` : ""}
                  {b.name}
                </option>
              ))}
            </select>
            <Button type="submit" variant="secondary" size="sm">
              Save
            </Button>
          </form>
        </section>

        <section className="surface p-4">
          <h2 className="text-sm font-semibold">Lessons</h2>
          <ol className="mt-3 space-y-2">
            {lessonList.map((l) => (
              <li key={l.id} className="rounded-md border border-[var(--border-color)] p-3">
                <div className="flex items-center justify-between">
                  <Badge variant="muted">Lesson {l.ordinal}</Badge>
                  <span className="font-mono text-xs text-[var(--text-muted)]">{l.lesson_kind}</span>
                </div>
                <div className="mt-1 text-sm font-semibold">{l.title}</div>
              </li>
            ))}
          </ol>
          <form action={addLesson} className="mt-4 space-y-2 border-t border-[var(--border-color)] pt-4">
            <input type="hidden" name="courseId" value={c.id} />
            <input
              type="text"
              name="title"
              placeholder="Lesson title"
              required
              maxLength={200}
              className="input-base w-full"
            />
            <textarea name="body" rows={3} placeholder="Lesson body" maxLength={4000} className="input-base w-full" />
            <Button type="submit" variant="secondary" size="sm">
              + Add Lesson
            </Button>
          </form>
        </section>

        <section className="surface p-4">
          <h2 className="text-sm font-semibold">Quiz Questions</h2>
          <ol className="mt-3 space-y-2">
            {questionList.map((q) => {
              const choices = Array.isArray(q.choices) ? (q.choices as string[]) : [];
              return (
                <li key={q.id} className="rounded-md border border-[var(--border-color)] p-3">
                  <div className="text-sm font-semibold">
                    {q.ordinal}. {q.prompt}
                  </div>
                  <ul className="mt-1.5 space-y-0.5 text-xs">
                    {choices.map((ch, idx) => (
                      <li
                        key={idx}
                        className={idx === q.correct_index ? "font-semibold text-[var(--color-success)]" : ""}
                      >
                        {idx === q.correct_index ? "✓ " : "○ "}
                        {ch}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
          <form action={addQuizQuestion} className="mt-4 space-y-2 border-t border-[var(--border-color)] pt-4">
            <input type="hidden" name="courseId" value={c.id} />
            <input
              type="text"
              name="prompt"
              placeholder="Question prompt"
              required
              maxLength={400}
              className="input-base w-full"
            />
            <input
              type="text"
              name="choices"
              placeholder="Choices (one per line) — first 4"
              required
              className="input-base w-full"
            />
            <input
              type="number"
              name="correct_index"
              min="0"
              max="3"
              placeholder="Correct index (0-based)"
              required
              className="input-base w-full"
            />
            <Button type="submit" variant="secondary" size="sm">
              + Add Question
            </Button>
          </form>
        </section>

        <section className="surface p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold">Assignees</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {assignmentList.map((a) => {
              const tone =
                a.assignment_state === "completed" ? "success" : a.assignment_state === "overdue" ? "error" : "info";
              return (
                <li key={a.id} className="rounded-md border border-[var(--border-color)] p-3">
                  <div className="text-sm">{memberMap.get(a.assignee_id) ?? "Unknown"}</div>
                  <div className="font-mono text-[10px] text-[var(--text-muted)]">
                    {formatDate(a.assigned_at)}
                  </div>
                  <Badge variant={tone} className="mt-1">
                    {a.assignment_state}
                  </Badge>
                </li>
              );
            })}
          </ul>
          <form action={assignCourse} className="mt-4 space-y-2 border-t border-[var(--border-color)] pt-4">
            <input type="hidden" name="courseId" value={c.id} />
            <select name="assignee_id" required className="input-base w-full">
              {memberList
                .filter((m) => !assignedIds.has(m.id))
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name ?? m.email}
                  </option>
                ))}
            </select>
            <input type="date" name="due_at" className="input-base w-full" />
            <Button type="submit" variant="secondary" size="sm">
              + Assign
            </Button>
          </form>
        </section>
      </div>
    </>
  );
}
