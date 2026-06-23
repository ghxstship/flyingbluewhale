/**
 * RAG corpus operator surface — shared (NON-server) lib.
 *
 * Deferred item F2: the embed-source endpoint + document_chunks table existed
 * but nothing walked the org's source rows or surfaced index health to an
 * operator. This module holds the enum tuples + label maps + the read helpers
 * that the /studio/ai/corpus status page renders against. The mutating side
 * (the reindex walk) lives in the sibling `actions.ts` ("use server").
 *
 * No "server-only" import here — the client island (ReindexButton) and the
 * server page both import from this module, so it must stay isomorphic.
 */

import type { LooseSupabase } from "@/lib/supabase/loose";

/**
 * Source kinds this surface knows how to *walk* (enumerate text + POST to
 * embed-source). A subset of the full `embedding_source_type` enum — only the
 * three the F2 brief calls out have org-walkable text today. The endpoint
 * accepts more kinds; add a walker below as those tables gain renderable text.
 */
export const REINDEXABLE_SOURCE_KINDS = ["deliverable", "submittal", "rfi"] as const;
export type ReindexableSourceKind = (typeof REINDEXABLE_SOURCE_KINDS)[number];

export const SOURCE_KIND_LABEL: Record<string, string> = {
  deliverable: "Deliverables",
  submittal: "Submittals",
  rfi: "RFIs",
  daily_log: "Daily Logs",
  spec_section: "Spec Sections",
  site_plan: "Site Plans",
  transmittal: "Transmittals",
  meeting_note: "Meeting Notes",
  proposal: "Proposals",
  contract: "Contracts",
  file: "Files",
};

export function sourceKindLabel(kind: string): string {
  return SOURCE_KIND_LABEL[kind] ?? kind.replace(/_/g, " ");
}

/** One row in the corpus status table — document_chunks rolled up by source_type. */
export type CorpusSourceRow = {
  /** Stable key — the source_type string. */
  id: string;
  source_type: string;
  label: string;
  chunk_count: number;
  /** Distinct source_id values indexed under this kind. */
  document_count: number;
  /** Max(refreshed_at) across this kind's chunks. */
  refreshed_at: string | null;
  /** Whether this surface can reindex this kind on demand. */
  reindexable: boolean;
};

/**
 * Group document_chunks by source_type into status rows. Pure — the page does
 * the fetch and passes the raw rows in so this stays trivially testable.
 */
export function rollupChunks(
  chunks: { source_type: string; source_id: string; refreshed_at: string | null }[],
): CorpusSourceRow[] {
  const reindexable = new Set<string>(REINDEXABLE_SOURCE_KINDS);
  const acc = new Map<string, { chunks: number; ids: Set<string>; latest: string | null }>();
  for (const c of chunks) {
    const e = acc.get(c.source_type) ?? { chunks: 0, ids: new Set<string>(), latest: null };
    e.chunks += 1;
    if (c.source_id) e.ids.add(c.source_id);
    if (c.refreshed_at && (!e.latest || c.refreshed_at > e.latest)) e.latest = c.refreshed_at;
    acc.set(c.source_type, e);
  }
  const rows: CorpusSourceRow[] = [...acc.entries()].map(([source_type, e]) => ({
    id: source_type,
    source_type,
    label: sourceKindLabel(source_type),
    chunk_count: e.chunks,
    document_count: e.ids.size,
    refreshed_at: e.latest,
    reindexable: reindexable.has(source_type),
  }));
  rows.sort((a, b) => b.chunk_count - a.chunk_count);
  return rows;
}

/** A single source document to feed the embed-source endpoint. */
export type WalkedSource = {
  source_type: ReindexableSourceKind;
  source_id: string;
  project_id: string | null;
  text: string;
};

function joinText(...parts: (string | null | undefined)[]): string {
  return parts
    .map((p) => (p ?? "").trim())
    .filter((p) => p.length > 0)
    .join("\n\n");
}

/**
 * Enumerate the org's reindexable source rows and render each to plain text.
 * Uses the caller's RLS-scoped client (org rows only). Soft-deleted
 * deliverables are skipped. Returns only documents with non-empty text — the
 * endpoint rejects empty bodies.
 */
export async function walkOrgSources(
  supabase: LooseSupabase,
  orgId: string,
): Promise<WalkedSource[]> {
  const out: WalkedSource[] = [];

  // Deliverables (doc-specs) — title + scope are the human-meaningful text.
  const { data: deliverables } = await supabase
    .from("deliverables")
    .select("id, project_id, title, scope")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .limit(5000);
  for (const d of (deliverables ?? []) as {
    id: string;
    project_id: string | null;
    title: string | null;
    scope: string | null;
  }[]) {
    const text = joinText(d.title, d.scope);
    if (text) out.push({ source_type: "deliverable", source_id: d.id, project_id: d.project_id, text });
  }

  // Submittals — code + title + spec section.
  const { data: submittals } = await supabase
    .from("submittals")
    .select("id, project_id, code, title, spec_section")
    .eq("org_id", orgId)
    .limit(5000);
  for (const s of (submittals ?? []) as {
    id: string;
    project_id: string | null;
    code: string | null;
    title: string | null;
    spec_section: string | null;
  }[]) {
    const text = joinText(s.code, s.title, s.spec_section ? `Spec section: ${s.spec_section}` : null);
    if (text) out.push({ source_type: "submittal", source_id: s.id, project_id: s.project_id, text });
  }

  // RFIs — subject + question + official answer carry the retrievable content.
  const { data: rfis } = await supabase
    .from("rfis")
    .select("id, project_id, code, subject, question, official_answer")
    .eq("org_id", orgId)
    .limit(5000);
  for (const r of (rfis ?? []) as {
    id: string;
    project_id: string | null;
    code: string | null;
    subject: string | null;
    question: string | null;
    official_answer: string | null;
  }[]) {
    const text = joinText(
      r.code,
      r.subject,
      r.question ? `Q: ${r.question}` : null,
      r.official_answer ? `A: ${r.official_answer}` : null,
    );
    if (text) out.push({ source_type: "rfi", source_id: r.id, project_id: r.project_id, text });
  }

  return out;
}
