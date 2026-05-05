import "server-only";

import { z, type ZodTypeAny } from "zod";
import { runAI } from "@/lib/ai/run";

/**
 * Allowed scalar types for the simplified `outputShape` map. Mirrors the
 * SmartSuite "Custom Outputs" feature — authors describe each field's
 * primitive type and the runner builds a Zod schema at execution time.
 */
const OUTPUT_TYPES = ["string", "number", "boolean", "date"] as const;
type OutputType = (typeof OUTPUT_TYPES)[number];

export const aiAssistInputSchema = z.object({
  prompt: z.string().min(1).max(8000),
  /** Map of output key → primitive type. */
  outputShape: z.record(z.string(), z.enum(OUTPUT_TYPES)),
  /** Model id. Optional — runAI() defaults to claude-sonnet-4-6. */
  model: z.string().optional(),
  /** Optional system prompt prefix. */
  system: z.string().max(4000).optional(),
});

export type AIAssistInput = z.infer<typeof aiAssistInputSchema>;

export type AIAssistOutput = {
  output: Record<string, string | number | boolean>;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  costCents?: number;
};

/**
 * Build a Zod schema from the simplified `outputShape` map.
 */
function buildSchema(shape: Record<string, OutputType>): ZodTypeAny {
  const fields: Record<string, ZodTypeAny> = {};
  for (const [key, type] of Object.entries(shape)) {
    switch (type) {
      case "number":
        fields[key] = z.number();
        break;
      case "boolean":
        fields[key] = z.boolean();
        break;
      case "date":
        // ISO string — easier to round-trip than a Date object.
        fields[key] = z.string();
        break;
      default:
        fields[key] = z.string();
    }
  }
  return z.object(fields);
}

/**
 * AI Assist automation action — SmartSuite parity with their
 * "Automation Action: AI Assist" feature. Plugs into the action registry
 * shipped in P4.1 via the `{ type, schema, run }` contract.
 */
export const aiAssistAction = {
  type: "ai.assist",
  label: "AI Assist",
  description: "Run a custom prompt and return structured output validated against a shape you define.",
  schema: aiAssistInputSchema,
  /**
   * Run the action. `_ctx` is the automation runtime context (org id,
   * trigger payload, prior step outputs). Currently unused but kept on
   * the signature so the registry can pass it without churn later.
   */
  async run(input: AIAssistInput, _ctx?: unknown): Promise<AIAssistOutput> {
    const schema = buildSchema(input.outputShape);
    const result = await runAI({
      prompt: input.prompt,
      outputSchema: schema,
      model: input.model,
      system: input.system,
    });
    return {
      output: result.output as Record<string, string | number | boolean>,
      modelUsed: result.modelUsed,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costCents: result.costCents,
    };
  },
};

export type AIAssistAction = typeof aiAssistAction;
