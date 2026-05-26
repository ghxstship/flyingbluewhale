/**
 * RAG helpers for the document-grounded AI assistant (gap G-019).
 *
 * The embedding worker (separate ticket) populates document_chunks. At
 * query time, callers pass a question + scope, this module:
 *   1. embeds the question with the same model,
 *   2. cosine-search the top-K chunks in scope,
 *   3. returns the chunks for assembly into the Claude prompt.
 *
 * The cosine search is delegated to a Postgres RPC (`match_document_chunks`)
 * so pgvector can apply its index. That RPC is defined in a separate
 * migration once the embedding worker is ready; this module surfaces the
 * client-side shape + a deterministic stub for development.
 */

import type { LooseSupabase } from "@/lib/supabase/loose";

export type RagScope =
  | { kind: "global"; orgId: string }
  | { kind: "project"; orgId: string; projectId: string }
  | {
      kind: "document";
      orgId: string;
      projectId?: string;
      sourceType:
        | "deliverable"
        | "submittal"
        | "rfi"
        | "daily_log"
        | "spec_section"
        | "site_plan"
        | "transmittal"
        | "meeting_note"
        | "proposal"
        | "contract"
        | "file";
      sourceId: string;
    };

export type RagChunk = {
  id: string;
  source_type: string;
  source_id: string;
  chunk_text: string;
  chunk_ordinal: number;
  similarity: number;
};

export type SearchOptions = {
  /** Max chunks to return (default 8). */
  topK?: number;
  /** Floor on similarity (default 0.65). */
  minSimilarity?: number;
};

/**
 * Cosine-search the top-K chunks in scope. Returns chunks sorted desc by
 * similarity. The actual embedding + RPC is wired by the chat handler;
 * this is the type-safe entry point.
 */
export async function searchChunks(
  supabase: LooseSupabase,
  embedding: number[],
  scope: RagScope,
  opts: SearchOptions = {},
): Promise<RagChunk[]> {
  const topK = opts.topK ?? 8;
  const minSimilarity = opts.minSimilarity ?? 0.65;

  // The RPC is created in a follow-up migration once the embedding worker
  // ships. Until then we fall back to a deterministic empty result so the
  // calling code can compose without errors.
  const params: Record<string, unknown> = {
    query_embedding: embedding,
    match_top_k: topK,
    min_similarity: minSimilarity,
    org_filter: scope.orgId,
  };
  if (scope.kind === "project") {
    params.project_filter = scope.projectId;
  } else if (scope.kind === "document") {
    if (scope.projectId) params.project_filter = scope.projectId;
    params.source_type_filter = scope.sourceType;
    params.source_id_filter = scope.sourceId;
  }

  try {
    const result = await supabase.rpc("match_document_chunks", params);
    const rows = (result.data ?? []) as RagChunk[];
    return rows;
  } catch {
    // RPC not yet defined — return empty so callers can compose.
    return [];
  }
}

/** Format chunks as a Claude system-prompt context block, with citations. */
export function formatChunksForPrompt(chunks: RagChunk[]): string {
  if (chunks.length === 0) return "";
  const blocks = chunks.map(
    (c, i) =>
      `<source id="${i + 1}" type="${c.source_type}" source_id="${c.source_id}" chunk="${c.chunk_ordinal}">\n${c.chunk_text}\n</source>`,
  );
  return [
    "Use the sources below to answer. Cite every claim with the source id (e.g. [1], [2]). If the sources do not contain the answer, say so plainly.",
    "",
    ...blocks,
  ].join("\n");
}
