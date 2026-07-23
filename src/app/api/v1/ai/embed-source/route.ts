import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { indexSource } from "@/lib/ai/embedding-worker";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

/**
 * POST /api/v1/ai/embed-source
 *
 * Index a single document into the RAG corpus. Caller supplies the
 * rendered text (after PDF/Markdown extraction) so this endpoint stays
 * provider-agnostic. The embedding worker picks OpenAI or Voyage based
 * on the configured env vars.
 *
 * Body: { source_type, source_id, project_id?, text }
 *
 * Idempotent: re-embedding the same (org, source_type, source_id) at the
 * same model AND unchanged text returns inserted: 0; edited text re-embeds.
 *
 * `sop` + `event_guide` require migration 20260723150000_event_corpus_links
 * (enum extension); pre-migration the insert fails per-document and the
 * caller counts it as skipped.
 */

const BodySchema = z.object({
  source_type: z.enum([
    "deliverable",
    "submittal",
    "rfi",
    "daily_log",
    "spec_section",
    "site_plan",
    "transmittal",
    "meeting_note",
    "proposal",
    "contract",
    "file",
    "kb_article",
    "sop",
    "event_guide",
  ]),
  source_id: z.string().uuid(),
  project_id: z.string().uuid().optional(),
  text: z.string().min(1).max(200_000),
});

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const rl = await ratelimit({ key: keyFromRequest(req, "embed-source"), ...RATE_BUDGETS.export });
  if (!rl.ok) return apiError("rate_limited", "Embedding rate limit reached");

  return withAuth(async (session) => {
    const parsed = await parseJson(req, BodySchema);
    if (parsed instanceof Response) return parsed;

    const result = await indexSource({
      orgId: session.orgId,
      projectId: parsed.project_id ?? null,
      sourceType: parsed.source_type,
      sourceId: parsed.source_id,
      text: parsed.text,
    });

    if ("error" in result) return apiError("internal", result.error);
    return apiOk({ inserted: result.inserted });
  });
}
