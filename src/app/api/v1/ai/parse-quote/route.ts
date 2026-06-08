import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

const Schema = z.object({
  text: z.string().min(10).max(20_000),
  currency: z.string().length(3).default("USD"),
});

const SYSTEM = `You are a procurement assistant for a live events production company.
Parse vendor quotes and extract structured requisition data.

Return ONLY valid JSON — no markdown, no prose:
{
  "title": string (≤120 chars, descriptive),
  "description": string (summary of what is being purchased),
  "estimated_cents": number (total in cents, integer, USD or specified currency),
  "vendor_name": string | null,
  "line_items": [
    { "description": string, "quantity": number, "unit_price_cents": number }
  ]
}

Rules:
- estimated_cents = sum of all line item totals; if taxes/shipping are listed, include them
- If a total is unclear, set estimated_cents to null
- line_items should capture each distinct product/service on the quote
- title should be concise and reflect the primary purchase (e.g., "Stage Lighting Package — EventCo")
- vendor_name: extract from quote if present, otherwise null`;

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "ai:parse-quote"), ...RATE_BUDGETS.ai });
  if (!rl.ok) return apiError("rate_limited", "AI rate limit reached; try again shortly");

  if (!env.ANTHROPIC_API_KEY) {
    return apiError("service_unavailable", "ANTHROPIC_API_KEY is not configured");
  }

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async () => ({}));
  if (guard instanceof Response) return guard;

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  let raw: string;
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Currency: ${input.currency}\n\nVendor quote:\n${input.text}`,
        },
      ],
    });
    const block = msg.content[0];
    if (!block || block.type !== "text") {
      return apiError("internal", "Unexpected AI response");
    }
    raw = block.text.trim();
  } catch (e) {
    return apiError("internal", e instanceof Error ? e.message : "AI request failed");
  }

  try {
    const clean = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(clean);
    return apiOk(parsed);
  } catch {
    return apiError("internal", "AI returned malformed JSON; please try again");
  }
}
