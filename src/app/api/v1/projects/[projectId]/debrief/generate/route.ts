/**
 * POST /api/v1/projects/{projectId}/debrief/generate
 *
 * Competitive feature: AI Post-Event Debrief (vs Bizzabo / Momentus Analytics).
 * Aggregates incidents, expenses, crew snapshots, time entries, and deliverable
 * outcomes for the project, then uses claude-sonnet-4-6 to write an executive
 * debrief report saved to project_debriefs.
 */
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";
import type { LooseSupabase } from "@/lib/supabase/loose";

export const dynamic = "force-dynamic";

const Params = z.object({ projectId: z.string().uuid() });

export async function POST(req: Request, ctx: { params: Promise<{ projectId: string }> }) {
  const rl = await ratelimit({ key: keyFromRequest(req, "debrief:generate"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");

  const { projectId } = await ctx.params;
  if (!Params.safeParse({ projectId }).success) return apiError("bad_request", "Invalid project id");

  return withAuth(async (session) => {
    const denial = assertCapability(session, "projects:write");
    if (denial) return denial;

    const supabase = (await createClient()) as unknown as LooseSupabase;

    const { data: project } = await supabase
      .from("projects")
      .select("id, name, description, start_date, end_date")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!project) return apiError("not_found", "Project not found");

    const [
      { data: incidents },
      { data: snapshots },
      { data: expenses },
      { data: timeEntries },
      { data: deliverables },
      { data: tasks },
    ] = await Promise.all([
      supabase
        .from("incidents")
        .select("title, severity, description, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true })
        .limit(30),
      supabase
        .from("event_snapshots")
        .select("label, body, pinned_at")
        .eq("project_id", projectId)
        .order("pinned_at", { ascending: true })
        .limit(50),
      supabase
        .from("expenses")
        .select("description, amount_cents, category, created_at")
        .eq("project_id", projectId)
        .limit(50),
      supabase
        .from("time_entries")
        .select("description, hours, date")
        .eq("project_id", projectId)
        .limit(60),
      supabase
        .from("deliverables")
        .select("title, deliverable_state, deliverable_type")
        .eq("project_id", projectId)
        .limit(40),
      supabase
        .from("tasks")
        .select("title, is_complete, due_date")
        .eq("project_id", projectId)
        .limit(40),
    ]);

    const totalExpenseCents = ((expenses ?? []) as Array<{ amount_cents?: number }>).reduce(
      (sum, e) => sum + (e.amount_cents ?? 0),
      0,
    );
    const totalHours = ((timeEntries ?? []) as Array<{ hours?: number }>).reduce(
      (sum, t) => sum + (t.hours ?? 0),
      0,
    );
    const completedTasks = ((tasks ?? []) as Array<{ is_complete?: boolean }>).filter((t) => t.is_complete).length;

    const context = {
      project: { name: (project as { name?: string }).name, start_date: (project as { start_date?: string }).start_date, end_date: (project as { end_date?: string }).end_date },
      summary_stats: {
        incidents_count: (incidents ?? []).length,
        snapshots_count: (snapshots ?? []).length,
        total_expense_usd: (totalExpenseCents / 100).toFixed(2),
        total_hours: totalHours.toFixed(1),
        tasks_completed: `${completedTasks}/${(tasks ?? []).length}`,
        deliverables_approved: ((deliverables ?? []) as Array<{ deliverable_state?: string }>).filter(
          (d) => d.deliverable_state === "approved" || d.deliverable_state === "delivered",
        ).length,
      },
      incidents: (incidents ?? []).slice(0, 10),
      field_snapshots: (snapshots ?? []).slice(0, 15),
      top_expenses: ((expenses ?? []) as Array<{ amount_cents?: number; description?: string; category?: string }>)
        .sort((a, b) => (b.amount_cents ?? 0) - (a.amount_cents ?? 0))
        .slice(0, 10)
        .map((e) => ({ description: e.description, amount_usd: ((e.amount_cents ?? 0) / 100).toFixed(2), category: e.category })),
    };

    const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      system: `You are a senior post-event analyst at ATLVS Technologies. Write a concise, professional post-event debrief report in Markdown. Structure:

# Post-Event Debrief: {project name}

## Executive Summary
2-3 sentences on overall performance.

## Highlights
Bullet list of what went well (drawn from snapshots + completed tasks/deliverables).

## Incidents & Issues
Summarize any incidents with severity context.

## Financial Summary
Expense total and notable spend items.

## Crew & Time
Total hours logged and notable observations.

## Recommendations for Next Event
3-5 actionable bullets.

Be concise and data-driven. Write in third person. Do not invent data not present in the context.`,
      messages: [
        {
          role: "user",
          content: `Generate the post-event debrief for this project:\n\n${JSON.stringify(context, null, 2)}`,
        },
      ],
    });

    const body = message.content.find((b: { type: string; text?: string }) => b.type === "text")?.text ?? "";

    // Upsert the debrief row (one per project, per the unique constraint).
    const { data: debrief, error } = await supabase
      .from("project_debriefs")
      .upsert(
        {
          org_id: session.orgId,
          project_id: projectId,
          generated_by: session.userId,
          model: "claude-sonnet-4-6",
          body,
          highlights: JSON.stringify(context.summary_stats),
          generated_at: new Date().toISOString(),
        },
        { onConflict: "project_id" },
      )
      .select()
      .single();

    if (error) return apiError("internal", error.message);

    return apiOk({ debrief });
  });
}
