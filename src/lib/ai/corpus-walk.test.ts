/**
 * L-P5 — corpus walker honesty. The walker's app-side gates must hold even
 * when the underlying query filters are bypassed (the stub below ignores
 * .eq/.not, mimicking a permissive read):
 *   - kb articles enter the corpus only while CURRENTLY verified (stale and
 *     unverified rows are dropped);
 *   - event guides carry their project_id so their chunks are natively
 *     event-scoped;
 *   - jsonTextHarvest extracts only human-readable strings from JSONB.
 */
import { describe, expect, it } from "vitest";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { jsonTextHarvest, walkOrgSources } from "./corpus";

const ORG = "11111111-1111-4111-8111-111111111111";
const EVENT = "22222222-2222-4222-8222-222222222222";
const DAY = 86_400_000;

function stubSupabase(fixtures: Record<string, unknown[]>): LooseSupabase {
  const from = (table: string) => {
    const rows = fixtures[table] ?? [];
    const builder: Record<string, unknown> = {};
    for (const m of ["select", "eq", "is", "not", "order", "limit"]) {
      builder[m] = () => builder;
    }
    builder.then = (resolve: (v: { data: unknown[] }) => unknown) => resolve({ data: rows });
    return builder;
  };
  return { from } as unknown as LooseSupabase;
}

describe("walkOrgSources — knowledge verification gate", () => {
  it("walks only currently verified kb articles", async () => {
    const now = Date.now();
    const supabase = stubSupabase({
      kb_articles: [
        {
          id: "fresh",
          title: "Radio etiquette",
          body_markdown: "Channel 1 is ops.",
          verified_at: new Date(now - 5 * DAY).toISOString(),
          review_interval_days: 180,
        },
        {
          id: "stale",
          title: "Old policy",
          body_markdown: "Superseded.",
          verified_at: new Date(now - 400 * DAY).toISOString(),
          review_interval_days: 180,
        },
        {
          id: "unverified",
          title: "Draft notes",
          body_markdown: "Never vouched for.",
          verified_at: null,
          review_interval_days: 180,
        },
      ],
    });
    const out = await walkOrgSources(supabase, ORG);
    const kb = out.filter((s) => s.source_type === "kb_article");
    expect(kb.map((s) => s.source_id)).toEqual(["fresh"]);
    // Knowledge chunks stay org-wide; event visibility is link-gated at retrieval.
    expect(kb[0]!.project_id).toBeNull();
    expect(kb[0]!.text).toContain("Channel 1 is ops.");
  });

  it("walks event guides with their project_id (natively event-scoped)", async () => {
    const supabase = stubSupabase({
      event_guides: [
        {
          id: "g1",
          project_id: EVENT,
          persona: "crew",
          config: { sections: [{ type: "overview", heading: "Welcome", body: "Load-in at gate 4." }] },
        },
        { id: "g2", project_id: EVENT, persona: "guest", config: {} }, // no prose — dropped
      ],
    });
    const out = await walkOrgSources(supabase, ORG);
    const guides = out.filter((s) => s.source_type === "event_guide");
    expect(guides.map((s) => s.source_id)).toEqual(["g1"]);
    expect(guides[0]!.project_id).toBe(EVENT);
    expect(guides[0]!.text).toContain("Load-in at gate 4.");
  });
});

describe("jsonTextHarvest", () => {
  it("collects nested strings and skips non-prose values", () => {
    expect(
      jsonTextHarvest({
        a: "one",
        b: { c: ["two", 3, true, null], d: { e: "three", f: "" } },
      }),
    ).toEqual(["one", "two", "three"]);
  });
});
