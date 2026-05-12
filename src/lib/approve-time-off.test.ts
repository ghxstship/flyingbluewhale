import { describe, expect, it } from "vitest";
import type { Database } from "./supabase/database.types";

/**
 * Integration-shape contract test for `approve_time_off_request`.
 *
 * We can't reach the live Postgres function from unit tests, so this
 * suite locks the *shape* of the wire: the regenerated database.types
 * must declare the three named parameters the action passes, AND the
 * return row must include the columns the action reads back. If migration
 * 0048 ever drifts (param rename, signature change), this test fails
 * before the action does at runtime.
 */
describe("approve_time_off_request RPC shape", () => {
  type RPC = Database["public"]["Functions"]["approve_time_off_request"];

  it("declares the three named parameters the action sends", () => {
    const args: RPC["Args"] = {
      p_request_id: "00000000-0000-0000-0000-000000000000",
      p_decider_id: "00000000-0000-0000-0000-000000000000",
      p_decision_note: null as unknown as string,
    };
    // Type-only assertion. If the param names drift, this file won't
    // type-check and `pnpm test` fails before any test logic runs.
    expect(args.p_request_id).toBeTypeOf("string");
    expect(args.p_decider_id).toBeTypeOf("string");
  });

  it("returns the columns the action surfaces back to the UI", () => {
    // Compile-time guarantee that the return row has the fields the
    // action / dashboards rely on.
    const row: RPC["Returns"] = {
      id: "00000000-0000-0000-0000-000000000000",
      org_id: "00000000-0000-0000-0000-000000000000",
      policy_id: "00000000-0000-0000-0000-000000000000",
      user_id: "00000000-0000-0000-0000-000000000000",
      starts_on: "2026-01-01",
      ends_on: "2026-01-02",
      hours_requested: 8,
      reason: null,
      request_state: "approved",
      decided_by: "00000000-0000-0000-0000-000000000000",
      decided_at: "2026-01-01T00:00:00Z",
      decision_note: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    expect(row.request_state).toBe("approved");
    expect(row.decided_by).toBeTypeOf("string");
  });
});
