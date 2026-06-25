import { describe, it, expect, beforeEach, vi } from "vitest";

// =============================================================================
// Guard for the CRITICAL fix: transitionSubscription must run under the
// INJECTED client. The Stripe webhook (no session) passes the service-role
// client; without injection it fell back to the RLS-scoped client, whose
// has_org_role SELECT/UPDATE policies make every read return null in
// webhook context → the transition silently no-ops → renewals / dunning /
// churn are dropped (Stripe sees a 200 and never retries).
//
// We assert:
//   1. When `db` is injected, NO RLS client is constructed (createClient is
//      never called) — the webhook path uses the service client end-to-end.
//   2. The injected client performs the SELECT, the guarded UPDATE, and the
//      transition-log INSERT — i.e. the state change actually lands.
//   3. When `db` is omitted (in-app authed caller), the RLS client IS built —
//      so user-initiated transitions keep enforcing RLS.
// =============================================================================

// createClient (RLS client) is mocked so we can detect whether the code
// reached for it. If it's ever called on the webhook path, the bug is back.
const createClientMock = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => createClientMock(),
}));

type Row = Record<string, unknown>;

/** Minimal chainable fake of a Supabase client over the two tables the
 *  transition touches. Records inserts and the landed update patch. */
function makeFakeClient(initial: Row) {
  const state: { sub: Row; updates: Row[]; transitions: Row[] } = {
    sub: { ...initial },
    updates: [],
    transitions: [],
  };

  function from(table: string) {
    const filters: Array<[string, string, unknown]> = [];
    let pendingUpdate: Row | null = null;

    const builder: Record<string, unknown> = {
      select: () => builder,
      insert: (rows: Row | Row[]) => {
        if (table === "subscription_state_transitions") {
          state.transitions.push(...(Array.isArray(rows) ? rows : [rows]));
        }
        return Promise.resolve({ data: null, error: null });
      },
      update: (patch: Row) => {
        pendingUpdate = patch;
        return builder;
      },
      eq: (col: string, val: unknown) => {
        filters.push(["eq", col, val]);
        // The guarded UPDATE chains .eq("state", current.state).select("id").
        // Emulate the conditional-update landing only if the state still matches.
        return builder;
      },
      is: (col: string, val: unknown) => {
        filters.push(["is", col, val]);
        return builder;
      },
      maybeSingle: () => {
        // SELECT path (getSubscription).
        return Promise.resolve({ data: { ...state.sub }, error: null });
      },
      // The UPDATE chain ends in .select("id") which is awaited directly.
      then: (resolve: (v: { data: Row[]; error: null }) => unknown) => {
        // Only reached for the update chain (insert/select return their own promises).
        if (pendingUpdate) {
          const stateFilter = filters.find(([op, col]) => op === "eq" && col === "state");
          const matches = !stateFilter || stateFilter[2] === state.sub.state;
          if (matches) {
            state.sub = { ...state.sub, ...pendingUpdate };
            return Promise.resolve({ data: [{ id: state.sub.id }], error: null }).then(resolve);
          }
          return Promise.resolve({ data: [], error: null }).then(resolve);
        }
        return Promise.resolve({ data: [], error: null }).then(resolve);
      },
    };
    return builder;
  }

  return { client: { from } as unknown as Parameters<typeof transitionSubscription>[0]["db"], state };
}

let transitionSubscription: typeof import("./subscriptions").transitionSubscription;

beforeEach(async () => {
  vi.clearAllMocks();
  ({ transitionSubscription } = await import("./subscriptions"));
});

describe("transitionSubscription — injected client (webhook context)", () => {
  it("applies the state change using the injected (service) client without touching the RLS client", async () => {
    const { client, state } = makeFakeClient({
      id: "sub_1",
      org_id: "org_1",
      state: "ACTIVE",
      started_at: "2026-01-01T00:00:00Z",
    });

    const result = await transitionSubscription({
      orgId: "org_1",
      subscriptionId: "sub_1",
      to: "RENEWED",
      reason: "Stripe invoice.paid",
      stripeEventId: "evt_123",
      db: client,
    });

    expect(result).toEqual({ ok: true });
    // The state change actually landed on the injected client.
    expect(state.sub.state).toBe("RENEWED");
    // A transition-log row was written with the right event id.
    expect(state.transitions).toHaveLength(1);
    expect(state.transitions[0]).toMatchObject({
      subscription_id: "sub_1",
      from_state: "ACTIVE",
      to_state: "RENEWED",
      stripe_event_id: "evt_123",
    });
    // Critically: the RLS client was NEVER constructed on the webhook path.
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("rejects an illegal transition before any write", async () => {
    const { client, state } = makeFakeClient({ id: "sub_1", org_id: "org_1", state: "ARCHIVED" });
    const result = await transitionSubscription({
      orgId: "org_1",
      subscriptionId: "sub_1",
      to: "ACTIVE",
      db: client,
    });
    expect(result.ok).toBe(false);
    expect(state.transitions).toHaveLength(0);
    expect(createClientMock).not.toHaveBeenCalled();
  });
});

describe("transitionSubscription — no injected client (in-app authed caller)", () => {
  it("builds the RLS-scoped client so user transitions still enforce RLS", async () => {
    const { client, state } = makeFakeClient({ id: "sub_1", org_id: "org_1", state: "ACTIVE" });
    // createClient returns the same fake so the call still completes; we only
    // assert that the RLS client path was taken (createClient WAS called).
    createClientMock.mockResolvedValue(client);

    const result = await transitionSubscription({
      orgId: "org_1",
      subscriptionId: "sub_1",
      to: "RENEWED",
    });

    expect(result).toEqual({ ok: true });
    expect(state.sub.state).toBe("RENEWED");
    expect(createClientMock).toHaveBeenCalledTimes(1);
  });
});
