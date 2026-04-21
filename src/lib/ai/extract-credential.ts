import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import { log } from "@/lib/log";
import { CoiSchema, type CoiData } from "./schemas/coi";
import { W9Schema, type W9Data } from "./schemas/w9";

/**
 * AI-assisted credential extraction — Opportunity #10.
 *
 * Given OCR'd / extracted text from a PDF, call Anthropic with a strict
 * system prompt and a JSON-only response shape. Validate against the
 * per-doc Zod schema; reject on any mismatch.
 *
 * Returns `{ fields, confidence }` for downstream routing into the
 * credentials table. `confidence < 0.9` flags a human-review queue.
 *
 * This is intentionally a plain text prompt + JSON parse rather than
 * Anthropic's native tool-use — keeps the surface small + avoids a
 * dependency on a specific tool-use format. Upgrade to tool-use when
 * we need structured multi-turn behavior.
 */

const SYSTEM_COI = `You extract fields from a US Certificate of Insurance (ACORD 25 or similar).
Respond with ONLY a JSON object matching this shape, no prose:
{
  "insured": {"name": "...", "address": "..."},
  "carrier": "...",
  "policy_number": "...",
  "effective_date": "YYYY-MM-DD",
  "expiry_date": "YYYY-MM-DD",
  "coverages": [{"kind": "general_liability|auto|umbrella|workers_comp", "limit": "$X,XXX,XXX per occurrence"}],
  "additional_insured": ["..."],
  "_confidence": 0.0-1.0
}
Use "unknown" for missing fields. Confidence should reflect extraction certainty.`;

const SYSTEM_W9 = `You extract fields from a US IRS Form W-9.
Respond with ONLY a JSON object matching this shape, no prose:
{
  "legal_name": "...",
  "business_name": "...",
  "tax_classification": "individual_sole_proprietor|c_corporation|s_corporation|partnership|trust_estate|llc|other",
  "tin": "XXX-XX-XXXX or XX-XXXXXXX",
  "tin_type": "ssn|ein",
  "address": {"line1": "...", "line2": "...", "city": "...", "state": "XX", "postal_code": "XXXXX"},
  "signed_date": "YYYY-MM-DD",
  "exempt_payee_codes": [],
  "_confidence": 0.0-1.0
}`;

type ExtractResult<T> = { fields: T; confidence: number } | { error: string };

async function callAnthropic(systemPrompt: string, userText: string): Promise<{ json: Record<string, unknown>; confidence: number } | { error: string }> {
  if (!env.ANTHROPIC_API_KEY) return { error: "ANTHROPIC_API_KEY not configured" };
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  try {
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userText.slice(0, 60_000) }],
    });
    const text = res.content
      .filter((c) => c.type === "text")
       
      .map((c) => (c as any).text as string)
      .join("");
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { error: "model did not return JSON" };
    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    const confRaw = parsed._confidence;
    const confidence = typeof confRaw === "number" ? confRaw : 0.75;
    delete parsed._confidence;
    return { json: parsed, confidence };
  } catch (e) {
    log.warn("ai.extract.anthropic_failed", { err: e instanceof Error ? e.message : String(e) });
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function extractCoi(text: string): Promise<ExtractResult<CoiData>> {
  const call = await callAnthropic(SYSTEM_COI, text);
  if ("error" in call) return call;
  const parsed = CoiSchema.safeParse(call.json);
  if (!parsed.success) return { error: `schema: ${parsed.error.issues.map((i) => i.message).join("; ")}` };
  return { fields: parsed.data, confidence: call.confidence };
}

export async function extractW9(text: string): Promise<ExtractResult<W9Data>> {
  const call = await callAnthropic(SYSTEM_W9, text);
  if ("error" in call) return call;
  const parsed = W9Schema.safeParse(call.json);
  if (!parsed.success) return { error: `schema: ${parsed.error.issues.map((i) => i.message).join("; ")}` };
  return { fields: parsed.data, confidence: call.confidence };
}
