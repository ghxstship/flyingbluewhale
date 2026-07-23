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
import { kbVerification, isEventSyncable } from "@/lib/kb/verification";

/**
 * Source kinds this surface knows how to *walk* (enumerate text + POST to
 * embed-source). A subset of the full `embedding_source_type` enum — kinds
 * with org-walkable renderable text. The endpoint accepts more kinds; add a
 * walker below as those tables gain renderable text.
 *
 * L-P5 (knowledge grounding seam) additions:
 * - `kb_article`  — VERIFIED articles only (verification honesty: unverified
 *   knowledge never enters the corpus). Org-wide chunks; event visibility is
 *   gated by project_corpus_links at retrieval time.
 * - `sop`         — PUBLISHED SOPs only. Org standards, visible in every
 *   event scope.
 * - `event_guide` — per-project Boarding Pass guides; natively event-scoped
 *   (chunks carry the guide's project_id).
 * The latter two need migration 20260723150000 (enum extension) applied.
 */
export const REINDEXABLE_SOURCE_KINDS = [
  "deliverable",
  "submittal",
  "rfi",
  "kb_article",
  "sop",
  "event_guide",
] as const;
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
  kb_article: "Knowledge Articles",
  sop: "SOPs",
  event_guide: "Event Guides",
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
 * Harvest every human-readable string out of a JSONB payload (guide configs,
 * SOP step arrays) in document order. Schema-drift tolerant: no key coupling,
 * just the strings. Booleans/numbers are skipped — they carry no retrievable
 * prose.
 */
export function jsonTextHarvest(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    const s = value.trim();
    if (s.length > 0) out.push(s);
  } else if (Array.isArray(value)) {
    for (const v of value) jsonTextHarvest(v, out);
  } else if (value && typeof value === "object") {
    for (const v of Object.values(value)) jsonTextHarvest(v, out);
  }
  return out;
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

  // Knowledge articles — VERIFIED only (verification honesty: unverified or
  // stale knowledge never enters the corpus). Org-wide: project_id stays
  // null; event visibility is decided at retrieval time by
  // project_corpus_links (match_event_chunks).
  const now = Date.now();
  const { data: articles } = await supabase
    .from("kb_articles")
    .select("id, title, body_markdown, verified_at, review_interval_days")
    .eq("org_id", orgId)
    .not("verified_at", "is", null)
    .limit(5000);
  for (const a of (articles ?? []) as {
    id: string;
    title: string | null;
    body_markdown: string | null;
    verified_at: string | null;
    review_interval_days: number | null;
  }[]) {
    if (!isEventSyncable(kbVerification(a.verified_at, a.review_interval_days ?? 180, now))) continue;
    const text = joinText(a.title, a.body_markdown);
    if (text) out.push({ source_type: "kb_article", source_id: a.id, project_id: null, text });
  }

  // SOPs — PUBLISHED only. Org standards: org-wide chunks, visible in every
  // event scope.
  const { data: sops } = await supabase
    .from("sops")
    .select("id, code, title, purpose, steps, sop_state")
    .eq("org_id", orgId)
    .eq("sop_state", "published")
    .is("deleted_at", null)
    .limit(5000);
  for (const s of (sops ?? []) as {
    id: string;
    code: string | null;
    title: string | null;
    purpose: string | null;
    steps: unknown;
  }[]) {
    const text = joinText(s.code, s.title, s.purpose, jsonTextHarvest(s.steps).join("\n"));
    if (text) out.push({ source_type: "sop", source_id: s.id, project_id: null, text });
  }

  // Event guides (Boarding Pass KBYG) — natively event-scoped: chunks carry
  // the guide's project_id, so they surface only in that event's corpus.
  const { data: guides } = await supabase
    .from("event_guides")
    .select("id, project_id, persona, config")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .limit(5000);
  for (const g of (guides ?? []) as {
    id: string;
    project_id: string | null;
    persona: string | null;
    config: unknown;
  }[]) {
    const text = joinText(
      g.persona ? `Event guide (${g.persona.replace(/_/g, " ")})` : "Event guide",
      jsonTextHarvest(g.config).join("\n"),
    );
    // A guide with no prose beyond the synthetic heading isn't retrievable.
    if (jsonTextHarvest(g.config).length > 0) {
      out.push({ source_type: "event_guide", source_id: g.id, project_id: g.project_id, text });
    }
  }

  return out;
}
