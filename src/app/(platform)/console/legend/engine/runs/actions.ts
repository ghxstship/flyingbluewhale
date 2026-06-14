"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import {
  COMPLIANCE_FINDING_STATES,
  COMPLIANCE_SCOPE_KINDS,
  deriveRunState,
  summarizeFindings,
  type ComplianceSeverity,
} from "@/lib/xmce_engine";
import type { ComplianceRuleRow } from "../types";

export type State = { error?: string } | null;

const RunSchema = z.object({
  scope_kind: z.enum(COMPLIANCE_SCOPE_KINDS),
  scope_ref: z.string().uuid().optional().or(z.literal("")),
});

/**
 * Stub compliance engine. Records a run, evaluates the org's ACTIVE rules
 * (no real interpreter — it deterministically flags a sample subset so the
 * findings dashboard reads believably), writes one finding per flagged rule,
 * then settles the run to a terminal state with a summary. The shape mirrors
 * a real audit run so swapping in an interpreter later is drop-in.
 */
export async function runEngineAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can run the compliance engine" };
  const parsed = RunSchema.safeParse({
    scope_kind: fd.get("scope_kind") ?? "org",
    scope_ref: fd.get("scope_ref") ?? "",
  });
  if (!parsed.success) return { error: "Invalid run scope" };

  const db = (await createClient()) as unknown as LooseSupabase;
  const startedAt = new Date().toISOString();

  // Create the run in `running` state first.
  const { data: runRow, error: runErr } = await db
    .from("compliance_runs")
    .insert({
      org_id: session.orgId,
      scope_kind: parsed.data.scope_kind,
      scope_ref: parsed.data.scope_ref || null,
      run_state: "running",
      started_at: startedAt,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (runErr || !runRow) return { error: runErr?.message ?? "Could not start run" };
  const runId = (runRow as { id: string }).id;

  // Load active rules to evaluate.
  const { data: ruleData } = await db
    .from("compliance_rules")
    .select("id, severity, code, title")
    .eq("org_id", session.orgId)
    .eq("rule_state", "active")
    .is("deleted_at", null)
    .limit(500);
  const rules = (ruleData ?? []) as Array<Pick<ComplianceRuleRow, "id" | "severity" | "code" | "title">>;

  // Stub evaluation: flag every 2nd active rule as a sample finding.
  const flagged = rules.filter((_r, i) => i % 2 === 0);
  if (flagged.length > 0) {
    const findingRows = flagged.map((r) => ({
      org_id: session.orgId,
      run_id: runId,
      rule_id: r.id,
      finding_state: "open",
      severity: r.severity,
      detail: `Sample finding: ${r.code} — ${r.title} requires review for ${parsed.data.scope_kind} scope.`,
      entity_ref: parsed.data.scope_ref || parsed.data.scope_kind,
      created_by: session.userId,
    }));
    const { error: findErr } = await db.from("compliance_findings").insert(findingRows);
    if (findErr) {
      await db
        .from("compliance_runs")
        .update({ run_state: "error", finished_at: new Date().toISOString() })
        .eq("id", runId)
        .eq("org_id", session.orgId);
      return { error: findErr.message };
    }
  }

  const findingSeverities = flagged.map((r) => ({ severity: r.severity as ComplianceSeverity }));
  const finalState = deriveRunState(findingSeverities);
  const summary = summarizeFindings(findingSeverities, rules.length);

  await db
    .from("compliance_runs")
    .update({ run_state: finalState, summary, finished_at: new Date().toISOString() })
    .eq("id", runId)
    .eq("org_id", session.orgId);

  revalidatePath("/console/legend/engine/runs");
  revalidatePath("/console/legend/engine");
  redirect(`/console/legend/engine/runs/${runId}`);
}

export async function setFindingStateAction(
  findingId: string,
  runId: string,
  next: (typeof COMPLIANCE_FINDING_STATES)[number],
): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can triage findings" };
  if (!COMPLIANCE_FINDING_STATES.includes(next)) return { error: "Invalid finding state" };
  const db = (await createClient()) as unknown as LooseSupabase;
  const { error } = await db
    .from("compliance_findings")
    .update({ finding_state: next })
    .eq("id", findingId)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/legend/engine/runs/${runId}`);
  return null;
}
