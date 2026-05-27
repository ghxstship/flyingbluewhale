import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * API canon guardrail.
 *
 * Per CLAUDE.md (`Conventions › API`):
 *   "All endpoints under `/api/v1/*`. Use `apiOk`, `apiCreated`, `apiError`,
 *    `parseJson` from `@/lib/api`. Guard with `withAuth` from `@/lib/auth`.
 *    Zod-validate all inputs at the boundary."
 *
 * The `NextResponse.json` ban is already enforced by the project's ESLint
 * `no-restricted-syntax` rule (see `eslint.config.mjs`). This spec adds the
 * complementary check that body-bearing handlers (POST/PUT/PATCH) consume
 * the request body via `parseJson(req, schema)` (which validates with Zod
 * at the boundary) — never via raw `req.json()` / `request.json()`.
 *
 * Allowlist: routes that legitimately bypass the helper because they
 * implement an external RFC contract (SCIM 2.0) or have a documented
 * empty-body tolerance for DELETE.
 */

const REPO_ROOT = process.cwd();
const API_ROOT = join(REPO_ROOT, "src/app/api");

// Routes that DO NOT need to use parseJson, with reason.
const ALLOWLIST = new Set<string>([
  // SCIM 2.0 RFC implementation — must serve `application/scim+json` and the
  // SCIM error schema, neither of which fits the ATLVS api envelope. The
  // routes validate input shapes via dedicated SCIM helpers.
  "src/app/api/scim/v2/Users/route.ts",
  "src/app/api/scim/v2/Users/[id]/route.ts",
  "src/app/api/scim/v2/Groups/route.ts",
  "src/app/api/scim/v2/ServiceProviderConfig/route.ts",
  // Stripe webhook — the body must be the raw bytes (HMAC verification).
  // It cannot be JSON-parsed before signature check.
  "src/app/api/v1/webhooks/stripe/route.ts",
]);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name.startsWith(".")) continue;
      out.push(...walk(full));
    } else if (st.isFile() && /route\.ts$/.test(full)) {
      out.push(full);
    }
  }
  return out;
}

const ROUTES = walk(API_ROOT);

// Detect routes that handle a body-bearing HTTP method.
const HANDLES_BODY_RE = /export\s+(async\s+)?function\s+(POST|PUT|PATCH)\b|export\s+const\s+(POST|PUT|PATCH)\b/;
// Detect raw req.json() / request.json() usage.
const RAW_JSON_RE = /\b(req|request|_req|_request)\.json\s*\(\s*\)/;

describe("API canon — parseJson enforcement", () => {
  it("/api/v1/* body-bearing handlers consume the request body via parseJson(req, schema)", () => {
    const offenders: string[] = [];
    for (const file of ROUTES) {
      const rel = relative(REPO_ROOT, file);
      if (ALLOWLIST.has(rel)) continue;
      const txt = readFileSync(file, "utf8");
      if (!HANDLES_BODY_RE.test(txt)) continue;
      if (!RAW_JSON_RE.test(txt)) continue;
      // If the file uses parseJson AND raw .json() (DELETE empty-body case),
      // verify the raw .json() lives inside a DELETE handler (which is allowed
      // because DELETE bodies are optional). Crude check: split by `export`
      // and look at the segment that contains the raw .json() call.
      const segments = txt.split(/export\s+(?:async\s+)?function\s+/);
      let allRawIsDelete = true;
      for (const seg of segments) {
        if (!RAW_JSON_RE.test(seg)) continue;
        if (!/^DELETE\b/.test(seg)) {
          allRawIsDelete = false;
          break;
        }
      }
      if (allRawIsDelete) continue;
      offenders.push(rel);
    }
    expect(
      offenders,
      `API routes use raw req.json() instead of parseJson(req, schema). Each handler that reads a body MUST validate it with Zod via parseJson — that's the boundary contract. Offenders: ${offenders.join(", ")}`,
    ).toEqual([]);
  });

  it("every /api/v1/* route imports from @/lib/api (apiOk / apiError / apiCreated / parseJson)", () => {
    const offenders: string[] = [];
    const V1_ALLOW: Set<string> = new Set<string>([
      // openapi.json serves the raw spec document — not the api envelope.
      "src/app/api/v1/openapi.json/route.ts",
      // Webhook returns short-circuit Responses on signature failure before
      // it reaches any envelope code path.
      "src/app/api/v1/webhooks/stripe/route.ts",
      // ICS calendar feed serves text/calendar, not JSON.
      "src/app/api/v1/users/[userId]/calendar.ics/route.ts",
      // OAuth initiator — every code path returns NextResponse.redirect (302)
      // either to the provider URL or to /login with an error param. There's
      // no JSON envelope to surface; using apiError would break the redirect
      // contract OAuth callers depend on.
      "src/app/api/v1/auth/oauth/route.ts",
      // GraphQL — serves the GraphQL wire protocol via graphql-yoga. The
      // response format is dictated by the GraphQL spec (application/graphql+json),
      // not the ATLVS { ok, data } envelope. @/lib/api helpers are not applicable.
      "src/app/api/v1/graphql/route.ts",
    ]);
    const V1_RE = /^src\/app\/api\/v1\//;
    for (const file of ROUTES) {
      const rel = relative(REPO_ROOT, file);
      if (!V1_RE.test(rel)) continue;
      if (V1_ALLOW.has(rel)) continue;
      const txt = readFileSync(file, "utf8");
      if (!/from\s+["']@\/lib\/api["']/.test(txt)) {
        offenders.push(rel);
      }
    }
    expect(
      offenders,
      `/api/v1/* routes don't import from @/lib/api — every endpoint should use apiOk / apiCreated / apiError / parseJson so the { ok, data } envelope is consistent. Offenders: ${offenders.join(", ")}`,
    ).toEqual([]);
  });
});
