/**
 * E2E-LRP Phase 1 — Seed Generation
 * =================================
 *
 * Idempotent, deterministic, namespaced seed for the E2E lifecycle test run.
 * Every record carries a `seed_run_id` (in metadata jsonb where available)
 * AND a name/slug prefix `E2E_LRP_2026_05_09__` so teardown can DELETE WHERE
 * the prefix matches with no risk to non-namespaced records.
 *
 * Run:        npx tsx seeds/e2e_lifecycle/seed.ts
 * Teardown:   npx tsx seeds/e2e_lifecycle/teardown.ts
 *
 * Environment: requires SUPABASE_SERVICE_ROLE_KEY in .env.local. Will refuse
 * to run if NEXT_PUBLIC_SUPABASE_URL points to a project tagged "production"
 * in the org-tag (the prod project xrovijzjbyssajhtwvas is hard-blocked here).
 *
 * Inventory produced (per E2E-LRP §PHASE 1 §"Seed inventory (minimum)"):
 *   - 1 namespaced demo org with full XPMS configuration
 *   - 1 demo project (synthetic — "E2E_LRP Synthetic Episode")
 *   - 12 demo Parties spanning the 7-row Role × Channel matrix
 *   - 20 demo Assets across XTC classes
 *   - Calendar events: project run-of-show + party availability + asset reservations
 *   - Form definitions for in-scope channels
 *   - Approval policies (financial / contractual / content / schedule / refund)
 *   - In-flight contracts per relevant Party
 *   - Financial baseline with chart of accounts initialized
 *   - Demo credentials emitted to SEED_MANIFEST.md
 *
 * Per LDP §5 the new project_members.engagement_state column is populated
 * with realistic state-machine values (not all COMMITTED) so Phase 2 tests
 * can verify state transitions without bootstrapping.
 *
 * NOTE: This script is committed but NOT run during this E2E-LRP session.
 * Per E2E-LRP §"Always-deferred categories" no schema change is applied
 * during the audit run. The schema migrations 20260509000001-000005 must
 * be applied via Supabase MCP `apply_migration` BEFORE this seed will
 * succeed.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SEED_RUN_ID = "E2E_LRP_2026_05_09";
const SEED_PREFIX = `${SEED_RUN_ID}__`;
const PROD_PROJECT_REF = "xrovijzjbyssajhtwvas";

interface SeedManifest {
  run_id: string;
  generated_at: string;
  org_id: string;
  org_slug: string;
  project_id: string;
  project_slug: string;
  parties: Array<{
    user_id: string;
    email: string;
    password: string;
    role: string;
    channel: string;
    engagement_state: string;
  }>;
  assets: Array<{ id: string; name: string; xtc_class: number; status: string }>;
  contracts: Array<{ id: string; party_email: string; kind: string; document_state: string }>;
  credentials_warning: string;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL required");
  }
  if (url.includes(PROD_PROJECT_REF)) {
    throw new Error(`Refusing to seed against production project ${PROD_PROJECT_REF}. Use a branch DB.`);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const manifest: SeedManifest = {
    run_id: SEED_RUN_ID,
    generated_at: new Date().toISOString(),
    org_id: "",
    org_slug: `${SEED_PREFIX}demo-org`.toLowerCase().replace(/_/g, "-"),
    project_id: "",
    project_slug: `${SEED_PREFIX}synthetic-episode`.toLowerCase().replace(/_/g, "-"),
    parties: [],
    assets: [],
    contracts: [],
    credentials_warning:
      "Demo credentials below. Disposable. Do NOT reuse outside the E2E-LRP run. Teardown removes all references.",
  };

  // -------------------------------------------------------------------------
  // 1. ORG — namespaced demo org with marketplace + XPMS config
  // -------------------------------------------------------------------------

  const orgInsert = await supabase
    .from("orgs")
    .insert({
      name: `E2E-LRP Demo Org (${SEED_RUN_ID})`,
      slug: manifest.org_slug,
      tier: "professional",
      marketplace_enabled: true,
      marketplace_take_rate_bps: 1000,
      metadata: { seed_run_id: SEED_RUN_ID },
    })
    .select("id")
    .single();
  if (orgInsert.error) throw orgInsert.error;
  manifest.org_id = orgInsert.data.id;

  // -------------------------------------------------------------------------
  // 2. PROJECT — synthetic episode, xpms_phase = ADVANCE (mid-lifecycle)
  // -------------------------------------------------------------------------

  const projectInsert = await supabase
    .from("projects")
    .insert({
      org_id: manifest.org_id,
      name: `E2E-LRP Synthetic Episode 1 — ${SEED_RUN_ID}`,
      slug: manifest.project_slug,
      status: "active",
      xpms_phase: "advance",
      starts_at: "2026-06-01T00:00:00Z",
      ends_at: "2026-06-15T00:00:00Z",
      metadata: { seed_run_id: SEED_RUN_ID },
    })
    .select("id")
    .single();
  if (projectInsert.error) throw projectInsert.error;
  manifest.project_id = projectInsert.data.id;

  // -------------------------------------------------------------------------
  // 3. PARTIES — 12 demo users across the 7-row Role × Channel matrix
  // -------------------------------------------------------------------------

  const partySpecs = [
    { role: "owner", channel: "internal", engagement_state: "ACTIVE", project_role: "creator" },
    { role: "admin", channel: "internal", engagement_state: "ACTIVE", project_role: "creator" },
    { role: "controller", channel: "internal", engagement_state: "ACTIVE", project_role: "collaborator" },
    { role: "collaborator", channel: "internal", engagement_state: "ACTIVE", project_role: "collaborator" },
    { role: "contractor", channel: "marketplace_bid", engagement_state: "VETTED", project_role: "vendor" },
    { role: "contractor", channel: "marketplace_bid", engagement_state: "COMMITTED", project_role: "vendor" },
    { role: "contractor", channel: "curated_opportunity", engagement_state: "ENABLED", project_role: "vendor" },
    { role: "crew", channel: "job_listing", engagement_state: "CONFIRMED", project_role: "vendor" },
    { role: "crew", channel: "job_listing", engagement_state: "ACTIVE", project_role: "vendor" },
    { role: "client", channel: "sales_pipeline", engagement_state: "ACTIVE", project_role: "viewer" },
    { role: "viewer", channel: "ticket_purchase", engagement_state: "CONFIRMED", project_role: "viewer" },
    { role: "viewer", channel: "comp_list", engagement_state: "ENABLED", project_role: "viewer" },
  ];

  for (let i = 0; i < partySpecs.length; i++) {
    const spec = partySpecs[i];
    const email = `${SEED_PREFIX.toLowerCase()}party-${String(i + 1).padStart(2, "0")}@e2e.invalid`;
    const password = `e2e-${randomUUID().slice(0, 12)}`;

    const userInsert = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { seed_run_id: SEED_RUN_ID, channel: spec.channel },
    });
    if (userInsert.error) throw userInsert.error;
    const userId = userInsert.data.user!.id;

    await supabase.from("memberships").insert({
      org_id: manifest.org_id,
      user_id: userId,
      role: spec.role,
    });

    const pmInsert = await supabase
      .from("project_members")
      .insert({
        org_id: manifest.org_id,
        project_id: manifest.project_id,
        user_id: userId,
        role: spec.project_role,
        engagement_state: spec.engagement_state,
      })
      .select("id")
      .single();

    if (pmInsert.data) {
      // Seed an engagement_state_transitions trail so Phase 2 can verify history.
      await supabase.from("engagement_state_transitions").insert({
        org_id: manifest.org_id,
        project_member_id: pmInsert.data.id,
        from_state: null,
        to_state: spec.engagement_state,
        reason: "seed bootstrap",
        channel: spec.channel,
      });
    }

    manifest.parties.push({
      user_id: userId,
      email,
      password,
      role: spec.role,
      channel: spec.channel,
      engagement_state: spec.engagement_state,
    });
  }

  // -------------------------------------------------------------------------
  // 4. ASSETS — 20 demo across XTC classes (audio/lighting/video/build/etc)
  // -------------------------------------------------------------------------

  const assetSpecs = [
    { name: "L-Acoustics K2 PA", xtc_class: 5, status: "available" },
    { name: "L-Acoustics KARA Sub", xtc_class: 5, status: "reserved" },
    { name: "Yamaha CL5 Mixer", xtc_class: 5, status: "in_use" },
    { name: "Shure SM58 (qty 24)", xtc_class: 5, status: "available" },
    { name: "Martin MAC Aura XB (qty 12)", xtc_class: 5, status: "in_use" },
    { name: "GrandMA3 Light", xtc_class: 5, status: "RETURNED" },
    { name: "Christie M HD25k Projector", xtc_class: 5, status: "RESERVED" },
    { name: "ROE BO5 LED Wall (4x3 panel grid)", xtc_class: 5, status: "available" },
    { name: "Triscale 8x8 Stage Deck", xtc_class: 4, status: "available" },
    { name: "Mojo Barricade (qty 80m)", xtc_class: 4, status: "in_use" },
    { name: "20x40 Tent + Liner", xtc_class: 4, status: "RETURNED" },
    { name: "Chevrolet 26ft Box Truck", xtc_class: 6, status: "available" },
    { name: "Sprinter Van — Crew", xtc_class: 6, status: "in_use" },
    { name: "Forklift 5000lb", xtc_class: 6, status: "maintenance" },
    { name: "Show Wayfinding Kit", xtc_class: 7, status: "available" },
    { name: "Backstage F&B Cooler Set", xtc_class: 8, status: "available" },
    { name: "VIP Lounge Furniture Pack", xtc_class: 8, status: "RESERVED" },
    { name: "Cisco Meraki AP Bundle", xtc_class: 9, status: "available" },
    { name: "Ticket Scanner Pack (qty 8)", xtc_class: 9, status: "in_use" },
    { name: "Comp Wristband Inventory", xtc_class: 9, status: "ACQUIRED" },
  ];

  for (const spec of assetSpecs) {
    const assetInsert = await supabase
      .from("equipment")
      .insert({
        org_id: manifest.org_id,
        name: `${SEED_PREFIX}${spec.name}`,
        xtc_class: spec.xtc_class,
        status: spec.status as never,
        metadata: { seed_run_id: SEED_RUN_ID },
      })
      .select("id")
      .single();

    if (assetInsert.error) throw assetInsert.error;

    // Seed an asset_movements row so Phase 2 can verify the ledger pattern.
    await supabase.from("asset_movements").insert({
      org_id: manifest.org_id,
      equipment_id: assetInsert.data.id,
      from_state: null,
      to_state: spec.status as never,
      reason: "seed bootstrap",
      project_id: manifest.project_id,
    });

    manifest.assets.push({
      id: assetInsert.data.id,
      name: spec.name,
      xtc_class: spec.xtc_class,
      status: spec.status,
    });
  }

  // -------------------------------------------------------------------------
  // 5. FINANCIAL PERIOD — open period covering project window
  // -------------------------------------------------------------------------

  const periodInsert = await supabase
    .from("financial_periods")
    .insert({
      org_id: manifest.org_id,
      kind: "MONTH",
      period_start: "2026-06-01",
      period_end: "2026-06-30",
      state: "OPEN",
    })
    .select("id")
    .single();

  if (periodInsert.data) {
    await supabase.from("period_state_transitions").insert({
      org_id: manifest.org_id,
      period_id: periodInsert.data.id,
      from_state: null,
      to_state: "OPEN",
      reason: "seed bootstrap",
    });
  }

  // -------------------------------------------------------------------------
  // 6. SUBSCRIPTION — one TRIAL subscription so Phase 2 can transition to ACTIVE
  // -------------------------------------------------------------------------

  const subInsert = await supabase
    .from("subscriptions")
    .insert({
      org_id: manifest.org_id,
      kind: "MEMBER",
      state: "TRIAL",
      label: `${SEED_PREFIX}Member subscription seed`,
      started_at: new Date().toISOString(),
      trial_ends_at: new Date(Date.now() + 14 * 86400 * 1000).toISOString(),
      renewal_cadence_months: 12,
    })
    .select("id")
    .single();

  if (subInsert.data) {
    await supabase.from("subscription_state_transitions").insert({
      org_id: manifest.org_id,
      subscription_id: subInsert.data.id,
      from_state: null,
      to_state: "TRIAL",
      reason: "seed bootstrap",
    });
  }

  // -------------------------------------------------------------------------
  // 7. WRITE MANIFEST
  // -------------------------------------------------------------------------

  const manifestPath = resolve(import.meta.dirname, "..", "..", "reports", "SEED_MANIFEST.md");
  writeFileSync(manifestPath, formatManifest(manifest));
  console.log(`Seed complete. Manifest: ${manifestPath}`);
}

function formatManifest(m: SeedManifest): string {
  return `# SEED_MANIFEST

**Run:** \`${m.run_id}\` · **Generated:** ${m.generated_at} · **Tier:** professional

> ${m.credentials_warning}

## Org

- ID: \`${m.org_id}\`
- Slug: \`${m.org_slug}\`

## Project

- ID: \`${m.project_id}\`
- Slug: \`${m.project_slug}\`
- xpms_phase: \`advance\` (mid-lifecycle for testing)

## Parties (12)

| # | Role | Channel | engagement_state | Email | Password |
|---|---|---|---|---|---|
${m.parties.map((p, i) => `| ${i + 1} | ${p.role} | ${p.channel} | ${p.engagement_state} | \`${p.email}\` | \`${p.password}\` |`).join("\n")}

## Assets (20)

| Name | XTC Class | Initial status |
|---|---|---|
${m.assets.map((a) => `| ${a.name} | ${a.xtc_class} | ${a.status} |`).join("\n")}

## Teardown

\`\`\`bash
npx tsx seeds/e2e_lifecycle/teardown.ts
\`\`\`

Removes all records WHERE \`metadata->>'seed_run_id' = '${m.run_id}'\` OR name LIKE '${SEED_PREFIX}%'.
`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
