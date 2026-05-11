"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { runAutomation } from "@/lib/automations/run";
import { log } from "@/lib/log";

export type State = { error?: string; runId?: string; ok?: true } | null;

const StepSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.string().min(1).max(120),
  config: z.record(z.string(), z.unknown()),
  condition: z.unknown().optional(),
});

const StepsArraySchema = z.array(StepSchema).max(50);

const TriggerKindSchema = z.enum(["manual", "schedule", "webhook", "event"]);

/**
 * Persist the steps array on an automation. Called via auto-save from the
 * StepBuilder client component on a 1.5s debounce. Wire shape matches the
 * `useActionState` contract — accepts `(prev, formData)` and returns `State`.
 *
 * The client serializes the steps as JSON in a single `steps` form field;
 * we parse + validate, then UPDATE under the same RLS policy as the page
 * loader (`org_id = session.orgId`). Direct ownership is enforced by the
 * compound `.eq("id", automationId).eq("org_id", session.orgId)` filter.
 */
export async function saveStepsAction(automationId: string, _prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const raw = fd.get("steps");
  if (typeof raw !== "string") return { error: "missing steps payload" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { error: `invalid JSON: ${(e as Error).message}` };
  }
  const validated = StepsArraySchema.safeParse(parsed);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? "invalid steps" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("automations")
    .update({ steps: validated.data as never })
    .eq("id", automationId)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/ai/automations/${automationId}`);
  return { ok: true };
}

/**
 * Persist the trigger kind + config on an automation. Same shape as
 * `saveStepsAction`.
 */
export async function saveTriggerAction(automationId: string, _prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const kindRaw = fd.get("kind");
  const configRaw = fd.get("config");
  const kindParsed = TriggerKindSchema.safeParse(kindRaw);
  if (!kindParsed.success) return { error: "invalid trigger kind" };

  let configParsed: unknown = {};
  if (typeof configRaw === "string" && configRaw.length > 0) {
    try {
      configParsed = JSON.parse(configRaw);
    } catch (e) {
      return { error: `invalid trigger config JSON: ${(e as Error).message}` };
    }
  }
  if (typeof configParsed !== "object" || configParsed === null || Array.isArray(configParsed)) {
    return { error: "trigger config must be an object" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("automations")
    .update({
      trigger_kind: kindParsed.data,
      trigger_config: configParsed as never,
    })
    .eq("id", automationId)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/ai/automations/${automationId}`);
  return { ok: true };
}

/**
 * Generate (or rotate) the per-automation HMAC secret used to verify
 * inbound webhook calls. Phase 4.3.
 *
 * The secret is plain text in the DB; protected by RLS (admins only see it
 * via the page loader using the authenticated client). Returning the secret
 * to the caller is intentional — the user has to copy it once to configure
 * the upstream caller; we never re-expose it raw afterwards.
 */
export async function generateWebhookSecretAction(automationId: string, _prev: State, _form: FormData): Promise<State> {
  const session = await requireSession();
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("automations")
    .select("id")
    .eq("id", automationId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!existing) return { error: "Automation not found" };

  // 32 random bytes → 64-hex string. Sufficient for HMAC-SHA256 keying.
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const secret = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

  // Service-role write bypasses RLS — pin org_id explicitly so a future
  // change to this code can't accidentally reach a same-id automation
  // in another org. The upstream `existing` check already gates by
  // session.orgId, so this is defense-in-depth.
  const svc = createServiceClient() as unknown as import("@/lib/supabase/loose").LooseSupabase;
  const { error } = await svc
    .from("automations")
    .update({ webhook_secret: secret })
    .eq("id", automationId)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/ai/automations/${automationId}`);
  return { ok: true };
}

export async function toggleAutomationAction(
  automationId: string,
  nextEnabled: boolean,
  _prev: State,
  _form: FormData,
): Promise<State> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("automations")
    .update({ enabled: nextEnabled })
    .eq("id", automationId)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/ai/automations/${automationId}`);
  revalidatePath("/console/ai/automations");
  return null;
}

/**
 * Manual-run trigger — Phase 4.1.
 *
 * 1. Verifies the user owns the automation (RLS-scoped).
 * 2. Inserts a `pending` automation_runs row (so the UI has a stable id to
 *    navigate to before the runner starts).
 * 3. Kicks the runner off in the background. The originating request returns
 *    immediately with the new run id; the runner writes per-step rows to
 *    `automation_step_runs` as it progresses.
 *
 * The runner can throw if the automation is disabled or the steps JSON is
 * malformed — caught here so a runner crash flips the run row to `failed`
 * rather than leaving a stuck `pending` row.
 */
export async function recordManualRunAction(automationId: string, _prev: State, _form: FormData): Promise<State> {
  const session = await requireSession();
  const supabase = await createClient();

  // RLS check: confirm the caller can see the automation in their org.
  const { data: automation, error: loadErr } = await supabase
    .from("automations")
    .select("id, enabled")
    .eq("id", automationId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (loadErr) return { error: loadErr.message };
  if (!automation) return { error: "Automation not found" };
  if (!automation.enabled) return { error: "Automation is disabled" };

  // Insert pending run row via service-role (RLS blocks INSERT on the table
  // for the authenticated role — writes go through the runner code path).
  // LooseSupabase shim covers the not-yet-typed automation_runs table.
  const svc = createServiceClient() as unknown as import("@/lib/supabase/loose").LooseSupabase;
  const { data: runRow, error: insertErr } = (await svc
    .from("automation_runs")
    .insert({
      automation_id: automationId,
      org_id: session.orgId,
      trigger_kind: "manual",
      trigger_payload: {},
      triggered_by: session.userId,
      status: "pending",
    })
    .select("id")
    .single()) as { data: { id: string } | null; error: { message: string } | null };
  if (insertErr || !runRow) return { error: insertErr?.message ?? "Failed to start run" };
  const runId = runRow.id;

  // Fire-and-forget — never block the originating request. Errors flip the
  // run row to `failed` inside the runner; if the runner itself throws
  // synchronously (e.g. service client misconfigured) we catch and log it.
  void runAutomation({
    automationId,
    triggerKind: "manual",
    triggerPayload: {},
    triggeredBy: session.userId,
    existingRunId: runId,
  }).catch(async (err) => {
    log.error("automation.run_threw", {
      automationId,
      runId,
      err: (err as Error).message,
    });
    try {
      const svc2 = createServiceClient() as unknown as import("@/lib/supabase/loose").LooseSupabase;
      await svc2
        .from("automation_runs")
        .update({
          status: "failed",
          finished_at: new Date().toISOString(),
          error_summary: (err as Error).message,
        })
        .eq("id", runId)
        .eq("org_id", session.orgId);
    } catch {
      // best-effort; the run-row will time out via cron in Phase 4.3
    }
  });

  revalidatePath(`/console/ai/automations/${automationId}`);
  revalidatePath("/console/ai/automations");
  return { runId };
}
