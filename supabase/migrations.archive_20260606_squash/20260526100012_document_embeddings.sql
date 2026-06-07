-- Round 47 — Document-grounded AI (pgvector + embeddings)
--
-- Per construction-pm-parity Wave 4.2 (gap G-019). RAG over the project's
-- canonical documents (deliverables, submittals, rfis, daily_logs, spec_sections,
-- site_plans extracted text). Procore Copilot, ACC, Kahua Noa, Newforma Vojo
-- all shipped in 2026 — we are on the same wave.
--
-- Storage spine:
--   - pgvector extension enabled.
--   - document_chunks: source_type + source_id + text + embedding(1536).
--     Used as the vector index for RAG.
--   - ai_messages_cited_chunks: per-message citation set (which chunks
--     grounded the answer).
--   - ai_conversations extended with project_id + ai_scope ('global' |
--     'project' | 'document').

BEGIN;

-- pgvector — used for embedding similarity search. Anthropic embeddings
-- (text-embedding-3-small) are 1536 dimensions; we standardize on that.
CREATE EXTENSION IF NOT EXISTS vector;

DO $$ BEGIN
  CREATE TYPE public.ai_scope AS ENUM (
    'global',
    'project',
    'document'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.embedding_source_type AS ENUM (
    'deliverable',
    'submittal',
    'rfi',
    'daily_log',
    'spec_section',
    'site_plan',
    'transmittal',
    'meeting_note',
    'proposal',
    'contract',
    'file'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- 1. document_chunks — the vector index
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.document_chunks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id      uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  source_type     public.embedding_source_type NOT NULL,
  source_id       uuid NOT NULL,
  -- Chunk text — typically 200-500 token window with ~50 token overlap.
  chunk_text      text NOT NULL,
  chunk_ordinal   int NOT NULL DEFAULT 0,
  -- Embedding model identifier so re-embeds can detect stale rows.
  embedding_model text NOT NULL DEFAULT 'voyage-3-large',
  -- 1536 is the dimension for voyage-3-large + OpenAI text-embedding-3-small.
  -- Anthropic-recommended; aligns with most providers.
  embedding       vector(1536),
  token_count     int,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  refreshed_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS document_chunks_org_idx ON public.document_chunks (org_id);
CREATE INDEX IF NOT EXISTS document_chunks_project_idx ON public.document_chunks (project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS document_chunks_source_idx ON public.document_chunks (source_type, source_id);
CREATE INDEX IF NOT EXISTS document_chunks_model_idx ON public.document_chunks (embedding_model);

-- Vector index. IVFFLAT is the right starting point for <10M chunks.
-- Lists count chosen by the rule of thumb: sqrt(rows). At 1M chunks, 100
-- lists. At project boot we will be tiny, but the index builds lazily.
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
  ON public.document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

COMMENT ON TABLE public.document_chunks IS
  'RAG vector store. One row per ~300-token chunk of a source doc. embedding column is vector(1536) — cosine similarity used at query time.';

-- =============================================================================
-- 2. ai_conversations — extend with project scope
-- =============================================================================

ALTER TABLE public.ai_conversations
  ADD COLUMN IF NOT EXISTS ai_scope public.ai_scope,
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS scope_source_type public.embedding_source_type,
  ADD COLUMN IF NOT EXISTS scope_source_id uuid;

CREATE INDEX IF NOT EXISTS ai_conversations_project_idx
  ON public.ai_conversations (project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ai_conversations_scope_idx
  ON public.ai_conversations (ai_scope) WHERE ai_scope IS NOT NULL;

-- =============================================================================
-- 3. ai_message_citations — which chunks grounded the answer
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ai_message_citations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  ai_message_id   uuid NOT NULL REFERENCES public.ai_messages(id) ON DELETE CASCADE,
  document_chunk_id uuid NOT NULL REFERENCES public.document_chunks(id) ON DELETE CASCADE,
  -- Similarity score returned by the cosine search (0..1, higher is better).
  similarity      numeric(6,5),
  ordinal         int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ai_message_id, document_chunk_id)
);

CREATE INDEX IF NOT EXISTS ai_message_citations_message_idx ON public.ai_message_citations (ai_message_id);
CREATE INDEX IF NOT EXISTS ai_message_citations_chunk_idx ON public.ai_message_citations (document_chunk_id);
CREATE INDEX IF NOT EXISTS ai_message_citations_org_idx ON public.ai_message_citations (org_id);

COMMENT ON TABLE public.ai_message_citations IS
  'Per-message citation set. UI surfaces source links so users can audit every claim the assistant makes.';

-- =============================================================================
-- 4. RLS
-- =============================================================================

ALTER TABLE public.document_chunks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_message_citations  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS document_chunks_org_select ON public.document_chunks;
CREATE POLICY document_chunks_org_select ON public.document_chunks
  FOR SELECT USING (private.is_org_member(org_id));
-- Writes happen via the embedding worker (service role); no user-facing
-- write policy.

DROP POLICY IF EXISTS ai_message_citations_org_select ON public.ai_message_citations;
CREATE POLICY ai_message_citations_org_select ON public.ai_message_citations
  FOR SELECT USING (private.is_org_member(org_id));
-- Writes happen via the chat handler (service role).

COMMIT;
