import { describe, it, expect, beforeEach, vi } from "vitest";

// =============================================================================
// Chainable recorder fake for the supabase client. Every query method
// records (method, args) and returns the chain; awaiting the chain (or
// calling .maybeSingle()) resolves the configured response. Tests assert
// against the recorded call list — i.e. WHICH filters were applied.
// =============================================================================

type QueryResult = { data: unknown; error: { message: string } | null; count: number | null };
type Call = { method: string; args: unknown[] };

const CHAIN_METHODS = ["select", "eq", "is", "in", "gte", "lte", "order", "limit", "range"] as const;

type Chain = {
  [K in (typeof CHAIN_METHODS)[number]]: (...args: unknown[]) => Chain;
} & {
  maybeSingle: () => Promise<QueryResult>;
  then: <T>(resolve: (v: QueryResult) => T | PromiseLike<T>, reject?: (e: unknown) => T | PromiseLike<T>) => Promise<T>;
};

function makeFake() {
  const calls: Call[] = [];
  const response: QueryResult = { data: [], error: null, count: 0 };
  let clientRequests = 0;

  function makeChain(): Chain {
    const chain = {} as Chain;
    for (const m of CHAIN_METHODS) {
      chain[m] = (...args: unknown[]) => {
        calls.push({ method: m, args });
        return chain;
      };
    }
    chain.maybeSingle = () => {
      calls.push({ method: "maybeSingle", args: [] });
      return Promise.resolve({ ...response });
    };
    chain.then = (resolve, reject) => Promise.resolve({ ...response }).then(resolve, reject);
    return chain;
  }

  // `from()` must NOT be thenable — resource.ts awaits `anyFrom(table)`,
  // and a thenable builder would collapse into the query result before
  // `.select()` is ever called (matches the real PostgrestQueryBuilder,
  // which only becomes thenable after `.select()`).
  const client = {
    from(table: string) {
      calls.push({ method: "from", args: [table] });
      return {
        select(...args: unknown[]) {
          calls.push({ method: "select", args });
          return makeChain();
        },
      };
    },
  };

  return {
    calls,
    response,
    createClient: async () => {
      clientRequests += 1;
      return client;
    },
    clientRequests: () => clientRequests,
    reset() {
      calls.length = 0;
      response.data = [];
      response.error = null;
      response.count = 0;
      clientRequests = 0;
    },
  };
}

const fake = makeFake();

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => fake.createClient(),
  createServiceClient: vi.fn(),
}));

import {
  listOrgScoped,
  getOrgScoped,
  countOrgScoped,
  listOrgScopedPage,
  decodeCursor,
  SOFT_DELETABLE_TABLES,
} from "./resource";

const has = (method: string, ...args: unknown[]) =>
  fake.calls.some((c) => c.method === method && JSON.stringify(c.args) === JSON.stringify(args));
const hasMethodOn = (method: string, column: string) =>
  fake.calls.some((c) => c.method === method && c.args[0] === column);

beforeEach(() => {
  fake.reset();
});

describe("listOrgScoped", () => {
  it("returns [] for empty orgId without touching the client", async () => {
    const rows = await listOrgScoped("projects", "");
    expect(rows).toEqual([]);
    expect(fake.clientRequests()).toBe(0);
  });

  it("pins org, filters deleted_at for allowlisted tables, defaults created_at desc + limit 100", async () => {
    expect(SOFT_DELETABLE_TABLES.has("projects")).toBe(true);
    fake.response.data = [{ id: "p1" }];

    const rows = await listOrgScoped("projects", "org-1");

    expect(rows).toEqual([{ id: "p1" }]);
    expect(has("from", "projects")).toBe(true);
    expect(has("eq", "org_id", "org-1")).toBe(true);
    expect(has("is", "deleted_at", null)).toBe(true);
    expect(has("order", "created_at", { ascending: false })).toBe(true);
    expect(has("limit", 100)).toBe(true);
  });

  it("skips the soft-delete filter with includeArchived and for non-allowlisted tables", async () => {
    await listOrgScoped("projects", "org-1", { includeArchived: true });
    expect(hasMethodOn("is", "deleted_at")).toBe(false);

    fake.reset();
    expect(SOFT_DELETABLE_TABLES.has("tasks")).toBe(false);
    await listOrgScoped("tasks", "org-1");
    expect(hasMethodOn("is", "deleted_at")).toBe(false);
  });

  it("limit: 0 means no cap; explicit limit is forwarded", async () => {
    await listOrgScoped("projects", "org-1", { limit: 0 });
    expect(fake.calls.some((c) => c.method === "limit")).toBe(false);

    fake.reset();
    await listOrgScoped("projects", "org-1", { limit: 25 });
    expect(has("limit", 25)).toBe(true);
  });

  it("explicit orderBy replaces the created_at default and honors ascending", async () => {
    await listOrgScoped("projects", "org-1", { orderBy: "name", ascending: true });
    expect(has("order", "name", { ascending: true })).toBe(true);
    expect(hasMethodOn("order", "created_at")).toBe(false);
  });

  it("routes each filter op to the matching query method", async () => {
    await listOrgScoped("projects", "org-1", {
      filters: [
        { column: "xpms_phase", op: "eq", value: "build" },
        { column: "id", op: "in", value: ["a", "b"] },
        { column: "created_at", op: "gte", value: "2026-01-01" },
        { column: "created_at", op: "lte", value: "2026-12-31" },
      ],
    });
    expect(has("eq", "xpms_phase", "build")).toBe(true);
    expect(has("in", "id", ["a", "b"])).toBe(true);
    expect(has("gte", "created_at", "2026-01-01")).toBe(true);
    expect(has("lte", "created_at", "2026-12-31")).toBe(true);
  });

  it("throws when the query errors", async () => {
    fake.response.error = { message: "boom" };
    await expect(listOrgScoped("projects", "org-1")).rejects.toEqual({ message: "boom" });
  });
});

describe("getOrgScoped", () => {
  it("returns null early when orgId or id is empty", async () => {
    expect(await getOrgScoped("projects", "", "id-1")).toBeNull();
    expect(await getOrgScoped("projects", "org-1", "")).toBeNull();
    expect(fake.clientRequests()).toBe(0);
  });

  it("pins org + id, applies soft-delete filter, and resolves via maybeSingle", async () => {
    fake.response.data = { id: "p1" };
    const row = await getOrgScoped("projects", "org-1", "p1");
    expect(row).toEqual({ id: "p1" });
    expect(has("eq", "org_id", "org-1")).toBe(true);
    expect(has("eq", "id", "p1")).toBe(true);
    expect(has("is", "deleted_at", null)).toBe(true);
    expect(has("maybeSingle")).toBe(true);
  });
});

describe("countOrgScoped", () => {
  it("issues a head count query and returns the count (0 for empty orgId)", async () => {
    fake.response.count = 42;
    expect(await countOrgScoped("projects", "org-1")).toBe(42);
    expect(has("select", "*", { count: "exact", head: true })).toBe(true);
    expect(has("is", "deleted_at", null)).toBe(true);

    fake.reset();
    expect(await countOrgScoped("projects", "")).toBe(0);
    expect(fake.clientRequests()).toBe(0);
  });
});

describe("decodeCursor", () => {
  it("decodes valid offsets and falls back to 0 for garbage", () => {
    expect(decodeCursor(null)).toBe(0);
    expect(decodeCursor(undefined)).toBe(0);
    expect(decodeCursor("")).toBe(0);
    expect(decodeCursor("17")).toBe(17);
    expect(decodeCursor("3.9")).toBe(3);
    expect(decodeCursor("-5")).toBe(0);
    expect(decodeCursor("not-a-number")).toBe(0);
  });
});

describe("listOrgScopedPage", () => {
  it("clamps pageSize to [1, 200] and defaults to 50", async () => {
    fake.response.data = [];
    const big = await listOrgScopedPage("projects", "org-1", { pageSize: 500 });
    expect(big.pageSize).toBe(200);

    fake.reset();
    const tiny = await listOrgScopedPage("projects", "org-1", { pageSize: -3 });
    expect(tiny.pageSize).toBe(1);

    fake.reset();
    const dflt = await listOrgScopedPage("projects", "org-1", {});
    expect(dflt.pageSize).toBe(50);
  });

  it("translates the cursor into an inclusive range and returns nextCursor while more rows remain", async () => {
    fake.response.data = [{ id: "a" }, { id: "b" }];
    fake.response.count = 5;
    const page = await listOrgScopedPage("projects", "org-1", { cursor: "2", pageSize: 2 });

    expect(has("range", 2, 3)).toBe(true);
    expect(has("is", "deleted_at", null)).toBe(true);
    expect(page.rows).toHaveLength(2);
    expect(page.totalCount).toBe(5);
    expect(page.nextCursor).toBe("4");
  });

  it("returns nextCursor null on the final page", async () => {
    fake.response.data = [{ id: "e" }];
    fake.response.count = 5;
    const page = await listOrgScopedPage("projects", "org-1", { cursor: "4", pageSize: 2 });
    expect(page.nextCursor).toBeNull();
  });

  it("returns an empty page for empty orgId without querying", async () => {
    const page = await listOrgScopedPage("projects", "", { pageSize: 30 });
    expect(page).toEqual({ rows: [], nextCursor: null, totalCount: 0, pageSize: 30 });
    expect(fake.clientRequests()).toBe(0);
  });
});
