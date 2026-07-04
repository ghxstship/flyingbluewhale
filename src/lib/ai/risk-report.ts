import "server-only";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { record as recordUsage } from "@/lib/usage";
import { runAI } from "./run";

/**
 * AI project risk reports (competitive-scan 2026-07 delta — Asana Fall-2025
 * "AI Risk Reports" / monday.com predictive-risk parity).
 *
 * Gathers cheap, org-scoped live signals for one project (schedule pressure,
 * overdue work, budget variance, open incidents, stalled advancing
 * assignments), asks the model for a structured assessment, and persists the
 * result as an immutable `ai_risk_reports` row. The newest row per project is
 * the live report; regenerating INSERTs a new row (never mutates), so the
 * table doubles as an assessment history.
 *
 * The model NEVER invents numbers: every signal it sees is computed here and
 * snapshotted into prompt_context, so a rendered report is auditable against
 * the exact inputs that produced it.
 */

export const RISK_OVERALL = ["low", "moderate", "high", "critical"] as const;
export type RiskOverall = (typeof RISK_OVERALL)[number];

export const RISK_SEVERITIES = ["low", "medium", "high"] as const;

export const RiskReportSchema = z.object({
  overall: z.enum(RISK_OVERALL),
  /** One-sentence operator-grade headline for the report card. */
  headline: z.string().min(1).max(300),
  risks: z
    .array(
      z.object({
        title: z.string().min(1).max(120),
        severity: z.enum(RISK_SEVERITIES),
        /** Which part of the operation the risk lives in (schedule, budget, safety, fulfillment, staffing…). */
        area: z.string().min(1).max(60),
        /** The signal(s) driving this risk — must reference the provided numbers. */
        evidence: z.string().min(1).max(400),
        /** Concrete next action an operator can take. */
        mitigation: z.string().min(1).max(400),
      }),
    )
    .max(8),
  /** Lower-grade items worth watching, one line each. */
  watchlist: z.array(z.string().min(1).max(200)).max(6),
});

export type RiskReport = z.infer<typeof RiskReportSchema>;

export type RiskSignals = {
  project: {
    name: string;
    project_state: string | null;
    start_date: string | null;
    end_date: string | null;
    days_to_start: number | null;
    days_to_end: number | null;
  };
  tasks: { open: number; overdue: number; blocked: number; due_next_7_days: number };
  budget: { planned_cents: number; actual_cents: number; variance_pct: number | null };
  incidents: { open: number };
  assignments: { open: number; stalled_over_7_days: number };
  deliverables: { open: number };
};

const OPEN_TASK_STATES = ["todo", "in_progress", "blocked", "review"] as const;
/** Fulfillment states that mean "work is still owed" (doc + physical arcs). */
const OPEN_FULFILLMENT_STATES = [
  "briefed",
  "draft",
  "submitted",
  "in_review",
  "revision_requested",
  "issued",
] as const;

function daysFromToday(date: string | null, today: Date): number | null {
  if (!date) return null;
  const d = new Date(`${date}T00:00:00Z`);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

/**
 * Compute the live signal snapshot for one project. Count-only queries —
 * cheap enough to run on demand from the overview page action.
 */
export async function gatherRiskSignals(orgId: string, projectId: string): Promise<RiskSignals | null> {
  const supabase = await createClient();
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const in7Iso = new Date(today.getTime() + 7 * 86_400_000).toISOString().slice(0, 10);
  const sevenDaysAgoIso = new Date(today.getTime() - 7 * 86_400_000).toISOString();

  const [
    { data: project },
    { count: openTasks },
    { count: overdueTasks },
    { count: blockedTasks },
    { count: dueSoonTasks },
    { data: budgets },
    { count: openIncidents },
    { count: openAssignments },
    { count: stalledAssignments },
    { count: openDeliverables },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, project_state, start_date, end_date")
      .eq("org_id", orgId)
      .eq("id", projectId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("project_id", projectId)
      .in("task_state", [...OPEN_TASK_STATES]),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("project_id", projectId)
      .in("task_state", [...OPEN_TASK_STATES])
      .lt("due_at", todayIso),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("project_id", projectId)
      .eq("task_state", "blocked"),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("project_id", projectId)
      .in("task_state", [...OPEN_TASK_STATES])
      .gte("due_at", todayIso)
      .lte("due_at", in7Iso),
    supabase
      .from("budgets")
      .select("amount_cents, actual_cents, spent_cents")
      .eq("org_id", orgId)
      .eq("project_id", projectId),
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("project_id", projectId)
      .in("incident_state", ["open", "investigating"]),
    supabase
      .from("assignments")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .in("fulfillment_state", [...OPEN_FULFILLMENT_STATES]),
    supabase
      .from("assignments")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .in("fulfillment_state", [...OPEN_FULFILLMENT_STATES])
      .lt("updated_at", sevenDaysAgoIso),
    supabase
      .from("deliverables")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .in("fulfillment_state", [...OPEN_FULFILLMENT_STATES]),
  ]);

  if (!project) return null;

  const planned = (budgets ?? []).reduce((s, b) => s + (b.amount_cents ?? 0), 0);
  const actual = (budgets ?? []).reduce(
    (s, b) => s + Number((b as { actual_cents?: number | null }).actual_cents ?? b.spent_cents ?? 0),
    0,
  );

  return {
    project: {
      name: project.name,
      project_state: project.project_state ?? null,
      start_date: project.start_date ?? null,
      end_date: project.end_date ?? null,
      days_to_start: daysFromToday(project.start_date ?? null, today),
      days_to_end: daysFromToday(project.end_date ?? null, today),
    },
    tasks: {
      open: openTasks ?? 0,
      overdue: overdueTasks ?? 0,
      blocked: blockedTasks ?? 0,
      due_next_7_days: dueSoonTasks ?? 0,
    },
    budget: {
      planned_cents: planned,
      actual_cents: actual,
      variance_pct: planned > 0 ? Math.round(((actual - planned) / planned) * 1000) / 10 : null,
    },
    incidents: { open: openIncidents ?? 0 },
    assignments: { open: openAssignments ?? 0, stalled_over_7_days: stalledAssignments ?? 0 },
    deliverables: { open: openDeliverables ?? 0 },
  };
}

const SYSTEM = [
  "You are the ATLVS production risk analyst, embedded in an operations platform for live events and experiential productions.",
  "Assess project risk STRICTLY from the numeric signals provided — never invent counts, dates, or amounts.",
  "Think like a show producer: an immovable show date makes schedule slippage compound; overdue and blocked work near the date is the loudest signal; safety incidents are never minor at scale.",
  "If the signals are genuinely quiet, say the project looks healthy — do not manufacture risks to fill the list.",
  "Write tight, operator-grade prose. No filler, no hedging.",
].join(" ");

export type GenerateRiskReportResult =
  | { ok: true; reportId: string }
  | { ok: false; error: string };

/**
 * Generate + persist a risk report for one project. Caller is responsible
 * for auth/role gating; this function trusts orgId/userId from the session.
 */
export async function generateProjectRiskReport(args: {
  orgId: string;
  projectId: string;
  userId: string;
}): Promise<GenerateRiskReportResult> {
  const signals = await gatherRiskSignals(args.orgId, args.projectId);
  if (!signals) return { ok: false, error: "Project not found." };

  const prompt = [
    `Project signals as of ${new Date().toISOString().slice(0, 10)}:`,
    JSON.stringify(signals, null, 2),
    "Produce the risk assessment now.",
  ].join("\n\n");

  let result;
  try {
    result = await runAI({
      prompt,
      system: SYSTEM,
      outputSchema: RiskReportSchema,
      maxTokens: 2048,
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Risk assessment failed." };
  }

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("ai_risk_reports")
    .insert({
      org_id: args.orgId,
      project_id: args.projectId,
      prompt_context: signals,
      report_data: result.output,
      model: result.modelUsed,
      created_by: args.userId,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  // Meter AI usage per tenant. Fire-and-forget — failures log, never block.
  void Promise.all([
    recordUsage({
      orgId: args.orgId,
      actorId: args.userId,
      metric: "ai.tokens.input",
      quantity: result.inputTokens,
      unit: "tokens",
      metadata: { model: result.modelUsed, project_id: args.projectId, surface: "risk-report" },
    }),
    recordUsage({
      orgId: args.orgId,
      actorId: args.userId,
      metric: "ai.tokens.output",
      quantity: result.outputTokens,
      unit: "tokens",
      metadata: { model: result.modelUsed, project_id: args.projectId, surface: "risk-report" },
    }),
    recordUsage({
      orgId: args.orgId,
      actorId: args.userId,
      metric: "ai.request",
      quantity: 1,
      unit: "count",
      metadata: { model: result.modelUsed, project_id: args.projectId, surface: "risk-report" },
    }),
  ]);

  return { ok: true, reportId: row.id };
}

/** Read the newest persisted report for a project (or null). */
export async function getLatestRiskReport(orgId: string, projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_risk_reports")
    .select("id, report_data, prompt_context, model, created_at, created_by")
    .eq("org_id", orgId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const parsed = RiskReportSchema.safeParse(data.report_data);
  if (!parsed.success) return null;
  return {
    id: data.id,
    report: parsed.data,
    signals: data.prompt_context as RiskSignals,
    model: data.model,
    createdAt: data.created_at,
  };
}
