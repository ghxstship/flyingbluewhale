import "server-only";

import { z } from "zod";
import { runAI } from "./run";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { log } from "@/lib/log";

/**
 * Server helpers for AI Field Agents (Phase 4.4).
 *
 * The pattern: a row in `ai_agents` declares (target_table, target_column,
 * source_columns, prompt_template, output_type). When a record on the
 * target table changes, runFieldAgent(...) re-renders the prompt against
 * the row's source values, calls runAI(), and writes the result back to
 * the target column. SmartSuite's "AI Field Agent" feature in one helper.
 */

/** Allowed tables an agent can target. Whitelisted to keep the surface honest. */
const ALLOWED_TABLES = new Set<string>(["incidents", "tickets", "tasks", "deliverables", "leads"]);

/** Output schemas keyed by `output_type`. */
const SCHEMAS = {
  text: z.object({ value: z.string() }),
  number: z.object({ value: z.number() }),
  select: z.object({ value: z.string() }),
} as const;

type AgentRow = {
  id: string;
  org_id: string;
  target_table: string;
  target_column: string;
  source_columns: string[];
  prompt_template: string;
  output_type: keyof typeof SCHEMAS;
  model: string;
  max_tokens: number;
  enabled: boolean;
};

export type RunFieldAgentResult = {
  output: string | number;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  costCents?: number;
};

// AI agents address tables by name at runtime (a.target_table is a row
// value, not a literal). The typed Supabase client can't infer columns
// from a runtime string, so this helper returns the loose `any`-shaped
// client for these dynamic-table calls only. The whitelist + RLS still
// gate the actual write.
import type { LooseSupabase } from "@/lib/supabase/loose";

async function pickClient(): Promise<LooseSupabase> {
  if (isServiceClientAvailable()) return createServiceClient() as unknown as LooseSupabase;
  return (await createClient()) as unknown as LooseSupabase;
}

/**
 * Substitute `{{column}}` placeholders in `template` with values from `row`.
 * Missing or null values render as the empty string.
 */
export function renderPrompt(template: string, row: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, key: string) => {
    const value = row[key];
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  });
}

/**
 * Run an AI Field Agent against a single record. Loads the agent + record,
 * substitutes the prompt template, calls runAI(), writes the output back,
 * and stamps an audit_log entry.
 */
export async function runFieldAgent(opts: { agentId: string; recordId: string }): Promise<RunFieldAgentResult> {
  const supabase = await pickClient();

  // 1. Load the agent row.
  const { data: agent, error: agentErr } = await supabase
    .from("ai_agents")
    .select(
      "id, org_id, target_table, target_column, source_columns, prompt_template, output_type, model, max_tokens, enabled",
    )
    .eq("id", opts.agentId)
    .single();
  if (agentErr || !agent) {
    throw new Error(agentErr?.message ?? "ai agent not found");
  }
  const a = agent as unknown as AgentRow;
  if (!a.enabled) {
    throw new Error("ai agent is disabled");
  }
  if (!ALLOWED_TABLES.has(a.target_table)) {
    throw new Error(`target_table '${a.target_table}' is not allow-listed`);
  }

  // 2. Load the target record. Read source_columns + the org_id so we can
  // re-confirm the row belongs to the agent's org before writing back.
  const sourceCols = Array.from(new Set([...(a.source_columns ?? []), "org_id"]));
  const { data: row, error: rowErr } = await supabase
    .from(a.target_table)
    .select(sourceCols.join(","))
    .eq("id", opts.recordId)
    .single();
  if (rowErr || !row) {
    throw new Error(rowErr?.message ?? "target record not found");
  }
  const rowRec = row as Record<string, unknown>;
  if (rowRec.org_id && rowRec.org_id !== a.org_id) {
    throw new Error("agent/record org mismatch");
  }

  // 3. Render the prompt.
  const prompt = renderPrompt(a.prompt_template, rowRec);

  // 4. Call runAI() with a schema based on output_type.
  const schema = SCHEMAS[a.output_type] ?? SCHEMAS.text;
  const result = await runAI({
    prompt,
    outputSchema: schema,
    model: a.model,
    maxTokens: a.max_tokens,
    temperature: 0.3,
    system:
      'You are an AI field agent populating a single column on a database record. Return ONLY a JSON object of the form {"value": ...}. The value type must match the schema.',
  });

  // 5. Write the output back to the target column.
  const writeValue = a.output_type === "number" ? Number(result.output.value) : String(result.output.value);
  const updateRes = await supabase
    .from(a.target_table)
    .update({ [a.target_column]: writeValue, updated_at: new Date().toISOString() })
    .eq("id", opts.recordId);
  if (updateRes.error) {
    log.warn("ai.agent.write_failed", { err: updateRes.error.message, agent_id: a.id });
    throw new Error(updateRes.error.message);
  }

  // 6. Audit-log the run.
  await supabase.from("audit_log").insert({
    org_id: a.org_id,
    action: "ai_agent.ran",
    target_table: a.target_table,
    target_id: opts.recordId,
    metadata: {
      agent_id: a.id,
      target_column: a.target_column,
      model: result.modelUsed,
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
      cost_cents: result.costCents,
    },
  });

  return {
    output: writeValue,
    modelUsed: result.modelUsed,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    costCents: result.costCents,
  };
}

/**
 * Hook intended to be called from a record-mutation pathway when one of
 * the agent's `source_columns` changed. Resolves the agent for the
 * target table/column on the record's org and runs it. Best-effort —
 * failures log and swallow so the host write isn't blocked.
 */
export async function triggerFieldAgentOnFieldChange(opts: {
  orgId: string;
  table: string;
  recordId: string;
  changedColumns: string[];
}): Promise<void> {
  try {
    const supabase = await pickClient();
    const { data: agents, error } = await supabase
      .from("ai_agents")
      .select("id, source_columns, auto_refresh, enabled")
      .eq("org_id", opts.orgId)
      .eq("target_table", opts.table)
      .eq("enabled", true)
      .eq("auto_refresh", true);
    if (error || !agents) return;
    for (const agent of agents as unknown as Array<{
      id: string;
      source_columns: string[];
      auto_refresh: boolean;
      enabled: boolean;
    }>) {
      const overlap = (agent.source_columns ?? []).some((c) => opts.changedColumns.includes(c));
      if (!overlap) continue;
      try {
        await runFieldAgent({ agentId: agent.id, recordId: opts.recordId });
      } catch (err) {
        log.warn("ai.agent.auto_refresh_failed", {
          err: err instanceof Error ? err.message : String(err),
          agent_id: agent.id,
          record_id: opts.recordId,
        });
      }
    }
  } catch (err) {
    log.warn("ai.agent.trigger_failed", { err: err instanceof Error ? err.message : String(err) });
  }
}
