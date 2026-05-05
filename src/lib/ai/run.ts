import "server-only";

import { z, type ZodTypeAny } from "zod";
import { log } from "@/lib/log";
import { anthropicProvider, estimateAnthropicCostCents } from "./providers/anthropic";
import type { RunAIOptions, RunAIResult } from "./types";

/**
 * runAI() — the spine for every AI call in the platform.
 *
 * One generic that takes a prompt + a Zod output schema and returns a
 * type-safe parsed object. Powers automation actions ("AI Assist"),
 * field agents (auto-summarize, classify), and any future AI surface.
 *
 * The canonical pattern. `extract-credential.ts` predates this and
 * remains as a specialized wrapper, but new code should call runAI().
 */
export async function runAI<S extends ZodTypeAny>(opts: RunAIOptions<S>): Promise<RunAIResult<S>> {
  const jsonSchema = zodToJsonSchema(opts.outputSchema);

  const provider = anthropicProvider;

  const start = Date.now();
  const generated = await provider.generate({ ...opts, jsonSchema });
  const latencyMs = Date.now() - start;

  const json = extractJson(generated.text);
  if (!json) {
    log.warn("ai.run.no_json", { latency_ms: latencyMs, model: generated.modelUsed });
    throw new Error("AI did not return parseable JSON");
  }

  const parsed = opts.outputSchema.safeParse(json);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    log.warn("ai.run.schema_mismatch", { issues, model: generated.modelUsed });
    throw new Error(`AI output failed schema validation: ${issues}`);
  }

  const costCents = estimateAnthropicCostCents(generated.modelUsed, generated.inputTokens, generated.outputTokens);

  return {
    output: parsed.data as z.infer<S>,
    modelUsed: generated.modelUsed,
    inputTokens: generated.inputTokens,
    outputTokens: generated.outputTokens,
    costCents,
  };
}

/**
 * Pull the first balanced JSON object out of a string. Tolerates fenced
 * code blocks (` ```json ... ``` `) that the model sometimes emits despite
 * being told not to.
 */
function extractJson(text: string): unknown | null {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const candidate = fence ? fence[1] : text;
  // Find the first '{' or '[' and try to parse from there onward, walking
  // backward from the last matching close brace if needed.
  const firstBrace = candidate.search(/[{[]/);
  if (firstBrace === -1) return null;
  const open = candidate[firstBrace];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = firstBrace; i < candidate.length; i++) {
    const ch = candidate[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) {
        const slice = candidate.slice(firstBrace, i + 1);
        try {
          return JSON.parse(slice);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/**
 * Hand-rendered Zod → JSON Schema. We don't have `zod-to-json-schema` as
 * a dep and the generic shape we emit is enough for the model to use as a
 * structural hint — schema validation runs Zod-side after parse.
 */
export function zodToJsonSchema(schema: ZodTypeAny): object {
  return zodNodeToJsonSchema(schema);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function zodNodeToJsonSchema(node: any): object {
  const def = node?._def;
  const typeName: string | undefined = def?.typeName ?? def?.type;

  // Zod 4 uses `def.type` strings like "string" / "object" — fall through
  // by checking constructor-name and presence of typical fields.
  const ctor = node?.constructor?.name ?? "";

  // Object ----------------------------------------------------------------
  if (typeName === "ZodObject" || typeof node?.shape === "function" || node?._def?.shape) {
    const shape = typeof node.shape === "function" ? node.shape() : (node.shape ?? def?.shape?.());
    const properties: Record<string, object> = {};
    const required: string[] = [];
    for (const [k, v] of Object.entries(shape ?? {})) {
      properties[k] = zodNodeToJsonSchema(v);
      if (!isOptional(v)) required.push(k);
    }
    return { type: "object", properties, required };
  }

  // Array -----------------------------------------------------------------
  if (typeName === "ZodArray" || ctor === "ZodArray") {
    const inner = def?.type ?? def?.element ?? def?.innerType;
    return { type: "array", items: inner ? zodNodeToJsonSchema(inner) : {} };
  }

  // String / Number / Boolean --------------------------------------------
  if (typeName === "ZodString" || ctor === "ZodString") return { type: "string" };
  if (typeName === "ZodNumber" || ctor === "ZodNumber") return { type: "number" };
  if (typeName === "ZodBoolean" || ctor === "ZodBoolean") return { type: "boolean" };
  if (typeName === "ZodDate" || ctor === "ZodDate") return { type: "string", format: "date-time" };

  // Enum / Literal --------------------------------------------------------
  if (typeName === "ZodEnum" || ctor === "ZodEnum") {
    const values = def?.values ?? def?.entries ?? [];
    return { type: "string", enum: Array.isArray(values) ? values : Object.values(values) };
  }
  if (typeName === "ZodLiteral" || ctor === "ZodLiteral") {
    const value = def?.value ?? def?.values?.[0];
    return { const: value };
  }

  // Optional / Nullable / Default — unwrap.
  if (typeName === "ZodOptional" || typeName === "ZodNullable" || typeName === "ZodDefault") {
    const inner = def?.innerType ?? def?.type;
    return inner ? zodNodeToJsonSchema(inner) : {};
  }

  // Union / Intersection — best-effort, model treats union as "any of".
  if (typeName === "ZodUnion" || ctor === "ZodUnion") {
    const opts = def?.options ?? [];
    return { anyOf: opts.map((o: unknown) => zodNodeToJsonSchema(o)) };
  }

  // Record ----------------------------------------------------------------
  if (typeName === "ZodRecord" || ctor === "ZodRecord") {
    const value = def?.valueType ?? def?.value;
    return { type: "object", additionalProperties: value ? zodNodeToJsonSchema(value) : true };
  }

  // Fallback — let the model infer.
  return {};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isOptional(node: any): boolean {
  const def = node?._def;
  const typeName: string | undefined = def?.typeName ?? def?.type;
  if (typeName === "ZodOptional" || typeName === "ZodDefault" || typeName === "ZodNullable") return true;
  if (typeof node?.isOptional === "function") {
    try {
      return Boolean(node.isOptional());
    } catch {
      return false;
    }
  }
  return false;
}
