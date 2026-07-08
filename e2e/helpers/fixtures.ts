/**
 * Canonical e2e fixture identifiers — the durable IDs/tokens the auth + role
 * coverage specs bind to. Seeded by scripts/seed-e2e-fixtures.mjs (and mirrored
 * directly in the live DB). Keep this file in lockstep with that seeder.
 *
 * Why hard-coded: these rows are stable, org-scoped seed data (a fixed project,
 * fixed PATs). Baking the IDs in keeps each spec independent of a discovery
 * round-trip and makes a failed lookup a loud, obvious "reseed the fixtures"
 * signal rather than a silent skip.
 */

/** The four canonical Test orgs (every fixture user is a member of all four). */
export const TEST_ORGS = {
  portal: "39c5b82a-29fa-47ff-a43c-fe9c116cd27e",
  starter: "0443cdf4-384c-44ea-8de7-25e5de77d2c8",
  professional: "f4509a5f-6bcd-4a75-a6e8-01bfcc4ce5a7",
  enterprise: "e901f2c4-0c3c-496d-8d30-16e98f2eb809",
} as const;

/** The stable Professional-org project the project-role fixtures hang off. */
export const FIXTURE_PROJECT = {
  id: "f62d1228-dd83-49bf-baa4-b82242bd3056",
  slug: "test-professional-show",
  orgId: TEST_ORGS.professional,
} as const;

/**
 * Project-role assignments seeded on FIXTURE_PROJECT, keyed by the login role
 * suffix (test+<suffix>@…). These users are all platform `member` — so the
 * project_members branch of hasProjectRole (NOT the manager+ bypass) is what
 * grants/denies them. This is the axis that makes project-role authz testable.
 */
export const PROJECT_ROLE_FIXTURES = {
  member: "lead", // a non-manager project LEAD — can manage the roster
  crew: "contributor",
  contractor: "viewer", // read-only on the project — must be DENIED writes
  vendor: "vendor",
} as const;

/**
 * Scoped personal-access-token fixtures (Professional org, created_by=owner).
 * scopes[] gate independently of the issuing user's role, so these exercise
 * both grant and denial at the /api/v1 scope boundary.
 *
 * NOTE: PAT (Bearer) auth requires the Next server to have a service-role key
 * (verifyApiKey → isServiceClientAvailable). A spec using these must guard on
 * that being present in the target environment.
 */
export const PAT_FIXTURES = {
  documentsRead: "sk_e2edoc0r_documentsreadtokensecret0001",
  documentsWrite: "sk_e2edoc0w_documentswritetokensecret001",
  reportsRead: "sk_e2erpt0r_reportsreadtokensecret000001",
} as const;

/** Authorization header value for a PAT fixture. */
export function bearer(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

/**
 * A proposal on FIXTURE_PROJECT carrying a PENDING approval — the surface for
 * the proposals:approve sign-off boundary (client/viewer may sign; crew/member/
 * contractor may not). Kept pending: the C2 spec probes the capability gate
 * non-destructively (whitespace name → server-side "type your name" for those
 * who pass the gate, APPROVE_DENIED for those who don't), so it never signs.
 */
export const PROPOSAL_APPROVAL_FIXTURE = {
  projectSlug: FIXTURE_PROJECT.slug,
  orgId: TEST_ORGS.professional,
  proposalId: "c2000000-0000-4000-8000-000000000001",
  approvalId: "c2000000-0000-4000-8000-000000000002",
} as const;

/**
 * A party-bound advancing assignment: an `issued` credential whose party is
 * test+crew, on FIXTURE_PROJECT. The advancing lifecycle drives one domain
 * across three shells; this fixture lets the C3 spec assert the party sees
 * THEIR assignment on both the COMPVSS field shell (/m/advances) and the
 * GVTEWAY portal (/p/[slug]/crew/advances), and that another member does not
 * (party_user_id scoping). Title is the unambiguous assertion handle.
 */
export const ADVANCING_FIXTURE = {
  orgId: TEST_ORGS.professional,
  projectSlug: FIXTURE_PROJECT.slug,
  partyRole: "crew",
  catalogItemId: "c3000000-0000-4000-8000-000000000001",
  assignmentId: "c3000000-0000-4000-8000-000000000002",
  title: "E2E Crew Credential",
  fulfillmentState: "issued",
} as const;
