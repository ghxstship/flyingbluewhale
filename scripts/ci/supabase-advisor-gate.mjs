#!/usr/bin/env node
/**
 * F3 — Supabase advisor gate.
 *
 * Pulls security + performance lints from the Supabase project (via the
 * Management API) and:
 *   - Fails the run on any ERROR-level lint (cross-tenant leaks, RLS off).
 *   - Diffs WARN-level lints against budgets/supabase-advisor.json so a
 *     net-new warning blocks the PR even if the absolute count is high.
 *   - Allows pre-existing WARNs through (catalogued by `cache_key` in the
 *     budget file) so a warn backlog doesn't gate ship.
 *
 * Required env:
 *   SUPABASE_PROJECT_REF   — project ref (e.g. xrovijzjbyssajhtwvas)
 *   SUPABASE_ACCESS_TOKEN  — personal access token with Advisor:read scope
 *
 * Usage:
 *   node scripts/ci/supabase-advisor-gate.mjs
 *   node scripts/ci/supabase-advisor-gate.mjs --update  # rewrite the budget
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUDGET_PATH = resolve(__dirname, "../../budgets/supabase-advisor.json");

const ref = process.env.SUPABASE_PROJECT_REF;
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!ref || !token) {
  console.error("Missing SUPABASE_PROJECT_REF or SUPABASE_ACCESS_TOKEN — skipping.");
  process.exit(0);
}

async function fetchAdvisor(kind /* 'security' | 'performance' */) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/advisors/${kind}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Advisor fetch failed (${kind}): ${r.status} ${text.slice(0, 200)}`);
  }
  const body = await r.json();
  return body.lints ?? [];
}

const [security, perf] = await Promise.all([fetchAdvisor("security"), fetchAdvisor("performance")]);
const all = [...security, ...perf];

const errors = all.filter((l) => l.level === "ERROR");
const warns = all.filter((l) => l.level === "WARN");

const budget = existsSync(BUDGET_PATH)
  ? JSON.parse(readFileSync(BUDGET_PATH, "utf8"))
  : { allowedErrorKeys: [], allowedWarnKeys: [] };

const allowedErrorKeys = budget.allowedErrorKeys ?? [];
const allowedWarnKeys = budget.allowedWarnKeys ?? [];

const newErrors = errors.filter((l) => !allowedErrorKeys.includes(l.cache_key));
const newWarns = warns.filter((l) => !allowedWarnKeys.includes(l.cache_key));

if (process.argv.includes("--update")) {
  writeFileSync(
    BUDGET_PATH,
    JSON.stringify(
      {
        allowedErrorKeys: errors.map((l) => l.cache_key).sort(),
        allowedWarnKeys: warns.map((l) => l.cache_key).sort(),
      },
      null,
      2,
    ) + "\n",
  );
  console.info(`Updated ${BUDGET_PATH} with ${errors.length} error keys + ${warns.length} warn keys.`);
  process.exit(0);
}

let hasFailure = false;

if (newErrors.length > 0) {
  console.error(`::error::Supabase advisor returned ${newErrors.length} NEW ERROR-level lint(s):`);
  for (const e of newErrors) {
    console.error(`  - [${e.name}] ${e.title} — ${e.detail ?? ""}`);
    if (e.remediation) console.error(`    fix: ${e.remediation}`);
  }
  console.error(
    `If these are accepted-by-design (e.g. PostGIS system tables), add the cache_key to allowedErrorKeys in budgets/supabase-advisor.json.`,
  );
  hasFailure = true;
}

if (newWarns.length > 0) {
  console.error(`::error::Supabase advisor returned ${newWarns.length} NEW WARN-level lint(s):`);
  for (const w of newWarns) {
    console.error(`  - [${w.name}] ${w.title} — ${w.detail ?? ""}`);
    if (w.remediation) console.error(`    fix: ${w.remediation}`);
  }
  console.error(
    `If these are accepted-by-design, run \`node scripts/ci/supabase-advisor-gate.mjs --update\` locally and commit the updated budgets/supabase-advisor.json.`,
  );
  hasFailure = true;
}

const allowedErrors = errors.length - newErrors.length;
const allowedWarns = warns.length - newWarns.length;
console.info(
  `Advisor: ${errors.length} errors (${allowedErrors} pre-budgeted, ${newErrors.length} new) / ${warns.length} warns (${allowedWarns} pre-budgeted, ${newWarns.length} new)`,
);

process.exit(hasFailure ? 1 : 0);
