import { describe, it, expect, beforeEach, vi } from "vitest";

// =============================================================================
// T1-2 deferred-push flush — drains push_deferred on the automations worker
// tick. sendPushDirect is mocked (delivery is send.test.ts's problem); the
// fake covers the queue reads, the conditional claim UPDATE, and the
// flush-time opt-out re-check against notification_preferences.
// =============================================================================

type Row = Record<string, unknown>;

const state = {
  deferred: [] as Row[],
  prefs: [] as Row[],
  /** Ids a "racing tick" already claimed before our claim lands. */
  preClaimed: new Set<string>(),
};

function makeBuilder(table: string) {
  const filters: Array<[op: string, col: string, val: unknown]> = [];
  let updatePatch: Row | null = null;

  const matches = (r: Row) =>
    filters.every(([op, col, val]) => {
      if (op === "eq") return r[col] === val;
      if (op === "is") return r[col] == null;
      if (op === "lte") return String(r[col]) <= String(val);
      if (op === "in") return (val as unknown[]).includes(r[col]);
      return true;
    });

  const exec = async (): Promise<{ data: Row[] | null; error: null }> => {
    if (table === "push_deferred") {
      if (updatePatch) {
        // Simulate the race: pre-claimed rows already have sent_at set, so
        // the conditional UPDATE skips them.
        for (const id of state.preClaimed) {
          const r = state.deferred.find((d) => d.id === id);
          if (r && r.sent_at == null) r.sent_at = "raced";
        }
        const hit = state.deferred.filter(matches);
        for (const r of hit) Object.assign(r, updatePatch);
        return { data: hit.map((r) => ({ id: r.id })), error: null };
      }
      return { data: state.deferred.filter(matches), error: null };
    }
    if (table === "notification_preferences") {
      return { data: state.prefs.filter(matches), error: null };
    }
    return { data: null, error: null };
  };

  const builder: Record<string, unknown> = {
    select: () => builder,
    update: (patch: Row) => {
      updatePatch = patch;
      return builder;
    },
    eq: (c: string, v: unknown) => (filters.push(["eq", c, v]), builder),
    is: (c: string, v: unknown) => (filters.push(["is", c, v]), builder),
    lte: (c: string, v: unknown) => (filters.push(["lte", c, v]), builder),
    in: (c: string, v: unknown) => (filters.push(["in", c, v]), builder),
    order: () => builder,
    limit: () => builder,
    then: <T>(resolve: (v: { data: Row[] | null; error: null }) => T, reject?: (e: unknown) => unknown) =>
      exec().then(resolve, reject),
  };
  return builder;
}

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: () => ({ from: (t: string) => makeBuilder(t) }),
  createClient: vi.fn(),
}));

vi.mock("@/lib/log", () => ({
  log: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/urls", () => ({
  resolveNotificationHref: (href: string) => `https://compvss.atlvs.pro${href.replace(/^\/m/, "")}`,
}));

const sendPushDirectMock = vi.fn(async () => ({ sent: 1, failed: 0, disabled: 0 }));
vi.mock("./send", () => ({
  sendPushDirect: (...args: unknown[]) =>
    (sendPushDirectMock as unknown as (...a: unknown[]) => Promise<unknown>)(...args),
}));

import { evaluateDeferredPushes } from "./flush";

const PAST = "2026-07-01T00:00:00.000Z";

function seedDeferred(row: Partial<Row>): void {
  state.deferred.push({
    id: `d-${state.deferred.length + 1}`,
    org_id: "org-1",
    user_id: "u1",
    kind: "chat",
    tier: "ambient",
    payload: { title: "T", body: "B", kind: "chat" },
    defer_until: PAST,
    sent_at: null,
    ...row,
  });
}

beforeEach(() => {
  state.deferred.length = 0;
  state.prefs.length = 0;
  state.preClaimed.clear();
  sendPushDirectMock.mockClear();
});

describe("evaluateDeferredPushes", () => {
  it("no-ops on an empty queue", async () => {
    const result = await evaluateDeferredPushes();
    expect(result).toEqual({ due: 0, claimed: 0, delivered: 0, digests: 0 });
    expect(sendPushDirectMock).not.toHaveBeenCalled();
  });

  it("replays due ambient rows verbatim and marks them sent", async () => {
    seedDeferred({ kind: "chat", payload: { title: "DM", body: "hey", kind: "chat" } });
    seedDeferred({ user_id: "u2", kind: "shift", payload: { title: "Shift", body: "moved", kind: "shift" } });

    const result = await evaluateDeferredPushes();

    expect(result.claimed).toBe(2);
    expect(result.delivered).toBe(2);
    expect(sendPushDirectMock).toHaveBeenCalledTimes(2);
    expect(sendPushDirectMock).toHaveBeenCalledWith("u1", { title: "DM", body: "hey", kind: "chat" });
    expect(state.deferred.every((r) => r.sent_at != null)).toBe(true);
  });

  it("leaves future rows in the queue", async () => {
    seedDeferred({ defer_until: "2999-01-01T00:00:00.000Z" });
    const result = await evaluateDeferredPushes();
    expect(result.due).toBe(0);
    expect(state.deferred[0]?.sent_at).toBeNull();
  });

  it("folds a user's digest rows into ONE summary push", async () => {
    seedDeferred({ tier: "digest", kind: "kudos", payload: { title: "K1", body: "", kind: "kudos" } });
    seedDeferred({ tier: "digest", kind: "kudos", payload: { title: "K2", body: "", kind: "kudos" } });
    seedDeferred({ tier: "digest", kind: "announcement", payload: { title: "A", body: "", kind: "announcement" } });

    const result = await evaluateDeferredPushes();

    expect(result.digests).toBe(1);
    expect(sendPushDirectMock).toHaveBeenCalledTimes(1);
    const [userId, payload] = sendPushDirectMock.mock.calls[0] as unknown as [
      string,
      { title: string; body: string; url: string; tag: string },
    ];
    expect(userId).toBe("u1");
    expect(payload.title).toBe("3 updates");
    expect(payload.body).toContain("Recognition");
    expect(payload.body).toContain("Feed");
    expect(payload.url).toContain("/feed");
    expect(payload.tag).toBe("compvss-digest");
  });

  it("re-checks the opt-out at flush time — a kind muted since enqueue stays silent", async () => {
    seedDeferred({ kind: "chat", tier: "ambient" });
    seedDeferred({ kind: "kudos", tier: "digest", payload: { title: "K", body: "", kind: "kudos" } });
    state.prefs.push({
      user_id: "u1",
      matrix: { chat: { push: false }, kudos: { push: false } },
    });

    const result = await evaluateDeferredPushes();

    expect(result.delivered).toBe(0);
    expect(result.digests).toBe(0);
    expect(sendPushDirectMock).not.toHaveBeenCalled();
    // Still claimed — mute means gone, not retried forever.
    expect(state.deferred.every((r) => r.sent_at != null)).toBe(true);
  });

  it("skips rows a racing tick already claimed", async () => {
    seedDeferred({ id: "d-raced" });
    state.preClaimed.add("d-raced");

    const result = await evaluateDeferredPushes();

    expect(result.due).toBe(1);
    expect(result.claimed).toBe(0);
    expect(sendPushDirectMock).not.toHaveBeenCalled();
  });
});
