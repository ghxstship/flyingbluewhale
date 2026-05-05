import "server-only";

import type { z, ZodTypeAny } from "zod";

/**
 * Optional binary inputs (PDFs, images) attached to a runAI() call.
 * Anthropic accepts both via base64-encoded `image` and `document` content
 * blocks. Other providers may need translation in their adapter.
 */
export type RunAIFile = {
  data: Uint8Array;
  mimeType: string;
  filename?: string;
};

/**
 * Inputs to runAI(). Single source of truth for every AI surface in the
 * platform — automation actions, field agents, and one-off server calls
 * all funnel through this shape.
 */
export type RunAIOptions<S extends ZodTypeAny> = {
  /** User prompt (the "what to do"). System prompt is separate. */
  prompt: string;
  /** Zod schema describing the structured output. Validated post-call. */
  outputSchema: S;
  /** Model id. Default 'claude-sonnet-4-6'. */
  model?: string;
  /** System prompt prefix. Optional — falls back to a generic structured-output preamble. */
  system?: string;
  /** Optional file inputs (PDF, images). Each is a buffer + mime type. */
  files?: RunAIFile[];
  /** Provider API key override. Falls back to env. Enables BYO-key flows. */
  apiKey?: string;
  /** Temperature. Default 0.3 — structured tasks want deterministic output. */
  temperature?: number;
  /** Max tokens. Default 1024. */
  maxTokens?: number;
};

export type RunAIResult<S extends ZodTypeAny> = {
  output: z.infer<S>;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  /** Estimated cost in cents (USD), provider-dependent. */
  costCents?: number;
};

/**
 * Provider abstraction. The Anthropic adapter is the only one shipped in
 * this phase; OpenAI / Bedrock / etc. plug in by exporting an object of
 * this shape.
 */
export type AIProvider = {
  /** Stable identifier (e.g. "anthropic"). */
  name: string;
  /** Model ids the provider can route. */
  models: string[];
  /**
   * Generate a single completion. The runAI() entry point hands the
   * provider a JSON schema (already serialized) plus the user opts and
   * expects raw text + token counts back. Schema validation happens
   * upstream so providers stay dumb.
   */
  generate(
    opts: RunAIOptions<ZodTypeAny> & { jsonSchema: object },
  ): Promise<{ text: string; inputTokens: number; outputTokens: number; modelUsed: string }>;
};
