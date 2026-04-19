import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { extractCoi, extractW9 } from "@/lib/ai/extract-credential";

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
  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;
  return withAuth(async () => {
    const result = input.kind === "coi"
      ? await extractCoi(input.text)
      : await extractW9(input.text);
    if ("error" in result) return apiError("internal", result.error);
    return apiOk({
      kind: input.kind,
      fields: result.fields,
      confidence: result.confidence,
      needs_review: result.confidence < 0.9,
    });
  });
}
