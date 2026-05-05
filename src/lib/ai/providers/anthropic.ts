import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import type { ZodTypeAny } from "zod";
import { env } from "@/lib/env";
import type { AIProvider, RunAIOptions } from "../types";

const DEFAULT_MODEL = "claude-sonnet-4-6";

const SUPPORTED_MODELS = ["claude-sonnet-4-6", "claude-opus-4-7", "claude-haiku-4-5"];

function bytesToBase64(bytes: Uint8Array): string {
  // Node 20+ Buffer is available in the Next.js server runtime.
  return Buffer.from(bytes).toString("base64");
}

/**
 * Anthropic adapter — the canonical provider this phase. Other providers
 * (OpenAI, Bedrock) can drop in by matching the AIProvider interface.
 */
export const anthropicProvider: AIProvider = {
  name: "anthropic",
  models: SUPPORTED_MODELS,

  async generate(opts: RunAIOptions<ZodTypeAny> & { jsonSchema: object }) {
    const apiKey = opts.apiKey ?? env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not configured");
    }
    const client = new Anthropic({ apiKey });
    const model = opts.model ?? DEFAULT_MODEL;

    // Build the user content array — text first, then optional files.
    type ContentBlock =
      | { type: "text"; text: string }
      | {
          type: "image";
          source: { type: "base64"; media_type: string; data: string };
        }
      | {
          type: "document";
          source: { type: "base64"; media_type: string; data: string };
        };
    const userContent: ContentBlock[] = [];

    const schemaInstruction = `Return ONLY a JSON object matching this JSON Schema. Do not include prose, markdown fences, or commentary outside the JSON.\n\nSchema:\n${JSON.stringify(opts.jsonSchema, null, 2)}`;

    userContent.push({
      type: "text",
      text: `${opts.prompt}\n\n${schemaInstruction}`,
    });

    for (const f of opts.files ?? []) {
      const data = bytesToBase64(f.data);
      if (f.mimeType.startsWith("image/")) {
        userContent.push({
          type: "image",
          source: { type: "base64", media_type: f.mimeType, data },
        });
      } else if (f.mimeType === "application/pdf") {
        userContent.push({
          type: "document",
          source: { type: "base64", media_type: f.mimeType, data },
        });
      } else {
        // Unsupported binary types fall through as a text note so the
        // caller knows the file was ignored rather than silently dropped.
        userContent.push({
          type: "text",
          text: `[unsupported file ${f.filename ?? ""} (${f.mimeType}) omitted]`,
        });
      }
    }

    const systemPrompt =
      opts.system ??
      "You produce strictly valid JSON output that conforms to the schema you are given. Never include explanatory prose around the JSON.";

    // Cast the SDK params — block-specific shape is generic to avoid
    // pulling in the entire Anthropic content-block union here.
    const res = await client.messages.create({
      model,
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.3,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content: userContent as any,
        },
      ],
    });

    const text = res.content
      .filter((c) => c.type === "text")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c) => (c as any).text as string)
      .join("");

    return {
      text,
      inputTokens: res.usage.input_tokens,
      outputTokens: res.usage.output_tokens,
      modelUsed: model,
    };
  },
};

/**
 * Sonnet pricing as of 2026-05 — $3/MTok input, $15/MTok output.
 * Opus is ~$15/$75. Haiku is ~$1/$5. Used for runAI()'s costCents estimate.
 */
export function estimateAnthropicCostCents(model: string, inputTokens: number, outputTokens: number): number {
  const pricing: Record<string, { in: number; out: number }> = {
    "claude-sonnet-4-6": { in: 3, out: 15 },
    "claude-opus-4-7": { in: 15, out: 75 },
    "claude-haiku-4-5": { in: 1, out: 5 },
  };
  const p = pricing[model] ?? pricing["claude-sonnet-4-6"];
  // dollars per million → cents per token then multiply.
  const cents = (inputTokens / 1_000_000) * p.in * 100 + (outputTokens / 1_000_000) * p.out * 100;
  return Math.round(cents * 100) / 100;
}
