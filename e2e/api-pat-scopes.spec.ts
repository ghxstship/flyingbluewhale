import { test, expect } from "playwright/test";
import { PAT_FIXTURES, bearer } from "./helpers/fixtures";

/**
 * C4 — Personal-access-token (Bearer) SCOPE gating on the /api/v1 surface.
 *
 * Before this spec, every documents/reports API test authenticated with a
 * cookie session, whose `scopes` are `undefined` (= wildcard), so the
 * `assertScope` branch that gates 3rd-party integrations was dead code under
 * test. This drives the real contract with three scoped PAT fixtures
 * (seeded by scripts/seed-e2e-fixtures.mjs → e2e/helpers/fixtures.ts):
 *   - documents:read       → GET documents 200; POST documents 403; reports 403
 *   - documents:read+write → POST documents 200
 *   - reports:read         → GET reports 200; documents 403
 * plus the unauthenticated 401 boundary on both scoped endpoints.
 *
 * Environment caveat: PAT auth resolves through verifyApiKey →
 * isServiceClientAvailable(), i.e. the Next server needs a service-role key.
 * Without it EVERY Bearer request 401s regardless of scope, which would make a
 * naive 403 assertion silently pass on a 401. We probe once and annotate a
 * visible skip so absence of the key is never mistaken for coverage. The
 * unauthenticated-401 test runs unconditionally.
 */
test.describe("API PAT scope gating (C4)", () => {
  let patAvailable = false;

  test.beforeAll(async ({ request }) => {
    const probe = await request.get("/api/v1/documents", { headers: bearer(PAT_FIXTURES.documentsRead) });
    patAvailable = probe.status() === 200;
  });

  const SKIP_MSG =
    "PAT/Bearer auth unavailable in this target (no service-role key on the server, or PAT fixtures unseeded). Run scripts/seed-e2e-fixtures.mjs and set SUPABASE_SERVICE_ROLE_KEY to exercise.";

  test("documents:read PAT — reads granted, write + cross-domain denied", async ({ request }) => {
    test.skip(!patAvailable, SKIP_MSG);
    const h = bearer(PAT_FIXTURES.documentsRead);
    // Granted: the catalog list + a per-type contract (both documents:read).
    expect((await request.get("/api/v1/documents", { headers: h })).status()).toBe(200);
    expect((await request.get("/api/v1/documents/invoice", { headers: h })).status()).toBe(200);
    // Denied: generate/render requires documents:write.
    const write = await request.post("/api/v1/documents/invoice", { headers: h, data: { data: {} } });
    expect(write.status()).toBe(403);
    // Denied: a documents-scoped token can't read the reports surface.
    expect((await request.get("/api/v1/reports", { headers: h })).status()).toBe(403);
  });

  test("documents:write PAT — generate granted", async ({ request }) => {
    test.skip(!patAvailable, SKIP_MSG);
    const gen = await request.post("/api/v1/documents/invoice", {
      headers: bearer(PAT_FIXTURES.documentsWrite),
      data: { data: {} },
    });
    expect(gen.status()).toBe(200);
  });

  test("reports:read PAT — reports granted, documents denied", async ({ request }) => {
    test.skip(!patAvailable, SKIP_MSG);
    const h = bearer(PAT_FIXTURES.reportsRead);
    expect((await request.get("/api/v1/reports", { headers: h })).status()).toBe(200);
    expect((await request.get("/api/v1/documents", { headers: h })).status()).toBe(403);
  });

  test("no Bearer → 401 on scoped endpoints (documents + reports)", async ({ request }) => {
    // Unconditional: asserts the unauthenticated boundary on both surfaces
    // (also closes the reports-API unauth-401 gap the audit flagged).
    expect((await request.get("/api/v1/documents")).status()).toBe(401);
    expect((await request.get("/api/v1/reports")).status()).toBe(401);
  });
});
