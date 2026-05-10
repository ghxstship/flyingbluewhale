/**
 * CHROMA BEACON × responsive audit — matrix-driven validation.
 *
 * For each (route × theme × breakpoint) triple the spec asserts:
 *   1. `<html data-theme>` carries the requested theme after the head
 *      bootstrap runs → no FOUC / stale state.
 *   2. Core semantic tokens resolve to non-empty values → theme tokens
 *      reach the document root.
 *   3. No horizontal scroll at the viewport width → layout integrity.
 *   4. WCAG AA contrast between `--foreground` and `--background`
 *      (≥4.5:1) → contrast invariant.
 *   5. A full-page screenshot is captured to
 *      `docs/audits/evidence/<browser>/<breakpoint>/<theme>/<route>.png`
 *      and the PASS/FAIL row is appended to a shared coverage log at
 *      `docs/audits/evidence/coverage.jsonl`.
 *
 * Authed routes use the shared seeded owner; an unrecoverable login
 * fallback downgrades those rows to SKIP rather than failing the matrix.
 *
 * Env toggles:
 *   AUDIT_FULL=1        include all breakpoints (default: quick slice)
 *   AUDIT_BROWSERS=...  comma-sep list to drive cross-browser pass
 *   AUDIT_ROUTES=...    comma-sep route paths to narrow the slice
 */
import { expect, test } from "playwright/test";
import { dismissConsent } from "../helpers/auth";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { THEMES, BREAKPOINTS, ROUTES, type Theme } from "./matrix.config";

const EVIDENCE_ROOT = join(process.cwd(), "docs/audits/evidence");
const COVERAGE_LOG = join(EVIDENCE_ROOT, "coverage.jsonl");

// ─── helpers ────────────────────────────────────────────────────────────────

function ensureDir(path: string) {
  mkdirSync(dirname(path), { recursive: true });
}

function logRow(row: Record<string, unknown>) {
  ensureDir(COVERAGE_LOG);
  appendFileSync(COVERAGE_LOG, JSON.stringify({ ts: new Date().toISOString(), ...row }) + "\n");
}
