import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Server-action error i18n canon (W4, owner ruling 1).
 *
 * Server actions in the (platform) shell must not return hardcoded English
 * error strings — they return stable CODES via `actionError` /
 * `actionErrorMessage` (src/lib/errors.ts), which the client resolves
 * through `t("errors.<code>")` (FormShell + `useActionErrorResolver`).
 *
 * RATCHET (pinned at the post-migration residual of ZERO, shrink-only):
 *   1. No `{ error: "..." }` object-literal string in any (platform)
 *      actions.ts.
 *   2. No `actionFail("...")` string-literal message.
 *   3. No `? STALE_ROW_MESSAGE : "..."` English else-branch.
 *
 * Allowed (dynamic — NOT ratcheted): Supabase `error.message`
 * passthroughs, template literals with runtime interpolation, zod
 * `parsed.error.issues[0]?.message ?? "..."` fallbacks, and the shared
 * STALE_ROW_MESSAGE constant itself.
 *
 * CONSISTENCY: every code referenced by a call site must exist in
 * ACTION_ERROR_FALLBACKS with the exact same English fallback, and the
 * `errors.*` namespace in src/messages/en.json must mirror the fallback
 * catalog one-to-one (that mirror is what es/pt are resynced from).
 */

import { ACTION_ERROR_FALLBACKS, ACTION_ERROR_PREFIX } from "./errors";

const REPO_ROOT = process.cwd();
const PLATFORM_DIR = join(REPO_ROOT, "src/app/(platform)");

function* walkActions(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walkActions(p);
    else if (entry.name === "actions.ts") yield p;
  }
}

const actionsFiles = [...walkActions(PLATFORM_DIR)].map((abs) => ({
  rel: abs.slice(REPO_ROOT.length + 1),
  src: readFileSync(abs, "utf8"),
}));

describe("errors canon — no hardcoded English in (platform) server actions", () => {
  it("finds the (platform) actions.ts population", () => {
    expect(actionsFiles.length).toBeGreaterThan(100);
  });

  it("no object-literal `{ error: \"...\" }` returns (pin: 0, shrink-only)", () => {
    const offenders: string[] = [];
    for (const { rel, src } of actionsFiles) {
      for (const m of src.matchAll(/(?:^|[{,]\s*)error: "((?:[^"\\]|\\.)*)"/gm)) {
        offenders.push(`${rel}: ${m[1]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("no `actionFail(\"...\")` string-literal messages (pin: 0, shrink-only)", () => {
    const offenders: string[] = [];
    for (const { rel, src } of actionsFiles) {
      for (const m of src.matchAll(/actionFail\(\s*"((?:[^"\\]|\\.)*)"/g)) {
        offenders.push(`${rel}: ${m[1]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("no `? STALE_ROW_MESSAGE : \"...\"` English else-branches (pin: 0, shrink-only)", () => {
    const offenders: string[] = [];
    for (const { rel, src } of actionsFiles) {
      for (const m of src.matchAll(/\? STALE_ROW_MESSAGE : "((?:[^"\\]|\\.)*)"/g)) {
        offenders.push(`${rel}: ${m[1]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("errors canon — code catalog consistency", () => {
  const CALL_RE = /action(?:Error|ErrorMessage)\(("(?:[^"\\]|\\.)*"), ("(?:[^"\\]|\\.)*")\)?/g;

  it("every call-site code exists in ACTION_ERROR_FALLBACKS with the identical fallback", () => {
    const problems: string[] = [];
    for (const { rel, src } of actionsFiles) {
      for (const m of src.matchAll(CALL_RE)) {
        const code = JSON.parse(m[1]!) as string;
        const fallback = JSON.parse(m[2]!) as string;
        const catalog = (ACTION_ERROR_FALLBACKS as Record<string, string>)[code];
        if (catalog === undefined) problems.push(`${rel}: unknown code "${code}"`);
        else if (catalog !== fallback)
          problems.push(`${rel}: code "${code}" fallback drifted (catalog: "${catalog}", call site: "${fallback}")`);
      }
    }
    expect(problems).toEqual([]);
  });

  it("en.json errors.* mirrors ACTION_ERROR_FALLBACKS one-to-one", () => {
    const en = JSON.parse(readFileSync(join(REPO_ROOT, "src/messages/en.json"), "utf8")) as {
      errors?: Record<string, unknown>;
    };
    expect(en.errors, "en.json is missing the errors namespace").toBeTruthy();
    const flat: Record<string, string> = {};
    const flatten = (node: Record<string, unknown>, prefix: string) => {
      for (const [k, v] of Object.entries(node)) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (typeof v === "string") flat[key] = v;
        else flatten(v as Record<string, unknown>, key);
      }
    };
    flatten(en.errors as Record<string, unknown>, "");
    expect(flat).toEqual({ ...ACTION_ERROR_FALLBACKS });
  });

  it("the sentinel prefix is stable", () => {
    // Changing the prefix would strand in-flight client bundles rendering
    // raw sentinels; treat it as a breaking contract change.
    expect(ACTION_ERROR_PREFIX).toBe("@err:");
  });
});
