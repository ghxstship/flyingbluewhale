import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

/**
 * Every `sendPushTo` / `sendPushBulk` call site must pass a `kind`.
 *
 * A kindless push bypasses the /m/settings/notifications opt-out matrix
 * entirely (`pushExcludedFrom` returns an empty exclusion set for an
 * undefined kind) — the recipient gets a notification they cannot find a
 * switch for. That "placebo" failure class has now shipped twice (`approval`,
 * `onboarding`); this guard makes the third impossible.
 *
 * Mechanics: grep the repo for call sites, then check the call's argument
 * window for a `kind:` property. The window is lexical, not parsed — good
 * enough because the payload literal always follows the call within a few
 * hundred characters. Deliberately kindless sites go in ALLOWLIST with a
 * reason.
 */

/** Call sites that are allowed to omit `kind`, with why. */
const ALLOWLIST = new Set<string>([
  // The system test ping: deliberately un-mutable so an operator can verify
  // the device pipeline even with every category off.
  "src/app/api/v1/push/test/route.ts",
  // The libs that DEFINE / forward the payload rather than author it.
  "src/lib/push/send.ts",
  "src/lib/inbox.ts",
  "src/lib/notify.ts",
]);

function grepCallSites(): string[] {
  let out = "";
  try {
    out = execFileSync(
      "grep",
      ["-rln", "--include=*.ts", "--include=*.tsx", "-e", "sendPushTo(", "-e", "sendPushBulk(", "src"],
      { cwd: process.cwd(), encoding: "utf8" },
    );
  } catch {
    // grep exits 1 on no matches
  }
  return out
    .split("\n")
    .filter(Boolean)
    .filter((f) => !f.endsWith(".test.ts"));
}

describe("every push call site carries a kind", () => {
  const files = grepCallSites();

  it("finds the call sites (guard the guard)", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  for (const file of files) {
    if (ALLOWLIST.has(file)) continue;
    it(`${file} passes kind on every sendPushTo/sendPushBulk call`, () => {
      const src = readFileSync(file, "utf8");
      const callRe = /sendPush(?:To|Bulk)\s*\(/g;
      let m: RegExpExecArray | null;
      let calls = 0;
      while ((m = callRe.exec(src))) {
        calls += 1;
        // The payload literal follows the call open-paren; 600 chars covers
        // the largest current payload with headroom.
        const windowText = src.slice(m.index, m.index + 600);
        expect(windowText, `call at index ${m.index} has no kind:`).toMatch(/\bkind\s*[:\]]/);
      }
      expect(calls).toBeGreaterThan(0);
    });
  }
});
