/**
 * L-P5 — event-scoped retrieval contract (the knowledge grounding seam).
 *
 * Guards two things:
 *   1. `searchChunks` routes each RagScope to the right RPC with the right
 *      filters — the project scope rides `match_event_chunks` (org + event
 *      union) and degrades to the legacy strict project filter while the
 *      migration is pending; global/document scopes are untouched.
 *   2. `isChunkVisibleInEventScope` — the pure mirror of the RPC's WHERE
 *      clause — enforces: the event's own chunks and org-wide sources are
 *      visible, event-linked knowledge is visible, another event's chunks
 *      are NEVER visible, unlinked knowledge is NEVER visible.
 */
import { describe, expect, it, vi } from "vitest";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { isChunkVisibleInEventScope, searchChunks, type RagChunk } from "./rag";

const ORG = "11111111-1111-4111-8111-111111111111";
const EVENT = "22222222-2222-4222-8222-222222222222";
const OTHER_EVENT = "33333333-3333-4333-8333-333333333333";
const EMBEDDING = [0.1, 0.2, 0.3];

const CHUNK: RagChunk = {
  id: "c1",
  source_type: "kb_article",
  source_id: "a1",
  chunk_text: "Radios are checked out at the production office.",
  chunk_ordinal: 0,
  similarity: 0.9,
};

function fakeSupabase(handler: (fn: string, params: Record<string, unknown>) => { data?: unknown; error?: unknown }) {
  const rpc = vi.fn(async (fn: string, params: Record<string, unknown>) => handler(fn, params));
  return { client: { rpc } as unknown as LooseSupabase, rpc };
}

describe("searchChunks scope routing", () => {
  it("project scope calls match_event_chunks with org + project filters", async () => {
    const { client, rpc } = fakeSupabase(() => ({ data: [CHUNK] }));
    const rows = await searchChunks(client, EMBEDDING, { kind: "project", orgId: ORG, projectId: EVENT });
    expect(rows).toEqual([CHUNK]);
    expect(rpc).toHaveBeenCalledTimes(1);
    const [fn, params] = rpc.mock.calls[0]!;
    expect(fn).toBe("match_event_chunks");
    expect(params).toMatchObject({ org_filter: ORG, project_filter: EVENT });
  });

  it("project scope falls back to the legacy strict filter while the migration is pending", async () => {
    const { client, rpc } = fakeSupabase((fn) =>
      fn === "match_event_chunks" ? { error: { message: "function does not exist" } } : { data: [CHUNK] },
    );
    const rows = await searchChunks(client, EMBEDDING, { kind: "project", orgId: ORG, projectId: EVENT });
    expect(rows).toEqual([CHUNK]);
    expect(rpc).toHaveBeenCalledTimes(2);
    const [fn, params] = rpc.mock.calls[1]!;
    expect(fn).toBe("match_document_chunks");
    expect(params).toMatchObject({ org_filter: ORG, project_filter: EVENT });
  });

  it("global scope stays on match_document_chunks with no project filter", async () => {
    const { client, rpc } = fakeSupabase(() => ({ data: [] }));
    await searchChunks(client, EMBEDDING, { kind: "global", orgId: ORG });
    expect(rpc).toHaveBeenCalledTimes(1);
    const [fn, params] = rpc.mock.calls[0]!;
    expect(fn).toBe("match_document_chunks");
    expect(params).toMatchObject({ org_filter: ORG });
    expect(params).not.toHaveProperty("project_filter");
  });

  it("document scope stays on match_document_chunks with source filters", async () => {
    const { client, rpc } = fakeSupabase(() => ({ data: [] }));
    await searchChunks(client, EMBEDDING, {
      kind: "document",
      orgId: ORG,
      sourceType: "kb_article",
      sourceId: "a1",
    });
    const [fn, params] = rpc.mock.calls[0]!;
    expect(fn).toBe("match_document_chunks");
    expect(params).toMatchObject({ org_filter: ORG, source_type_filter: "kb_article", source_id_filter: "a1" });
  });
});

describe("isChunkVisibleInEventScope (the RPC WHERE-clause contract)", () => {
  const linked = new Set(["linked-article"]);

  it("the event's own chunks are visible", () => {
    expect(
      isChunkVisibleInEventScope({ project_id: EVENT, source_type: "rfi", source_id: "r1" }, EVENT, linked),
    ).toBe(true);
  });

  it("org-wide non-knowledge chunks (SOPs, contracts) are visible in every event scope", () => {
    expect(isChunkVisibleInEventScope({ project_id: null, source_type: "sop", source_id: "s1" }, EVENT, linked)).toBe(
      true,
    );
    expect(
      isChunkVisibleInEventScope({ project_id: null, source_type: "contract", source_id: "k1" }, EVENT, linked),
    ).toBe(true);
  });

  it("another event's chunks are NEVER visible, whatever the source type", () => {
    expect(
      isChunkVisibleInEventScope({ project_id: OTHER_EVENT, source_type: "rfi", source_id: "r2" }, EVENT, linked),
    ).toBe(false);
    expect(
      isChunkVisibleInEventScope(
        { project_id: OTHER_EVENT, source_type: "event_guide", source_id: "g1" },
        EVENT,
        linked,
      ),
    ).toBe(false);
    // Even a linked knowledge id embedded under another project stays out.
    expect(
      isChunkVisibleInEventScope(
        { project_id: OTHER_EVENT, source_type: "kb_article", source_id: "linked-article" },
        EVENT,
        linked,
      ),
    ).toBe(false);
  });

  it("knowledge articles are visible only when linked to THIS event", () => {
    expect(
      isChunkVisibleInEventScope(
        { project_id: null, source_type: "kb_article", source_id: "linked-article" },
        EVENT,
        linked,
      ),
    ).toBe(true);
    expect(
      isChunkVisibleInEventScope(
        { project_id: null, source_type: "kb_article", source_id: "unlinked-article" },
        EVENT,
        linked,
      ),
    ).toBe(false);
  });
});
