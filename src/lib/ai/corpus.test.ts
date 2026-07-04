/**
 * Competitive-scan 2026-07 delta — KB articles join the RAG corpus.
 *
 * Guards the corpus surface contract: kb_article is a reindexable kind with a
 * human label, the walker renders kb_articles rows to embeddable text
 * (org-scoped, never project-scoped), and the status rollup marks the kind
 * reindexable. If someone removes the walker or the kind, the grounded
 * Copilot silently loses company-knowledge answers — these tests make that
 * loud instead.
 */
import { describe, it, expect } from "vitest";
import type { LooseSupabase } from "@/lib/supabase/loose";
import {
  REINDEXABLE_SOURCE_KINDS,
  SOURCE_KIND_LABEL,
  rollupChunks,
  walkOrgSources,
} from "./corpus";

describe("kb_article corpus kind", () => {
  it("is a reindexable source kind with a label", () => {
    expect(REINDEXABLE_SOURCE_KINDS).toContain("kb_article");
    expect(SOURCE_KIND_LABEL.kb_article).toBe("Knowledge Base");
  });

  it("rollupChunks marks kb_article chunks reindexable", () => {
    const rows = rollupChunks([
      { source_type: "kb_article", source_id: "a1", refreshed_at: "2026-07-04T00:00:00Z" },
      { source_type: "file", source_id: "f1", refreshed_at: null },
    ]);
    const kb = rows.find((r) => r.source_type === "kb_article");
    const file = rows.find((r) => r.source_type === "file");
    expect(kb?.reindexable).toBe(true);
    expect(kb?.label).toBe("Knowledge Base");
    expect(file?.reindexable).toBe(false);
  });
});

/**
 * Minimal LooseSupabase stub: .from(table) returns a thenable filter-builder
 * resolving to { data } for that table, mirroring how walkOrgSources consumes
 * the client (select → eq → [is] → limit → await).
 */
function stubSupabase(byTable: Record<string, unknown[]>): LooseSupabase {
  const builder = (table: string) => {
    const result = { data: byTable[table] ?? [] };
    const b: Record<string, unknown> = {};
    for (const m of ["select", "eq", "is", "limit"]) b[m] = () => b;
    (b as { then: unknown }).then = (resolve: (v: unknown) => unknown) => resolve(result);
    return b;
  };
  return { from: builder } as unknown as LooseSupabase;
}

describe("walkOrgSources — kb_articles walker", () => {
  it("renders title + body + tags into embeddable text, org-scoped", async () => {
    const supabase = stubSupabase({
      kb_articles: [
        {
          id: "kb-1",
          title: "Radio etiquette",
          body_markdown: "Keep channel 1 clear for show calls.",
          tags: ["comms", "show-day"],
        },
        // Empty article — must be skipped (endpoint rejects empty bodies).
        { id: "kb-2", title: null, body_markdown: "   ", tags: [] },
      ],
    });
    const sources = await walkOrgSources(supabase, "org-1");
    const kb = sources.filter((s) => s.source_type === "kb_article");
    expect(kb).toHaveLength(1);
    const first = kb[0]!;
    expect(first.source_id).toBe("kb-1");
    expect(first.project_id).toBeNull();
    expect(first.text).toContain("Radio etiquette");
    expect(first.text).toContain("Keep channel 1 clear");
    expect(first.text).toContain("Tags: comms, show-day");
  });

  it("tolerates malformed tags jsonb without throwing", async () => {
    const supabase = stubSupabase({
      kb_articles: [{ id: "kb-3", title: "Anchor", body_markdown: "Body.", tags: { not: "an array" } }],
    });
    const sources = await walkOrgSources(supabase, "org-1");
    const kb = sources.find((s) => s.source_id === "kb-3");
    expect(kb?.text).toBe("Anchor\n\nBody.");
  });
});
