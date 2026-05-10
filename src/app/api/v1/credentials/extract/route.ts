import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { extractCoi, extractW9 } from "@/lib/ai/extract-credential";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

/**
 * POST /api/v1/credentials/extract — Opportunity #10.
 *
 * Accepts { kind: "coi"|"w9", text } — runs AI extraction, returns the
 * validated fields + confidence. Callers (vendor portal + console
 * admin) use the result to pre-fill the credentials row before insert.
 * The actual INSERT happens via the existing credentials write path
 * once the operator confirms.
 */

const PostSchema = z.object({
  kind: z.enum(["coi", "w9"]),
  text: z.string().min(10).max(60_000),
});

export async function POST(req: NextRequest) {
  // Rate-limit on the AI bucket (30/min/user). This endpoint hits the
  // Anthropic API for every call (real $ per request), so a misbehaved
  // client could rack up cost quickly without the gate.
  const rl = await ratelimit({
    key: keyFromRequest(req, "ai:credentials-extract"),
    ...RATE_BUDGETS.ai,
  });
  if (!rl.ok) return apiError("rate_limited", "Too many extraction requests");

  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;
  return withAuth(async () => {
    const result = input.kind === "coi" ? await extractCoi(input.text) : await extractW9(input.text);
    if ("error" in result) return apiError("internal", result.error);
    return apiOk({
      kind: input.kind,
      fields: result.fields,
      confidence: result.confidence,
      needs_review: result.confidence < 0.9,
    });
  });
}
