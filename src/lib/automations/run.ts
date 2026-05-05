import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { log } from "@/lib/log";
import { resolveTemplate } from "./resolve";
import { evaluateCondition, type Condition } from "./conditions";
import { actionRegistry, type ActionContext } from "./registry";

// Side-effect imports — each module calls `registerAction` at load time.
import "./actions/notify";
import "./actions/email-send";
import "./actions/webhook-send";
import "./actions/record-update";
import "./actions/delay";

/**
 * Automation step interpreter — Phase 4.1 of the SmartSuite parity roadmap.
 *
 * Walks `automations.steps` JSON, resolves `{{trigger.*}}` / `{{step.N.*}}`
 * placeholders, validates the resolved input against each action's Zod schema,
 * dispatches to the registered handler, and writes per-step ledger rows.
 *
 * Failure semantics: the FIRST failing step terminates the run and marks it
 * `failed` with an `error_summary`. Subsequent steps are not executed. Every
 * action (including the failing one) gets an `automation_step_runs` row so
 * the UI can show exactly where the automation died.
 *
 * All DB writes use the service-role client because:
 *  - automations may execute in contexts where there's no auth cookie
 *    (job-worker, schedule trigger, inbound webhook)
 *  - RLS on `automation_runs` / `automation_step_runs` blocks INSERT/UPDATE
 *    for the authenticated role by design
 *
 * Org scoping is enforced manually by writing `org_id` from the parent
 * automation row — never from caller-supplied input.
 */

type AutomationRow = {
  id: string;
  org_id: string;
  steps: unknown;
  enabled: boolean;
};

type Step = {
  type?: string;
  input?: unknown;
  /**
   * Optional gate evaluated before the step's handler runs. When the
   * condition resolves to `false`, the step is recorded with status
   * `skipped` and the runner continues to the next step. Evaluated against
   * the same `{ trigger, steps }` context that drives template resolution
   * — see `src/lib/automations/conditions.ts`.
   */
  condition?: Condition | null;
};

export type RunResult = {
  runId: string;
  status: "success" | "failed";
  error?: string;
  actionCount: number;
};

export type RunInput = {
  automationId: string;
  triggerKind: string;
  triggerPayload?: Record<string, unknown>;
  triggeredBy?: string | null;
  /**
   * If the caller has already inserted a `pending` automation_runs row (e.g.
   * `recordManualRunAction`), pass it here so we update in place instead of
   * creating a duplicate.
   */
  existingRunId?: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

export async function runAutomation(opts: RunInput): Promise<RunResult> {
  // The new ledger tables (`automation_runs`, `automation_step_runs`) aren't
  // in `database.types.ts` until the type-gen runs against the migrated DB.
  // Untype the client at the boundary to avoid an editor-only error blocking
  // the runner from compiling. Every write is org-scoped and validated.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = createServiceClient() as unknown as { from: (t: string) => any };

  // 1. Load automation
  const { data: autoRow, error: loadErr } = await svc
    .from("automations")
    .select("id, org_id, steps, enabled")
    .eq("id", opts.automationId)
    .maybeSingle();
  if (loadErr) throw new Error(`automation load failed: ${loadErr.message}`);
  const automation = autoRow as unknown as AutomationRow | null;
  if (!automation) throw new Error(`automation ${opts.automationId} not found`);
  if (!automation.enabled) {
    throw new Error(`automation ${opts.automationId} is disabled`);
  }

  const stepsArr: Step[] = Array.isArray(automation.steps) ? (automation.steps as Step[]) : [];

  // 2. Insert / claim run row
  let runId = opts.existingRunId ?? "";
  const startIso = nowIso();
  if (runId) {
    await svc.from("automation_runs").update({ status: "running", started_at: startIso }).eq("id", runId);
  } else {
    const { data: runRow, error: insertErr } = await svc
      .from("automation_runs")
      .insert({
        automation_id: automation.id,
        org_id: automation.org_id,
        trigger_kind: opts.triggerKind,
        trigger_payload: (opts.triggerPayload ?? {}) as never,
        triggered_by: opts.triggeredBy ?? null,
        status: "running",
        started_at: startIso,
      })
      .select("id")
      .single();
    if (insertErr) throw new Error(`run insert failed: ${insertErr.message}`);
    runId = (runRow as { id: string }).id;
  }

  const ctxBase = {
    orgId: automation.org_id,
    runId,
    automationId: automation.id,
    actorId: opts.triggeredBy ?? undefined,
    trigger: opts.triggerPayload ?? {},
  };

  const stepOutputs: unknown[] = [];
  let runStatus: "success" | "failed" = "success";
  let errorSummary: string | null = null;
  let actionCount = 0;

  for (let i = 0; i < stepsArr.length; i++) {
    const step = stepsArr[i] ?? {};
    const actionType = typeof step.type === "string" ? step.type : "";
    const handler = actionType ? actionRegistry[actionType] : undefined;
    const rawInput = step.input ?? {};
    const stepStartIso = nowIso();

    // Insert step row in `running` state up front so a crashed handler still
    // leaves a breadcrumb.
    const { data: stepRow, error: stepInsertErr } = await svc
      .from("automation_step_runs")
      .insert({
        run_id: runId,
        step_index: i,
        action_type: actionType || "(unknown)",
        input: rawInput as never,
        status: "running",
        started_at: stepStartIso,
      })
      .select("id")
      .single();
    if (stepInsertErr) {
      // If we can't even write the ledger we have to bail — but record the run as failed.
      runStatus = "failed";
      errorSummary = `step ${i} ledger insert failed: ${stepInsertErr.message}`;
      break;
    }
    const stepRowId = (stepRow as { id: string }).id;

    // Optional per-step condition gate (P4.5). If false, mark skipped and
    // move on without invoking the handler. Pure evaluation — no I/O — so
    // a malformed condition fails closed (skips the step) rather than
    // crashing the run.
    const condCtx = { trigger: ctxBase.trigger, steps: stepOutputs as Array<{ output: unknown }> };
    let conditionPassed = true;
    try {
      conditionPassed = evaluateCondition(step.condition ?? null, condCtx);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.warn("automation.condition_eval_failed", {
        automationId: automation.id,
        runId,
        stepIndex: i,
        err: msg,
      });
      conditionPassed = false;
    }
    if (!conditionPassed) {
      const finishedAt = nowIso();
      await svc
        .from("automation_step_runs")
        .update({
          status: "skipped",
          finished_at: finishedAt,
          latency_ms: Date.now() - new Date(stepStartIso).getTime(),
        })
        .eq("id", stepRowId);
      // Push a sentinel so subsequent {{step.N.output.*}} references
      // resolve to undefined rather than reaching past the skipped slot.
      stepOutputs.push({ output: null });
      continue;
    }

    if (!handler) {
      const msg = `unknown action type: "${actionType}"`;
      await svc
        .from("automation_step_runs")
        .update({
          status: "failed",
          error: msg,
          finished_at: nowIso(),
          latency_ms: Date.now() - new Date(stepStartIso).getTime(),
        })
        .eq("id", stepRowId);
      runStatus = "failed";
      errorSummary = msg;
      break;
    }

    try {
      // Resolve placeholders against trigger + prior step outputs, then
      // validate via the action's schema.
      const resolvedInput = resolveTemplate(rawInput, { trigger: ctxBase.trigger, steps: stepOutputs });
      const parsed = handler.schema.safeParse(resolvedInput);
      if (!parsed.success) {
        const msg = `step ${i} input validation failed: ${parsed.error.message}`;
        await svc
          .from("automation_step_runs")
          .update({
            status: "failed",
            error: msg,
            input: resolvedInput as never,
            finished_at: nowIso(),
            latency_ms: Date.now() - new Date(stepStartIso).getTime(),
          })
          .eq("id", stepRowId);
        runStatus = "failed";
        errorSummary = msg;
        break;
      }

      const ctx: ActionContext = { ...ctxBase, stepIndex: i, steps: stepOutputs };
      const result = await handler.run(parsed.data, ctx);
      const finishedAt = nowIso();
      const latencyMs = Date.now() - new Date(stepStartIso).getTime();

      await svc
        .from("automation_step_runs")
        .update({
          status: "success",
          input: resolvedInput as never,
          output: (result.output ?? {}) as never,
          finished_at: finishedAt,
          latency_ms: latencyMs,
        })
        .eq("id", stepRowId);

      stepOutputs.push({ output: result.output ?? {} });
      actionCount += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const finishedAt = nowIso();
      await svc
        .from("automation_step_runs")
        .update({
          status: "failed",
          error: msg,
          finished_at: finishedAt,
          latency_ms: Date.now() - new Date(stepStartIso).getTime(),
        })
        .eq("id", stepRowId);
      runStatus = "failed";
      errorSummary = msg;
      log.warn("automation.step_failed", {
        automationId: automation.id,
        runId,
        stepIndex: i,
        actionType,
        err: msg,
      });
      break;
    }
  }

  const finishedAtIso = nowIso();
  await svc
    .from("automation_runs")
    .update({
      status: runStatus,
      finished_at: finishedAtIso,
      action_count: actionCount,
      error_summary: errorSummary,
    })
    .eq("id", runId);

  // Mirror onto the parent `automations` row so the index page reflects the
  // latest result without needing to JOIN automation_runs.
  await svc
    .from("automations")
    .update({
      last_run_at: finishedAtIso,
      last_run_status: runStatus === "success" ? "ok" : "failed",
    })
    .eq("id", automation.id);

  return {
    runId,
    status: runStatus,
    error: errorSummary ?? undefined,
    actionCount,
  };
}
