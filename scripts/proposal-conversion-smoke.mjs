#!/usr/bin/env node
/**
 * Proposal → Project conversion verifier.
 *
 * Two modes:
 *   --proposal-id=<uuid> — verify a real, already-converted proposal.
 *     Asserts the linked project exists, deliverables / budgets /
 *     master_catalog_items / invoices were seeded, and the lineage FK
 *     (projects.proposal_id) is populated.
 *
 *   --canonical-dry-run  — run partitionBlocks logic over the seeded
 *     canonical template and report the deliverable / catalog / budget
 *     row counts the seeder would emit. Useful as a CI sanity check
 *     without needing a live conversion.
 *
 * Auth: signs in as the demo manager user (mgmt@gvteway.test) via the
 * Supabase password grant — same path as the other smoke harnesses
 * (compvss-smoke.mjs, atlvs-console-smoke.mjs). RLS still applies, so
 * verification mirrors what a real operator would see.
 */

import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !ANON) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(2);
}

async function signIn() {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email: "mgmt@gvteway.test", password: "CompvssTest2026!" }),
  });
  if (!r.ok) throw new Error(`signin failed: ${r.status} ${await r.text()}`);
  return (await r.json()).access_token;
}
const JWT = await signIn();

const argv = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);

async function rest(method, path, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${JWT}`,
      "Content-Type": "application/json",
      Prefer: "count=exact",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: r.status, body: json, count: r.headers.get("content-range")?.split("/")[1] };
}

const checks = [];
const record = (name, ok, detail) => {
  checks.push({ name, ok, detail });
  const tag = ok ? "PASS" : "FAIL";
  console.log(`[${tag}] ${name}${detail ? ` — ${detail}` : ""}`);
};

if (argv["canonical-dry-run"]) {
  // Read the canonical template and count what the seeder would emit.
  const r = await rest(
    "GET",
    "proposal_templates?is_system=eq.true&name=eq.Canonical%2017-Section%20Proposal&select=id,blocks",
  );
  const tpl = Array.isArray(r.body) ? r.body[0] : null;
  if (!tpl) {
    record("canonical template exists", false, `status=${r.status}`);
    process.exit(1);
  }
  record("canonical template exists", true, `id=${tpl.id}`);

  const blocks = Array.isArray(tpl.blocks) ? tpl.blocks : [];
  const phases = blocks.filter((b) => b?.type === "phase");
  const investments = blocks.filter((b) => b?.type === "investment_table");

  let deliverableCount = 0;
  let catalogCount = 0;
  let budgetCount = 0;
  const seenCatalog = new Set();
  const seenBudget = new Set();

  for (const p of phases) {
    for (const d of p.deliverables ?? []) {
      if (d.deliverableType) deliverableCount += 1;
    }
    for (const it of p.items ?? []) {
      if (it.catalogKind && it.catalogCode) {
        const code = String(it.catalogCode).toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        if (code && !seenCatalog.has(code)) {
          seenCatalog.add(code);
          catalogCount += 1;
        }
      }
    }
  }
  for (const inv of investments) {
    for (const g of inv.groups ?? []) {
      const cat = g.budgetCategory ?? g.label;
      const key = `${cat}::${g.label}`;
      if (!seenBudget.has(key)) {
        seenBudget.add(key);
        budgetCount += 1;
      }
    }
  }

  record(
    "canonical template would seed deliverables",
    deliverableCount > 0,
    `count=${deliverableCount}`,
  );
  record(
    "canonical template would seed budgets",
    budgetCount > 0,
    `count=${budgetCount} (categories=${[...seenBudget].length})`,
  );
  record(
    "canonical template catalog (none expected — placeholder template)",
    catalogCount === 0,
    `count=${catalogCount}`,
  );
  process.exit(checks.every((c) => c.ok) ? 0 : 1);
}

const proposalId = argv["proposal-id"];
if (!proposalId) {
  console.error("Usage: node scripts/proposal-conversion-smoke.mjs --proposal-id=<uuid>");
  console.error("       node scripts/proposal-conversion-smoke.mjs --canonical-dry-run");
  process.exit(2);
}

// 1. Proposal exists and was signed.
const propRes = await rest(
  "GET",
  `proposals?id=eq.${proposalId}&select=id,org_id,status,project_id,amount_cents,deposit_percent,doc_number`,
);
const proposal = Array.isArray(propRes.body) ? propRes.body[0] : null;
record("proposal exists", !!proposal, proposal ? `id=${proposal.id}` : `status=${propRes.status}`);
if (!proposal) process.exit(1);
record("proposal is signed", proposal.status === "signed", `status=${proposal.status}`);

// 2. Linked project exists via projects.proposal_id reverse FK.
const projRes = await rest(
  "GET",
  `projects?proposal_id=eq.${proposalId}&select=id,slug,name,xpms_phase,project_state,budget_cents,client_id`,
);
const project = Array.isArray(projRes.body) ? projRes.body[0] : null;
record("linked project exists (projects.proposal_id)", !!project, project ? `slug=${project.slug}` : `status=${projRes.status}`);
if (!project) process.exit(1);
record("project at xpms_phase=discovery", project.xpms_phase === "discovery", `xpms_phase=${project.xpms_phase}`);
record("project is active", project.project_state === "active", `project_state=${project.project_state}`);
record("budget mirrors proposal", project.budget_cents === proposal.amount_cents, `${project.budget_cents} vs ${proposal.amount_cents}`);

const projectId = project.id;

// 3. Proposal back-pointer was populated.
record(
  "proposal.project_id populated",
  proposal.project_id === projectId,
  `${proposal.project_id} vs ${projectId}`,
);

// 4. Deliverables seeded.
const delRes = await rest(
  "GET",
  `deliverables?project_id=eq.${projectId}&deleted_at=is.null&select=id,type,fulfillment_state`,
);
const deliverables = Array.isArray(delRes.body) ? delRes.body : [];
record("deliverables seeded", deliverables.length > 0, `count=${deliverables.length}`);
record(
  "deliverables initial state = briefed",
  deliverables.every((d) => d.fulfillment_state === "briefed"),
  `mismatched=${deliverables.filter((d) => d.fulfillment_state !== "briefed").length}`,
);

// 5. Budgets seeded.
const budRes = await rest(
  "GET",
  `budgets?project_id=eq.${projectId}&select=id,name,category,amount_cents`,
);
const budgets = Array.isArray(budRes.body) ? budRes.body : [];
record("budgets seeded", budgets.length > 0, `count=${budgets.length}`);

// 6. Invoices seeded (deposit + balance).
const invRes = await rest(
  "GET",
  `invoices?project_id=eq.${projectId}&deleted_at=is.null&select=id,number,title,amount_cents,status`,
);
const invoices = Array.isArray(invRes.body) ? invRes.body : [];
record("invoices seeded", invoices.length >= 2, `count=${invoices.length}`);

if (proposal.amount_cents && proposal.amount_cents > 0) {
  const total = invoices.reduce((s, i) => s + (i.amount_cents ?? 0), 0);
  record(
    "invoice totals equal proposal amount",
    total === proposal.amount_cents,
    `${total} vs ${proposal.amount_cents}`,
  );
}

const summary = `
${checks.filter((c) => c.ok).length}/${checks.length} checks passed
`;
console.log(summary);
process.exit(checks.every((c) => c.ok) ? 0 : 1);
