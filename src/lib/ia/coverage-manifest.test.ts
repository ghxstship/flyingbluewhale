/**
 * E2E COVERAGE MANIFEST GUARD.
 *
 * The coverage program (2026-07) established two tiers that together cover the
 * whole product surface:
 *   - RENDER tier — data-driven crawlers (`ia-coverage*`) that walk EVERY nav
 *     route of EVERY shell + the dynamic `[id]` detail routes, as every persona.
 *   - BEHAVIORAL tier — one committed `*-coverage.spec.ts` per product domain,
 *     driving real create/edit/transition FSMs as the entitled personas.
 *
 * This guard makes that coverage NON-REGRESSABLE: it fails CI the moment a shell
 * is added without render coverage, a persona is dropped from the no-crash
 * matrix, or a behavioral domain spec is deleted. It runs in the fast vitest
 * suite (pure filesystem + source assertions — no browser, no network).
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const e2ePath = (f: string) => resolve(ROOT, "e2e", f);
const read = (f: string) => readFileSync(e2ePath(f), "utf8");

// The render tier: the three data-driven crawlers.
const RENDER_SPECS = ["ia-coverage.spec.ts", "ia-coverage-roles.spec.ts", "ia-coverage-details.spec.ts"];

// Every shell's nav SSOT export the render crawler MUST walk. Adding a shell
// without wiring its nav here leaves it render-uncovered — this guard forbids it.
const SHELL_NAV_EXPORTS = [
  "platformNavDomain", // ATLVS /studio
  "settingsNav", // /studio/settings
  "legendNav", // LEG3ND /legend
  "personalNavGroups", // /me
  "mobileTabs", // COMPVSS /m
  "mobileSurfaces",
  "marketingHeaderGroups", // marketing (public)
  "marketingFooterGroups",
];

// The full persona set the no-crash matrix must walk the console as (owner has
// the strong gate in ia-coverage; these are the other bands).
const CONSOLE_ROLES = [
  "developer",
  "admin",
  "controller",
  "collaborator",
  "contractor",
  "crew",
  "client",
  "viewer",
  "community",
];

// The behavioral tier: one committed coverage spec per product domain.
const BEHAVIORAL_DOMAINS = [
  "atlvs-sales-crm",
  "atlvs-talent",
  "atlvs-projects",
  "atlvs-procurement",
  "atlvs-production",
  "atlvs-people",
  "atlvs-ops",
  "atlvs-safety",
  "atlvs-finance",
  "atlvs-governance",
  "compvss",
  "gvteway",
  "legend",
  "personal",
];

describe("e2e coverage manifest — every surface stays covered", () => {
  it("keeps all three render-tier crawlers", () => {
    for (const f of RENDER_SPECS) {
      expect(existsSync(e2ePath(f)), `missing render-tier spec e2e/${f}`).toBe(true);
    }
  });

  it("walks every shell's nav in the render crawler (no shell silently uncovered)", () => {
    const src = read("ia-coverage.spec.ts");
    for (const nav of SHELL_NAV_EXPORTS) {
      expect(
        src.includes(nav),
        `ia-coverage.spec.ts must import ${nav} — a shell would be render-uncovered otherwise`,
      ).toBe(true);
    }
  });

  it("exercises the full non-owner persona matrix (no-crash) across the console", () => {
    const src = read("ia-coverage-roles.spec.ts");
    for (const role of CONSOLE_ROLES) {
      expect(src.includes(`"${role}"`), `role-matrix must walk the console as ${role}`).toBe(true);
    }
  });

  it("keeps a committed behavioral coverage spec for every product domain", () => {
    for (const d of BEHAVIORAL_DOMAINS) {
      expect(
        existsSync(e2ePath(`${d}-coverage.spec.ts`)),
        `missing behavioral coverage spec e2e/${d}-coverage.spec.ts`,
      ).toBe(true);
    }
  });
});
