import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { log } from "@/lib/log";

/**
 * Embedding worker — gap G-019 runtime.
 *
 * Walks the project corpus (deliverables, submittals, rfis, daily_logs,
 * spec_sections, transmittals, proposals, contracts) and writes text
 * chunks + embeddings into document_chunks for RAG.
 *
 * Provider: OpenAI text-embedding-3-small (1536d). Voyage AI is the
 * preferred provider per the rag.ts default of "voyage-3-large" — but
 * voyage-3-large is also 1024d (downscaled) or 1536d (full), and we
 * standardize on 1536. Provider switch is one env var.
 *
 * Designed to run on-demand (after a new doc is created) or as a
 * scheduled batch. Idempotent: skips rows already at the latest
 * embedding_model.
 */

const EMBED_DIM = 1536;
const CHUNK_SIZE = 1200; // ~300 tokens at 4 chars/token avg
const CHUNK_OVERLAP = 200;

type EmbedProvider = "openai" | "voyage" | "anthropic_doc_only";

function pickProvider(): { provider: EmbedProvider; key: string | null; model: string } {
  // OPENAI_API_KEY + VOYAGE_API_KEY aren't part of the canonical env yet;
  // both are read straight from process.env when present. Either one set
  // in .env.local activates the worker.
  const openai = process.env.OPENAI_API_KEY;
  if (openai) {
    return { provider: "openai", key: openai, model: "text-embedding-3-small" };
  }
  const voyage = process.env.VOYAGE_API_KEY;
  if (voyage) return { provider: "voyage", key: voyage, model: "voyage-3-large" };
  return { provider: "anthropic_doc_only", key: null, model: "anthropic-doc-fallback" };
}

/**
 * Chunk a long text into overlapping windows. Naïve char-based; a more
 * faithful tokenizer would respect word boundaries, but this is good enough
 * for short-form construction documents (RFIs/submittals avg < 4K chars).
 */
export function chunkText(text: string, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  if (!text || text.length === 0) return [];
  if (text.length <= size) return [text];
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size - overlap;
  }
  return chunks;
}

async function embedOpenAI(texts: string[], apiKey: string, model: string): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ input: texts, model }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI embeddings failed: ${res.status} ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data.map((d) => d.embedding);
}

async function embedVoyage(texts: string[], apiKey: string, model: string): Promise<number[][]> {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ input: texts, model, input_type: "document", output_dimension: EMBED_DIM }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Voyage embeddings failed: ${res.status} ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data.map((d) => d.embedding);
}

export async function embedTexts(texts: string[]): Promise<number[][] | { error: string }> {
  const { provider, key, model } = pickProvider();
  if (provider === "anthropic_doc_only" || !key) {
    return {
      error: "No embedding provider configured. Set OPENAI_API_KEY or VOYAGE_API_KEY in .env.local.",
    };
  }
  if (texts.length === 0) return [];
  try {
    if (provider === "openai") return await embedOpenAI(texts, key, model);
    return await embedVoyage(texts, key, model);
  } catch (e) {
    log.error("embedding.failed", { provider, err: e instanceof Error ? e.message : String(e) });
    return { error: e instanceof Error ? e.message : "Embedding call failed" };
  }
}

/**
 * Index a single source row. The caller passes the rendered text content
 * (already extracted from PDF / Markdown). source_type + source_id link
 * back to the canonical row.
 */
export async function indexSource(args: {
  orgId: string;
  projectId: string | null;
  sourceType: string;
  sourceId: string;
  text: string;
}): Promise<{ inserted: number } | { error: string }> {
  const { orgId, projectId, sourceType, sourceId, text } = args;
  const supabase = createServiceClient() as unknown as LooseSupabase;
  const { provider, model } = pickProvider();

  // Skip if already indexed at this model.
  const { data: existing } = await supabase
    .from("document_chunks")
    .select("id")
    .eq("org_id", orgId)
    .eq("source_type", sourceType)
    .eq("source_id", sourceId)
    .eq("embedding_model", model)
    .limit(1);
  if ((existing as { id: string }[] | null)?.length) {
    return { inserted: 0 };
  }

  const chunks = chunkText(text);
  if (chunks.length === 0) return { inserted: 0 };

  const result = await embedTexts(chunks);
  if (Array.isArray(result)) {
    // Replace any prior embedding (different model) for this source.
    await supabase
      .from("document_chunks")
      .delete()
      .eq("org_id", orgId)
      .eq("source_type", sourceType)
      .eq("source_id", sourceId);

    for (let i = 0; i < chunks.length; i++) {
      await supabase.from("document_chunks").insert({
        org_id: orgId,
        project_id: projectId,
        source_type: sourceType,
        source_id: sourceId,
        chunk_text: chunks[i],
        chunk_ordinal: i,
        embedding_model: model,
        embedding: result[i],
        token_count: Math.round(chunks[i].length / 4),
      });
    }
    return { inserted: chunks.length };
  }
  log.warn("embedding.skipped", { provider, sourceType, sourceId, err: result.error });
  return { error: result.error };
}
