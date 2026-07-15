/**
 * LIFECYCLE — the account round-trip: request deletion → access dies →
 * sign back in → restore → account and membership come back.
 *
 * Closes the last untested destructive identity path the 2026-07 lifecycle
 * audit found. `/api/v1/me/delete` soft-deletes the profile (deleted_at =
 * now + 30d), revokes every membership, scrubs PII off `public.users` and
 * signs the user out; `/api/v1/me/restore` undoes all three inside the grace
 * window, rehydrating email/name from `auth.users` (which delete never
 * touches — that's the canonical identity).
 *
 * ## Why a dedicated fixture user
 *
 * Deletion is not org-scoped: it revokes the caller's memberships in EVERY
 * org. The shared fixtures (owner/admin/viewer/…) belong to all four test
 * orgs, so pointing this chain at one of them would rip them out of orgs that
 * dozens of other specs depend on — and a mid-chain failure would strand them
 * there, with no way for the teardown to heal it (a member cannot restore
 * their own soft-deleted membership; that write is service-role only).
 *
 * So this suite owns `test+disposable@flyingbluewhale.app`: a member of the
 * Starter org and NOTHING else. Its entire blast radius is one membership no
 * other spec reads.
 *
 * ## Self-healing
 *
 * Restore returns the user exactly where they started, so the chain is
 * idempotent. Test 2 depends on test 1's delete, so they run serially. If the
 * run dies between the two, `afterAll` restores; if even that fails, the
 * account simply sits soft-deleted until the next run's restore step — sign-in
 * still works throughout (auth.users is untouched), which is the whole reason
 * the grace window is recoverable.
 *
 * NOTE the delete is idempotent by design: a second request on an already
 * deleted account returns `alreadyRequested: true` rather than a fresh purgeAt.
 * Test 1 asserts the FIRST-request shape, so it must start from a live account.
 */
import { expect, test } from "./helpers/base";
import { loginAs, dismissConsent, fixtureEmail } from "./helpers/auth";

const DISPOSABLE = "disposable";
const DISPOSABLE_EMAIL = fixtureEmail(DISPOSABLE);
const CONFIRM = "delete my account";
const GRACE_DAYS = 30;

type Pg = import("playwright/test").Page;

/** Sign in fresh as the disposable user. */
async function signIn(page: Pg) {
  await dismissConsent(page);
  await loginAs(page, DISPOSABLE);
}

/** Restore the account, tolerating "nothing to restore". */
async function restore(page: Pg) {
  const r = await page.request.post("/api/v1/me/restore");
  return { status: r.status(), body: (await r.json()) as Record<string, unknown> };
}

// Serial: test 2 restores what test 1 deletes.
test.describe.configure({ mode: "serial" });

test.describe("account delete → restore round-trip", () => {
  test.afterAll(async ({ browser }) => {
    // Safety net: if the chain broke after the delete, put the account back so
    // the next run starts from a live account (test 1 asserts the first-request
    // shape, which an already-deleted account cannot produce).
    const page = await browser.newPage();
    try {
      await signIn(page);
      await restore(page);
    } catch {
      // Best-effort — never fail the run on cleanup.
    } finally {
      await page.close();
    }
  });

  test("delete request soft-deletes the account, revokes access, and signs the user out", async ({ page }) => {
    await signIn(page);

    // Sanity: the account is live and the session resolves before we destroy it.
    const before = await page.request.get("/api/v1/me");
    expect(before.status(), "the disposable fixture should start signed in and live").toBe(200);

    const res = await page.request.post("/api/v1/me/delete", { data: { confirmPhrase: CONFIRM } });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { data: { purgeAt: string; alreadyRequested?: boolean } };

    // A FIRST request returns a real purge date ~30 days out, not the
    // idempotent already-requested shape.
    expect(body.data.alreadyRequested ?? false, "fixture must start from a live account").toBe(false);
    const purgeAt = new Date(body.data.purgeAt).getTime();
    const expected = Date.now() + GRACE_DAYS * 24 * 60 * 60 * 1000;
    // ±1 day: the server stamps its own clock, and we only care that the grace
    // window is the 30-day one rather than an off-by-an-order-of-magnitude bug.
    expect(Math.abs(purgeAt - expected)).toBeLessThan(24 * 60 * 60 * 1000);

    // ACCESS DIES. The delete route signs the session out, so the very next
    // authed call must fail — this is the assertion that actually matters, and
    // the one a "returns 200" test would miss.
    const after = await page.request.get("/api/v1/me");
    expect(after.status(), "the session must be dead immediately after deletion").not.toBe(200);
  });

  test("restore inside the grace window brings back the account and its membership", async ({ page }) => {
    // Sign back IN — the grace-window design depends on auth.users surviving
    // the delete, so this must work on a soft-deleted account.
    await signIn(page);

    const { status, body } = await restore(page);
    expect(status).toBe(200);
    const data = body.data as { restored: boolean; restoredOrgIds: string[] };
    expect(data.restored, "a soft-deleted account inside the window must restore").toBe(true);
    // The membership revoked by the delete is back — restore is scoped to the
    // ±5s window around the delete request, so this proves that matcher works.
    expect(data.restoredOrgIds.length, "the Starter membership must be restored").toBeGreaterThan(0);

    // The profile is live again, with the PII rehydrated from auth.users
    // (delete scrubs public.users.email; restore reads the canonical identity).
    const me = await page.request.get("/api/v1/me");
    expect(me.status()).toBe(200);
    const meBody = (await me.json()) as { data: { email?: string } };
    expect(meBody.data.email).toBe(DISPOSABLE_EMAIL);

    // Idempotent: a second restore is a no-op, not an error.
    const again = await restore(page);
    expect(again.status).toBe(200);
    expect((again.body.data as { restored: boolean }).restored).toBe(false);
  });
});
