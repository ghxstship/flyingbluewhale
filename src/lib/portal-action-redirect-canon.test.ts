import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Regression guard — portal client-proposal create actions must let their
 * success `redirect()` escape the try/catch.
 *
 * `redirect()` (next/navigation) signals a navigation by THROWING the internal
 * `NEXT_REDIRECT` error. If a server action calls `redirect()` on the success
 * path INSIDE a `try { … } catch (e) { return { error: … } }`, the catch
 * swallows that throw and converts it to `{ error: "NEXT_REDIRECT" }` — the
 * mutation succeeds (the row is written) but the user is stranded on the /new
 * form with a bogus "NEXT_REDIRECT" alert and no navigation. This was the live
 * defect behind the long-skipped `e2e/portal-proposal-lifecycle.spec.ts`
 * change-order / revision tests (mis-attributed there to an org-resolution
 * nuance): createChangeOrderAction + createRevisionRoundAction both stranded
 * the redirect. Fixed by hoisting `redirect()` out of the try (the Next.js
 * idiom); the sibling console createProject action instead re-throws
 * NEXT_REDIRECT from its catch — either pattern is acceptable.
 *
 * Pure-text guard (no live server): for each guarded create action file, assert
 * that EITHER the success redirect is hoisted out of the try (no `redirect(` is
 * lexically inside a `try { … } catch` block) OR the catch re-throws
 * NEXT_REDIRECT. Fails loudly if a future edit puts an unguarded redirect back
 * inside the try. Mirrors the introspection style of
 * src/lib/proposal-rls-manager-canon.test.ts.
 */

const ROOT = process.cwd();

// Create actions whose success path redirects to the freshly-created record's
// detail page. Portal client-proposal actions (the original defect) + the
// console actions found with the identical swallow bug during the per-persona
// e2e sweep (msas + team create). Add any create action here when it adopts the
// redirect-on-success pattern.
const GUARDED_ACTION_FILES: readonly string[] = [
  "src/app/(portal)/p/[slug]/client/proposals/[proposalId]/change-orders/actions.ts",
  "src/app/(portal)/p/[slug]/client/proposals/[proposalId]/revisions/actions.ts",
  "src/app/(platform)/studio/people/msas/new/actions.ts",
  "src/app/(platform)/studio/people/teams/[teamId]/actions.ts",
];

/**
 * Return the spans of every `try { … } catch` block in the source (brace
 * matched from the `try {` to the matching close brace immediately followed by
 * `catch`). Naive but sufficient for these small action files.
 */
function tryBlockSpans(src: string): Array<[number, number]> {
  const spans: Array<[number, number]> = [];
  const tryRe = /try\s*{/g;
  let m: RegExpExecArray | null;
  while ((m = tryRe.exec(src))) {
    const open = m.index + m[0].length - 1; // index of the `{`
    let depth = 0;
    let i = open;
    for (; i < src.length; i++) {
      if (src[i] === "{") depth++;
      else if (src[i] === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    // Only count it as a try/catch if `catch` follows the close brace.
    const after = src.slice(i + 1, i + 12);
    if (/^\s*catch/.test(after)) spans.push([open, i]);
  }
  return spans;
}

describe("server action redirect canon (no swallowed NEXT_REDIRECT)", () => {
  for (const rel of GUARDED_ACTION_FILES) {
    it(`${rel}: success redirect() is not swallowed by a try/catch`, () => {
      const src = readFileSync(join(ROOT, rel), "utf8");
      expect(src).toMatch(/redirect\(/);

      const spans = tryBlockSpans(src);
      const redirectRe = /\bredirect\(/g;
      let r: RegExpExecArray | null;
      while ((r = redirectRe.exec(src))) {
        const at = r.index;
        const insideTry = spans.some(([open, close]) => at > open && at < close);
        if (!insideTry) continue;
        // A redirect inside a try/catch is only safe if the catch re-throws
        // NEXT_REDIRECT. Require that escape hatch when the pattern is present.
        expect(
          /NEXT_REDIRECT/.test(src),
          `${rel} calls redirect() inside a try/catch without re-throwing NEXT_REDIRECT — ` +
            `the catch swallows the redirect and strands the user on /new. ` +
            `Hoist redirect() out of the try, or re-throw NEXT_REDIRECT from the catch.`,
        ).toBe(true);
      }
    });
  }
});
