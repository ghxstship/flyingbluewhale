import { describe, it, expect } from "vitest";
import { canRecord, compareRecordRoles, maxRecordRole, type RecordRole } from "../db/record-grants";

/**
 * Phase 5.1 — record_grants role precedence + can_record op semantics.
 *
 * These are pure-JS port tests of the SQL helpers in
 * `supabase/migrations/20260504000050_teams_and_record_grants.sql`. The JS
 * port is the canonical reference for app-layer decisions; the SQL helper
 * is the canonical reference for RLS. They MUST stay in sync — these tests
 * pin the JS side so a divergence is caught at PR time.
 */

describe("compareRecordRoles", () => {
  it("orders roles per the SmartSuite ladder", () => {
    const ladder: RecordRole[] = ["viewer", "commenter", "assignee", "contributor", "editor", "full"];
    for (let i = 1; i < ladder.length; i++) {
      expect(compareRecordRoles(ladder[i], ladder[i - 1])).toBeGreaterThan(0);
      expect(compareRecordRoles(ladder[i - 1], ladder[i])).toBeLessThan(0);
    }
  });

  it("returns 0 for the same role", () => {
    expect(compareRecordRoles("editor", "editor")).toBe(0);
  });
});

describe("maxRecordRole", () => {
  it("returns null on empty input", () => {
    expect(maxRecordRole([])).toBeNull();
  });

  it("picks the highest role", () => {
    expect(maxRecordRole(["viewer", "commenter", "editor"])).toBe("editor");
  });

  it("layers a higher team grant above a lower direct user grant", () => {
    // SmartSuite parity: "When a user has multiple grants, highest level wins."
    // Simulates direct viewer + team editor → editor wins.
    expect(maxRecordRole(["viewer", "editor"])).toBe("editor");
  });

  it("layers a higher direct user grant above a lower team grant", () => {
    expect(maxRecordRole(["full", "viewer"])).toBe("full");
  });

  it("returns the only role when input has one entry", () => {
    expect(maxRecordRole(["assignee"])).toBe("assignee");
  });
});

describe("canRecord", () => {
  it("null role denies everything", () => {
    expect(canRecord(null, "read")).toBe(false);
    expect(canRecord(null, "comment")).toBe(false);
    expect(canRecord(null, "edit")).toBe(false);
    expect(canRecord(null, "edit_others")).toBe(false);
    expect(canRecord(null, "delete")).toBe(false);
    expect(canRecord(null, "admin")).toBe(false);
  });

  it("viewer can read, can't comment / edit / delete / admin", () => {
    expect(canRecord("viewer", "read")).toBe(true);
    expect(canRecord("viewer", "comment")).toBe(false);
    expect(canRecord("viewer", "edit")).toBe(false);
    expect(canRecord("viewer", "edit_others")).toBe(false);
    expect(canRecord("viewer", "delete")).toBe(false);
    expect(canRecord("viewer", "admin")).toBe(false);
  });

  it("commenter can read+comment, can't edit", () => {
    expect(canRecord("commenter", "read")).toBe(true);
    expect(canRecord("commenter", "comment")).toBe(true);
    expect(canRecord("commenter", "edit")).toBe(false);
    expect(canRecord("commenter", "delete")).toBe(false);
    expect(canRecord("commenter", "admin")).toBe(false);
  });

  it("assignee can read+comment, can't edit (edit requires contributor+)", () => {
    expect(canRecord("assignee", "read")).toBe(true);
    expect(canRecord("assignee", "comment")).toBe(true);
    expect(canRecord("assignee", "edit")).toBe(false);
    expect(canRecord("assignee", "edit_others")).toBe(false);
    expect(canRecord("assignee", "admin")).toBe(false);
  });

  it("contributor can edit (own/assigned), not edit_others, not delete", () => {
    expect(canRecord("contributor", "read")).toBe(true);
    expect(canRecord("contributor", "comment")).toBe(true);
    expect(canRecord("contributor", "edit")).toBe(true);
    expect(canRecord("contributor", "edit_others")).toBe(false);
    expect(canRecord("contributor", "delete")).toBe(false);
    expect(canRecord("contributor", "admin")).toBe(false);
  });

  it("editor can edit_others + delete, can't admin", () => {
    expect(canRecord("editor", "read")).toBe(true);
    expect(canRecord("editor", "comment")).toBe(true);
    expect(canRecord("editor", "edit")).toBe(true);
    expect(canRecord("editor", "edit_others")).toBe(true);
    expect(canRecord("editor", "delete")).toBe(true);
    expect(canRecord("editor", "admin")).toBe(false);
  });

  it("full can admin (and everything below)", () => {
    expect(canRecord("full", "read")).toBe(true);
    expect(canRecord("full", "comment")).toBe(true);
    expect(canRecord("full", "edit")).toBe(true);
    expect(canRecord("full", "edit_others")).toBe(true);
    expect(canRecord("full", "delete")).toBe(true);
    expect(canRecord("full", "admin")).toBe(true);
  });
});

describe("expired grant semantics (port of SQL filter)", () => {
  /**
   * Mirrors the SQL filter `(expires_at is null or expires_at > now())`
   * applied inside record_role_for(). The DB layer drops expired rows
   * BEFORE the max() — these tests exercise the JS-side equivalent that
   * `getRecordRole(...)` uses in db/record-grants.ts.
   */
  type Grant = { role: RecordRole; expires_at: string | null };

  function effectiveRole(grants: Grant[], now: Date): RecordRole | null {
    const live = grants.filter((g) => g.expires_at === null || new Date(g.expires_at) > now);
    return maxRecordRole(live.map((g) => g.role));
  }

  it("expired grant does not count", () => {
    const past = new Date("2020-01-01T00:00:00Z").toISOString();
    const grants: Grant[] = [{ role: "full", expires_at: past }];
    expect(effectiveRole(grants, new Date())).toBeNull();
  });

  it("grant with no expiry counts indefinitely", () => {
    const grants: Grant[] = [{ role: "editor", expires_at: null }];
    expect(effectiveRole(grants, new Date())).toBe("editor");
  });

  it("expired high-priority grant lets a live low-priority grant win", () => {
    const past = new Date("2020-01-01T00:00:00Z").toISOString();
    const grants: Grant[] = [
      { role: "full", expires_at: past },
      { role: "viewer", expires_at: null },
    ];
    expect(effectiveRole(grants, new Date())).toBe("viewer");
  });

  it("future expiry still counts", () => {
    const future = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    const grants: Grant[] = [{ role: "editor", expires_at: future }];
    expect(effectiveRole(grants, new Date())).toBe("editor");
  });
});

describe("team-derived role layering", () => {
  /**
   * SmartSuite Teams: a user can hold both a direct user grant and a team
   * grant inherited via team_members. The effective role is the max() of all
   * applicable grants. This test exercises the JS-port of that union.
   */
  it("team-derived role layers above direct user grant when higher", () => {
    // Direct: viewer. Via team: editor. Effective: editor.
    expect(maxRecordRole(["viewer", "editor"])).toBe("editor");
  });

  it("direct user grant wins when higher than team-derived role", () => {
    // Direct: full. Via team: commenter. Effective: full.
    expect(maxRecordRole(["full", "commenter"])).toBe("full");
  });

  it("multiple team grants converge on the highest", () => {
    // User belongs to two teams: viewer + contributor. Effective: contributor.
    expect(maxRecordRole(["viewer", "contributor"])).toBe("contributor");
  });

  it("direct + multiple team grants — max wins", () => {
    // Direct: assignee. Team A: viewer. Team B: editor. Effective: editor.
    expect(maxRecordRole(["assignee", "viewer", "editor"])).toBe("editor");
  });
});
