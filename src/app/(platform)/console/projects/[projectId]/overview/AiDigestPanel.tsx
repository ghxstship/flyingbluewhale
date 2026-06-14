import "server-only";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { runAI } from "@/lib/ai/run";
import { env } from "@/lib/env";
import { Badge } from "@/components/ui/Badge";

const digestSchema = z.object({
  health_score: z.number(),
  health_label: z.enum(["on_track", "at_risk", "critical"]),
  summary: z.string(),
  risks: z.array(z.string()),
  actions: z.array(z.string()),
});

/**
 * AI-generated project ops digest panel — renders on the project overview.
 * Pulls live operational signals (tasks, deliverables, assignments, budget)
 * and uses Claude to produce a health score + terse risk/action brief.
 * Wrap in <Suspense> — this component makes a live AI call.
 * Competitive parity: LASSO Intelligence Alert Mode + Asana AI Smart Status + Monday.com Smart Status.
 */
export async function AiDigestPanel({ projectId }: { projectId: string }) {
  if (!env.ANTHROPIC_API_KEY) return null;

  const session = await requireSession();
  const supabase = await createClient();

  const [
    { data: project },
    { count: openTasks },
    { count: overdueTasks },
    { count: openDeliverables },
    { count: openAssignments },
    { data: budgets },
    { count: highIncidents },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("name, start_date, end_date, xpms_phase")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .in("task_state", ["open", "in_progress"]),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("task_state", "open")
      .lt("due_at", new Date().toISOString()),
    supabase
      .from("deliverables")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .in("fulfillment_state", ["briefed", "draft", "submitted", "in_review"])
      .is("deleted_at", null),
    supabase
      .from("assignments")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .in("fulfillment_state", ["briefed", "draft"])
      .is("deleted_at", null),
    supabase.from("budgets").select("amount_cents, actual_cents, spent_cents").eq("project_id", projectId),
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .eq("severity", "high"),
  ]);

  if (!project) return null;

  const totalBudget = (budgets ?? []).reduce((s, b) => s + (b.amount_cents ?? 0), 0);
  const spentBudget = (budgets ?? []).reduce(
    (s, b) => s + Number((b as { actual_cents?: number | null }).actual_cents ?? b.spent_cents ?? 0),
    0,
  );
  const budgetUtilPct = totalBudget > 0 ? Math.round((spentBudget / totalBudget) * 100) : null;

  const eventDate = project.end_date ? new Date(project.end_date) : null;
  const daysToEnd = eventDate ? Math.ceil((eventDate.getTime() - Date.now()) / 86400000) : null;

  const context = [
    `Project: ${project.name}`,
    `Phase: ${project.xpms_phase ?? "not set"}`,
    daysToEnd !== null ? `Days until end date: ${daysToEnd}${daysToEnd < 0 ? " (PAST)" : ""}` : null,
    `Open/in-progress tasks: ${openTasks ?? 0}`,
    `Overdue tasks: ${overdueTasks ?? 0}`,
    `Deliverables still in-flight: ${openDeliverables ?? 0}`,
    `Assignments not yet fulfilled (briefed/draft): ${openAssignments ?? 0}`,
    budgetUtilPct !== null ? `Budget consumed: ${budgetUtilPct}%` : null,
    (highIncidents ?? 0) > 0 ? `High-severity open incidents: ${highIncidents ?? 0}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  let digest: z.infer<typeof digestSchema> | null = null;
  try {
    const result = await runAI({
      prompt: `You are an event production operations AI. Analyze this project's health and return a structured digest.

PROJECT SIGNALS:
${context}

Score the project health 0–100 (100 = fully green). Label it on_track / at_risk / critical. Write a 1-2 sentence summary. List up to 3 key risks (terse, operator-readable). List up to 3 recommended actions (concrete, specific).`,
      outputSchema: digestSchema,
      model: "claude-sonnet-4-6",
      maxTokens: 500,
      temperature: 0.25,
      system:
        "You are an ops AI for live-event production companies. Return only valid JSON matching the schema. Be direct and specific.",
    });
    digest = result.output;
  } catch {
    return null;
  }

  const labelMap = {
    on_track: { variant: "success" as const, text: "On Track" },
    at_risk: { variant: "warning" as const, text: "At Risk" },
    critical: { variant: "error" as const, text: "Critical" },
  };
  const label = labelMap[digest.health_label];

  return (
    <div className="surface p-5">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="flex-1 text-[10px] tracking-[0.2em] text-[var(--p-text-2)] uppercase">AI Ops Digest</h3>
        <Badge variant={label.variant}>{label.text}</Badge>
        <Badge variant="info">Claude AI</Badge>
      </div>
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold">{digest.health_score}</span>
        <span className="text-xs text-[var(--p-text-2)]">/ 100</span>
      </div>
      <p className="mb-4 text-sm text-[var(--p-text-1)]">{digest.summary}</p>
      {digest.risks.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 text-[10px] font-medium tracking-[0.15em] text-[var(--p-text-2)] uppercase">
            Key Risks
          </p>
          <ul className="space-y-1">
            {digest.risks.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <span className="mt-0.5 shrink-0 text-[var(--c-warning)]">▲</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {digest.actions.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-medium tracking-[0.15em] text-[var(--p-text-2)] uppercase">
            Recommended Actions
          </p>
          <ul className="space-y-1">
            {digest.actions.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <span className="mt-0.5 shrink-0 text-[var(--p-accent)]">→</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function AiDigestSkeleton() {
  return (
    <div className="surface p-5" aria-busy="true">
      <div className="mb-3 flex items-center gap-2">
        <div className="ps-skel h-3 w-28" />
        <div className="ps-skel h-5 w-16 rounded-full" />
      </div>
      <div className="mb-2 ps-skel h-7 w-16" />
      <div className="mb-4 space-y-2">
        <div className="ps-skel h-4 w-full" />
        <div className="ps-skel h-4 w-4/5" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="ps-skel h-3 w-full" />
        ))}
      </div>
    </div>
  );
}
