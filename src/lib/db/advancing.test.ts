import { describe, it, expect, beforeEach, vi } from "vitest";

// =============================================================================
// Pure parts (type tuples + labelForType) plus a chainable-recorder check
// that listDeliverables applies the canonical filters: project pin,
// soft-delete exclusion, type filter, created_at desc, 1000-row cap.
// =============================================================================

type QueryResult = { data: unknown; error: { message: string } | null };
type Call = { method: string; args: unknown[] };

const CHAIN_METHODS = ["select", "eq", "is", "in", "order", "limit"] as const;

type Chain = {
  [K in (typeof CHAIN_METHODS)[number]]: (...args: unknown[]) => Chain;
} & {
  maybeSingle: () => Promise<QueryResult>;
  then: <T>(resolve: (v: QueryResult) => T | PromiseLike<T>, reject?: (e: unknown) => T | PromiseLike<T>) => Promise<T>;
};

function makeFake() {
  const calls: Call[] = [];
  const response: QueryResult = { data: [], error: null };

  function makeChain(): Chain {
    const chain = {} as Chain;
    for (const m of CHAIN_METHODS) {
      chain[m] = (...args: unknown[]) => {
        calls.push({ method: m, args });
        return chain;
      };
    }
    chain.maybeSingle = () => Promise.resolve({ ...response });
    chain.then = (resolve, reject) => Promise.resolve({ ...response }).then(resolve, reject);
    return chain;
  }

  const client = {
    from(table: string) {
      calls.push({ method: "from", args: [table] });
      return makeChain();
    },
  };

  return {
    calls,
    response,
    client,
    reset() {
      calls.length = 0;
      response.data = [];
      response.error = null;
    },
  };
}

const fake = makeFake();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => fake.client,
  createServiceClient: vi.fn(),
}));

import { TALENT_TYPES, PRODUCTION_TYPES, labelForType, listDeliverables } from "./advancing";
import { toTitle } from "@/lib/format";
import type { DeliverableType } from "@/lib/supabase/types";

const has = (method: string, ...args: unknown[]) =>
  fake.calls.some((c) => c.method === method && JSON.stringify(c.args) === JSON.stringify(args));

beforeEach(() => {
  fake.reset();
});

describe("deliverable type tuples", () => {
  it("talent + production types are disjoint, duplicate-free, and fully labelled", () => {
    const all = [...TALENT_TYPES, ...PRODUCTION_TYPES];
    const types = all.map((t) => t.type);
    expect(new Set(types).size).toBe(types.length);
    for (const entry of all) {
      expect(entry.label.trim().length, entry.type).toBeGreaterThan(0);
    }
  });
});

describe("labelForType", () => {
  it("returns the curated label for known types", () => {
    expect(labelForType("technical_rider")).toBe("Technical Rider");
    expect(labelForType("stage_plot")).toBe("Stage Plot");
    expect(labelForType("equipment_pull_list")).toBe("Equipment Pull List");
  });

  it("falls back to toTitle for types outside the curated lists", () => {
    const unknown = "made_up_type" as DeliverableType;
    expect(labelForType(unknown)).toBe(toTitle("made_up_type"));
  });
});

describe("listDeliverables", () => {
  it("pins project, excludes soft-deleted, orders created_at desc, caps at 1000", async () => {
    fake.response.data = [{ id: "d1" }];
    const rows = await listDeliverables("proj-1");

    expect(rows).toEqual([{ id: "d1" }]);
    expect(has("from", "deliverables")).toBe(true);
    expect(has("eq", "project_id", "proj-1")).toBe(true);
    expect(has("is", "deleted_at", null)).toBe(true);
    expect(has("order", "created_at", { ascending: false })).toBe(true);
    expect(has("limit", 1000)).toBe(true);
    // No type filter when none requested.
    expect(fake.calls.some((c) => c.method === "in")).toBe(false);
  });

  it("applies the type filter only when a non-empty types array is passed", async () => {
    await listDeliverables("proj-1", ["stage_plot", "input_list"]);
    expect(has("in", "type", ["stage_plot", "input_list"])).toBe(true);

    fake.reset();
    await listDeliverables("proj-1", []);
    expect(fake.calls.some((c) => c.method === "in")).toBe(false);
  });

  it("throws when the query errors", async () => {
    fake.response.error = { message: "boom" };
    await expect(listDeliverables("proj-1")).rejects.toEqual({ message: "boom" });
  });
});
