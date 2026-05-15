import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

// Mock @anthropic-ai/sdk before runAI is imported. The default export is
// the Anthropic class; messages.create returns the canonical envelope.
const messagesCreate = vi.fn();

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = { create: messagesCreate };
    },
  };
});

// Fence the env so the provider doesn't bail on missing API key.
vi.mock("@/lib/env", () => ({
  env: {
    ANTHROPIC_API_KEY: "test-key",
  },
}));

// Silence the structured logger.
vi.mock("@/lib/log", () => ({
  log: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { runAI } from "../ai/run";

describe("runAI", () => {
  beforeEach(() => {
    messagesCreate.mockReset();
  });

  it("validates output against schema and returns parsed value", async () => {
    messagesCreate.mockResolvedValue({
      content: [
        {
          type: "text",
          text: '```json\n{"summary":"Test summary","priority":3}\n```',
        },
      ],
      usage: { input_tokens: 100, output_tokens: 50 },
    });

    const result = await runAI({
      prompt: "summarize",
      outputSchema: z.object({ summary: z.string(), priority: z.number() }),
    });

    expect(result.output.summary).toBe("Test summary");
    expect(result.output.priority).toBe(3);
  });

  it("returns token usage and a cost estimate", async () => {
    messagesCreate.mockResolvedValue({
      content: [{ type: "text", text: '{"value":"ok"}' }],
      usage: { input_tokens: 1_000_000, output_tokens: 1_000_000 },
    });

    const result = await runAI({
      prompt: "x",
      outputSchema: z.object({ value: z.string() }),
    });

    expect(result.inputTokens).toBe(1_000_000);
    expect(result.outputTokens).toBe(1_000_000);
    expect(result.modelUsed).toBe("claude-sonnet-4-6");
    // Sonnet pricing: $3/MTok input + $15/MTok output = $18 = 1800 cents.
    expect(result.costCents).toBeCloseTo(1800, 0);
  });

  it("throws on schema mismatch", async () => {
    messagesCreate.mockResolvedValue({
      content: [{ type: "text", text: '{"summary":"ok","priority":"not-a-number"}' }],
      usage: { input_tokens: 10, output_tokens: 5 },
    });

    await expect(
      runAI({
        prompt: "x",
        outputSchema: z.object({ summary: z.string(), priority: z.number() }),
      }),
    ).rejects.toThrow(/schema validation/i);
  });

  it("throws when the model returns no JSON", async () => {
    messagesCreate.mockResolvedValue({
      content: [{ type: "text", text: "I cannot answer this question." }],
      usage: { input_tokens: 10, output_tokens: 5 },
    });

    await expect(
      runAI({
        prompt: "x",
        outputSchema: z.object({ value: z.string() }),
      }),
    ).rejects.toThrow(/parseable JSON/i);
  });

  it("tolerates raw JSON without code fences", async () => {
    messagesCreate.mockResolvedValue({
      content: [{ type: "text", text: '{"value":"raw"}' }],
      usage: { input_tokens: 10, output_tokens: 5 },
    });
    const result = await runAI({
      prompt: "x",
      outputSchema: z.object({ value: z.string() }),
    });
    expect(result.output.value).toBe("raw");
  });

  it("uses the requested model", async () => {
    messagesCreate.mockResolvedValue({
      content: [{ type: "text", text: '{"value":"ok"}' }],
      usage: { input_tokens: 1, output_tokens: 1 },
    });
    const result = await runAI({
      prompt: "x",
      outputSchema: z.object({ value: z.string() }),
      model: "claude-opus-4-7",
    });
    expect(result.modelUsed).toBe("claude-opus-4-7");
    const callArg = messagesCreate.mock.calls[0]?.[0] as { model?: string };
    expect(callArg.model).toBe("claude-opus-4-7");
  });
});
