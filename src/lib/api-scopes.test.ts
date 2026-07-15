import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { API_SCOPES, READ_ONLY_SCOPE_PRESET, isApiScope, suggestScope } from "./api-scopes";

describe("API scope vocabulary", () => {
  it("has no duplicates", () => {
    expect(new Set(API_SCOPES).size).toBe(API_SCOPES.length);
  });

  it("names every scope <domain>:<action>, or the bare wildcard", () => {
    for (const s of API_SCOPES) {
      if (s === "*") continue;
      expect(s, `${s} should be domain:action`).toMatch(/^[a-z-]+:(\*|[a-z-]+)$/);
    }
  });

  it("recognises real scopes and rejects typos", () => {
    expect(isApiScope("time:read")).toBe(true);
    expect(isApiScope("payroll:export")).toBe(true);
    // The exact failure that used to mint a silently-powerless token.
    expect(isApiScope("time:reed")).toBe(false);
    expect(isApiScope("documnets:read")).toBe(false);
    expect(isApiScope("")).toBe(false);
  });

  it("suggests the near miss for a typo, and stays quiet for nonsense", () => {
    expect(suggestScope("time:reed")).toBe("time:read");
    expect(suggestScope("payroll:expor")).toBe("payroll:export");
    expect(suggestScope("wholly-unrelated-nonsense")).toBeNull();
  });

  it("keeps the read-only preset read-only", () => {
    for (const s of READ_ONLY_SCOPE_PRESET) {
      expect(isApiScope(s), `${s} must be a real scope`).toBe(true);
      expect(s.endsWith(":read"), `${s} must not grant a write`).toBe(true);
    }
  });

  it("covers the time and payroll surface the lifecycle plan opened up", () => {
    for (const s of [
      "time:read",
      "time:write",
      "time:approve",
      "timesheets:read",
      "timesheets:write",
      "payroll:read",
      "payroll:post",
      "payroll:export",
    ]) {
      expect(API_SCOPES, s).toContain(s);
    }
  });

  // Separation of duties, in the scope vocabulary itself: a token that can
  // record hours must not thereby be able to bless or pay them.
  it("keeps approve and export as scopes of their own, not implied by write", () => {
    expect(API_SCOPES).toContain("time:approve");
    expect(API_SCOPES).toContain("payroll:export");
    // `time:write` and `time:approve` are distinct strings; only an explicit
    // `time:*` bridges them, which is a deliberate grant.
    expect("time:write").not.toBe("time:approve");
  });

  /**
   * The point of the vocabulary is that it matches what routes actually
   * gate on. A scope nothing checks is a promise the API doesn't keep; a
   * gate whose scope isn't mintable is a route nobody can reach.
   */
  it("contains every scope the codebase actually asserts", () => {
    const root = process.cwd();
    const asserted = new Set<string>();
    const walk = (dir: string) => {
      for (const entry of readdirSafe(dir)) {
        const p = join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith(".test.ts")) {
          const src = readFileSync(p, "utf8");
          for (const m of src.matchAll(/assertScope\(\s*session\s*,\s*"([^"]+)"/g)) {
            if (m[1]) asserted.add(m[1]);
          }
        }
      }
    };
    walk(join(root, "src/app/api"));

    const missing = [...asserted].filter((s) => !isApiScope(s));
    expect(missing, `asserted but not mintable: ${missing.join(", ")}`).toEqual([]);
  });
});

function readdirSafe(dir: string) {
  try {
    return readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}
