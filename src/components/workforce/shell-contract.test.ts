import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Canon guard for the portal/mobile shell contract (ADR-0008 Amendment 4).
 *
 * `PortalHref` makes a `/m/**` CTA a compile error where it passes through a
 * shared surface's props. It cannot see a `<Link href="/m/clock">` hardcoded
 * straight into a portal page — and hardcoded deep links are exactly how the
 * drift got in the first time, so prose alone has a track record here.
 *
 * The rule: no route under `(portal)` may reference a `/m/**` URL, with a
 * short allow-list of cases that are honest and reviewed.
 *
 * If you're here because this test failed: you almost certainly want to build
 * the write portal-side. The bar for adding an exemption is that the write
 * genuinely needs a field capability the browser cannot honestly provide —
 * geofence truth, offline durability, or the camera as a sensor. "It already
 * exists in COMPVSS" is not that bar; that's the friction the ADR exists to
 * remove.
 */

const PORTAL_ROOT = join(process.cwd(), "src/app/(portal)");

/**
 * Reviewed exemptions, each with the reason it is not a defect.
 *
 * `messages/[roomId]/actions.ts` — the inbox fan-out on a portal message
 * notifies the OTHER side of the thread, which is org staff on COMPVSS. The
 * `/m/inbox/...` href is that recipient's correct destination, not the portal
 * author's.
 */
const ALLOWED: { file: string; reason: string }[] = [
  {
    file: "p/[slug]/messages/[roomId]/actions.ts",
    reason: "Inbox fan-out href targets the org-staff recipient on COMPVSS, not the portal author.",
  },
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(tsx?|ts)$/.test(entry)) out.push(full);
  }
  return out;
}

/** Matches a `/m/...` URL in a string literal or template literal. */
const MOBILE_HREF = /["'`]\/m\/[a-z0-9[\]/-]*/gi;

/**
 * Strip comments before matching.
 *
 * Without this the guard flags its own paper trail: the docblocks explaining
 * *why* a surface no longer links to `/m/time-off/new` all name the route
 * they replaced. Prose about a deep link is not a deep link, and a guard that
 * punishes writing down the reason teaches people to stop writing it down.
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

describe("portal/mobile shell contract (ADR-0008 Amendment 4)", () => {
  it("no (portal) route deep-links into the COMPVSS /m shell", () => {
    const offenders: string[] = [];

    for (const file of walk(PORTAL_ROOT)) {
      const rel = file.slice(file.indexOf("(portal)/") + "(portal)/".length);
      if (ALLOWED.some((a) => rel === a.file)) continue;

      const src = stripComments(readFileSync(file, "utf8"));
      const hits = src.match(MOBILE_HREF);
      if (hits) offenders.push(`${rel} → ${[...new Set(hits)].join(", ")}`);
    }

    expect(
      offenders,
      `Portal routes may not deep-link into COMPVSS. The portal advertising an app its reader may not even be ` +
        `entitled to open is the defect ADR-0008 Amendment 4 closed. Build the write portal-side, or — if it ` +
        `truly needs a field capability (geofence, offline durability, camera-as-sensor) — state that with a ` +
        `ClockInDisposition-style explicit union and add a reviewed entry to ALLOWED here.\n\n` +
        offenders.join("\n"),
    ).toEqual([]);
  });

  it("the vendor persona is never pointed at COMPVSS, which it cannot reach", () => {
    // The `partner` band is {gvteway: full, cvrgo: ro} — no compvss reach at
    // all. This is the sharper half of the defect: for crew the handoff was
    // friction, for a vendor it was a link into a locked door.
    const entitlements = JSON.parse(readFileSync(join(process.cwd(), "src/lib/entitlements.json"), "utf8")) as {
      personas: { id: string; reach: Record<string, string> | "all" }[];
    };
    const partner = entitlements.personas.find((p) => p.id === "partner");
    expect(partner, "the `partner` persona must exist in entitlements.json").toBeTruthy();

    // Guard the premise, not just the conclusion: if a future kit revision
    // grants partners COMPVSS reach, this test should fail loudly so the
    // vendor pages' `clockIn: "none"` gets revisited on purpose rather than
    // quietly staying wrong.
    const reach = partner!.reach;
    expect(
      reach === "all" ? "all" : reach.compvss,
      'partner/vendor gained COMPVSS reach — revisit clockIn: "none" on the vendor portal pages.',
    ).toBeUndefined();
  });
});
