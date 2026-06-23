import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import {
  summarizeEnrollments,
  passRate,
  type AttemptState,
  type EnrollmentState,
} from "@/lib/legend_learning";
import {
  ACCREDITATION_STATE_LABELS,
  ACCREDITATION_STATE_TONES,
  type AccreditationState,
} from "@/lib/legend_compliance";

export const dynamic = "force-dynamic";

type EnrollmentRow = {
  id: string;
  course_id: string;
  enrollment_state: EnrollmentState;
  progress_pct: number;
  completed_at: string | null;
};

type AttemptRow = {
  score_pct: number | null;
  passed: boolean;
  attempt_state: AttemptState;
  submitted_at: string | null;
};

type HolderRow = {
  id: string;
  certification_id: string;
  accreditation_state: AccreditationState;
  issued_at: string;
  expires_on: string | null;
};

/** Map a credential StateTone onto the Badge variant vocabulary. */
function badgeVariant(state: AccreditationState): "default" | "success" | "warning" | "error" | "info" | "brand" {
  const tone = ACCREDITATION_STATE_TONES[state];
  switch (tone) {
    case "success":
      return "success";
    case "warning":
      return "warning";
    case "error":
      return "error";
    case "info":
      return "info";
    default:
      return "default";
  }
}

/**
 * /legend/progress — the learner's personal analytics + transcript. Headline
 * stats (completions, average score, pass rate, certs held), a per-course
 * mastery list, and the credential transcript.
 */
export default async function ProgressPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="LEG3ND · Learn" title="Progress" />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const [{ data: enrollData }, { data: attemptData }, { data: holderData }] = await Promise.all([
    db
      .from("course_enrollments")
      .select("id, course_id, enrollment_state, progress_pct, completed_at")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId),
    db
      .from("assessment_attempts")
      .select("score_pct, passed, attempt_state, submitted_at")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId),
    db
      .from("certification_holders")
      .select("id, certification_id, accreditation_state, issued_at, expires_on")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId),
  ]);

  const enrollments = (enrollData ?? []) as EnrollmentRow[];
  const attempts = (attemptData ?? []) as AttemptRow[];
  const holders = (holderData ?? []) as HolderRow[];

  // Course titles for the mastery list.
  const courseIds = [...new Set(enrollments.map((e) => e.course_id))];
  const courseTitles = new Map<string, string>();
  if (courseIds.length > 0) {
    const { data: courseData } = await db.from("legend_courses").select("id, title").in("id", courseIds);
    for (const c of (courseData ?? []) as Array<{ id: string; title: string }>) {
      courseTitles.set(c.id, c.title);
    }
  }

  // Certification names for the transcript.
  const certIds = [...new Set(holders.map((h) => h.certification_id))];
  const certNames = new Map<string, string>();
  if (certIds.length > 0) {
    const { data: certData } = await db.from("legend_certifications").select("id, name").in("id", certIds);
    for (const c of (certData ?? []) as Array<{ id: string; name: string }>) {
      certNames.set(c.id, c.name);
    }
  }

  const stats = summarizeEnrollments(enrollments);
  const scored = attempts.filter((a) => a.score_pct != null);
  const avgScore =
    scored.length === 0 ? 0 : Math.round(scored.reduce((s, a) => s + (a.score_pct ?? 0), 0) / scored.length);
  const pr = passRate(attempts);
  const certsHeld = holders.filter((h) => h.accreditation_state === "valid").length;

  return (
    <>
      <ModuleHeader
        eyebrow="LEG3ND · Learn"
        title="Progress"
        subtitle="Your learning analytics, assessment performance, and full transcript."
      />

      <div className="metric-grid mb-6">
        <MetricCard label="Courses Completed" value={String(stats.completed)} />
        <MetricCard label="Avg Assessment" value={`${avgScore}%`} />
        <MetricCard label="Pass Rate" value={`${pr}%`} />
        <MetricCard label="Certs Held" value={String(certsHeld)} />
      </div>

      <section className="mb-8 space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--p-text-2)]">Mastery</h2>
        {enrollments.length === 0 ? (
          <EmptyState
            size="compact"
            title="No courses yet"
            description="Enroll in a course to start building mastery."
          />
        ) : (
          <div className="surface flex flex-col gap-3 p-4">
            {enrollments.map((e) => (
              <div key={e.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-[var(--p-text-1)]">
                    {courseTitles.get(e.course_id) ?? "Course"}
                  </span>
                  <span className="font-mono text-xs text-[var(--p-text-2)]">{e.progress_pct}%</span>
                </div>
                <ProgressBar value={e.progress_pct} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--p-text-2)]">Transcript</h2>
        {holders.length === 0 ? (
          <EmptyState
            size="compact"
            title="No credentials yet"
            description="Pass a course assessment that grants a certification to start your transcript."
          />
        ) : (
          <div className="surface flex flex-col divide-y divide-[var(--p-border)]">
            {holders.map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-3 p-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[var(--p-text-1)]">
                    {certNames.get(h.certification_id) ?? "Certification"}
                  </span>
                  <span className="font-mono text-xs text-[var(--p-text-3)]">{h.issued_at.slice(0, 10)}</span>
                </div>
                <Badge variant={badgeVariant(h.accreditation_state)}>
                  {ACCREDITATION_STATE_LABELS[h.accreditation_state]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
