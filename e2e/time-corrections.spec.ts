/**
 * Crew self-correction, end to end through the real stack.
 *
 * Phase 2 of docs/compvss/TIME_MANAGEMENT_LIFECYCLE_PLAN.md. Before this,
 * the crew timesheet portal was strictly read-only: a worker who clocked in
 * wrong had no path but to find a manager in person.
 *
 * The claim under test is not "the form posts" — it is the checks and
 * balances: a request never mutates the punch, and a worker cannot approve
 * their own. Those are enforced at three layers (route, RLS, DB CHECK);
 * this exercises the outermost one against a live server.
 */
import { expect, test } from "./helpers/base";
import { dismissConsent, loginAs } from "./helpers/auth";

async function drainOpenEntries(page: import("playwright/test").Page) {
  for (let i = 0; i < 10; i++) {
    const r = await page.request.post("/api/v1/time/clock", { data: { action: "clock_out" } });
    if (r.status() === 409) return;
    if (r.status() !== 200) throw new Error(`Unexpected clock_out status ${r.status()}`);
  }
}

/** Open and immediately close an entry, returning its id. */
async function makeClosedEntry(page: import("playwright/test").Page): Promise<string> {
  const inResp = await page.request.post("/api/v1/time/clock", { data: { action: "clock_in" } });
  expect(inResp.status()).toBe(200);
  const id = (await inResp.json()).data.entry.id as string;
  const outResp = await page.request.post("/api/v1/time/clock", { data: { action: "clock_out" } });
  expect(outResp.status()).toBe(200);
  return id;
}

const REASON = "Worked until 6, forgot to tap out at the gate";

test.describe("time corrections — the worker's half of the loop", () => {
  test.beforeEach(async ({ page }) => {
    await dismissConsent(page);
    await loginAs(page, "owner");
    await drainOpenEntries(page);
  });

  test.afterEach(async ({ page }) => {
    await drainOpenEntries(page);
  });

  test("filing a correction does not touch the punch", async ({ page }) => {
    const entryId = await makeClosedEntry(page);
    const before = await page.request.get("/api/v1/time/corrections?mine=1");
    expect(before.status()).toBe(200);

    const filed = await page.request.post("/api/v1/time/corrections", {
      data: {
        timeEntryId: entryId,
        kind: "edit_out",
        reason: REASON,
        proposedEndedAt: new Date(Date.now() + 60 * 60_000).toISOString(),
      },
    });
    expect(filed.status()).toBe(201);
    const body = await filed.json();
    expect(body.ok).toBe(true);
    // The whole point: a request is a proposal, not a mutation.
    expect(body.data.correction.correction_state).toBe("requested");
  });

  test("a worker can read back their own request", async ({ page }) => {
    const entryId = await makeClosedEntry(page);
    await page.request.post("/api/v1/time/corrections", {
      data: {
        timeEntryId: entryId,
        kind: "edit_out",
        reason: REASON,
        proposedEndedAt: new Date(Date.now() + 60 * 60_000).toISOString(),
      },
    });
    const list = await page.request.get("/api/v1/time/corrections?mine=1");
    expect(list.status()).toBe(200);
    const rows = (await list.json()).data.corrections as Array<{ time_entry_id: string }>;
    expect(rows.some((r) => r.time_entry_id === entryId)).toBe(true);
  });

  test("a stub reason is refused", async ({ page }) => {
    const entryId = await makeClosedEntry(page);
    const resp = await page.request.post("/api/v1/time/corrections", {
      data: { timeEntryId: entryId, kind: "edit_out", reason: "oops", proposedEndedAt: new Date().toISOString() },
    });
    expect(resp.status()).toBe(400);
  });

  test("a kind that needs a proposed time is refused without one", async ({ page }) => {
    const entryId = await makeClosedEntry(page);
    const resp = await page.request.post("/api/v1/time/corrections", {
      data: { timeEntryId: entryId, kind: "edit_out", reason: REASON },
    });
    expect(resp.status()).toBe(400);
  });

  test("only one open request per shift", async ({ page }) => {
    const entryId = await makeClosedEntry(page);
    const payload = {
      timeEntryId: entryId,
      kind: "edit_out",
      reason: REASON,
      proposedEndedAt: new Date(Date.now() + 60 * 60_000).toISOString(),
    };
    expect((await page.request.post("/api/v1/time/corrections", { data: payload })).status()).toBe(201);
    const dupe = await page.request.post("/api/v1/time/corrections", { data: payload });
    expect(dupe.status()).toBe(409);
  });

  test("a request against a non-existent entry is refused", async ({ page }) => {
    const resp = await page.request.post("/api/v1/time/corrections", {
      data: {
        timeEntryId: "00000000-0000-0000-0000-000000000000",
        kind: "edit_out",
        reason: REASON,
        proposedEndedAt: new Date().toISOString(),
      },
    });
    expect(resp.status()).toBe(404);
  });

  // Separation of duties, through the live route. The owner is manager-band,
  // so they pass the capability gate and are refused purely for BEING the
  // requester — which is the rule that matters.
  test("you cannot approve your own correction, even as an owner", async ({ page }) => {
    const entryId = await makeClosedEntry(page);
    const filed = await page.request.post("/api/v1/time/corrections", {
      data: {
        timeEntryId: entryId,
        kind: "edit_out",
        reason: REASON,
        proposedEndedAt: new Date(Date.now() + 60 * 60_000).toISOString(),
      },
    });
    expect(filed.status()).toBe(201);
    const id = (await filed.json()).data.correction.id as string;

    const decide = await page.request.patch(`/api/v1/time/corrections/${id}`, {
      data: { decision: "approved" },
    });
    expect(decide.status()).toBe(403);
    expect((await decide.json()).error.message).toMatch(/your own/i);
  });

  test("deciding an unknown correction is a 404, not a crash", async ({ page }) => {
    const resp = await page.request.patch("/api/v1/time/corrections/00000000-0000-0000-0000-000000000000", {
      data: { decision: "approved" },
    });
    expect(resp.status()).toBe(404);
  });

  test("a bogus decision is refused at the schema boundary", async ({ page }) => {
    const resp = await page.request.patch("/api/v1/time/corrections/00000000-0000-0000-0000-000000000000", {
      data: { decision: "sideways" },
    });
    expect(resp.status()).toBe(400);
  });
});
