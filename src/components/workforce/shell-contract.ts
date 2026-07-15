/**
 * The portal/mobile shell contract (ADR-0008 Amendment 4).
 *
 * ADR-0008 exists to remove one friction: a crew lead on a laptop having to
 * install a mobile-first PWA to do their job. The first implementation
 * shipped the READ on desktop and left every WRITE deep-linked into
 * `/m/**` — so the ADR's own goal was defeated by its own CTAs, and for the
 * `vendor` persona it was worse than friction: the `partner` entitlement
 * band is `{gvteway: full, cvrgo: ro}` (src/lib/entitlements.json), so the
 * portal invited vendors into an app they cannot enter at all.
 *
 * The rule that resolves it, ratified 2026-07-15:
 *
 *   **The boundary is capability, not device.**
 *
 * A write belongs in the portal UNLESS it requires a field capability the
 * browser cannot honestly provide — geofence truth, offline durability, or
 * the camera as a sensor (not as a file picker). Exactly one write in this
 * codebase qualifies: the shift punch. It needs `navigator.geolocation` for
 * `geofence_state` AND the service-worker/IndexedDB outbox for durability
 * (see `src/lib/offline/outbox.ts` + `POST /api/v1/time/clock`, which is a
 * route handler rather than a server action *specifically* so the SW can
 * intercept it). A desktop punch would have neither, so porting it would not
 * be parity — it would be buddy-punching with a nicer layout.
 *
 * Everything else — time off, document upload, swap requests, onboarding,
 * chat — is a plain server action with no device dependency, and belongs in
 * the portal.
 *
 * ## Why this is a type and not a comment
 *
 * Amendment 1 established the precedent: the project-scope rule was prose in
 * the ADR for six weeks and the implementation ignored it, so the fix was to
 * make omitting `projectId` a *compile error* on the portal arm
 * (`projectId?: never` in DirectorySurface/FeedSurface). Prose did not hold.
 * This is the same move for the same reason. A future portal page cannot
 * hand a shared surface a `/m/**` CTA, because `PortalHref` will not accept
 * it — the mistake is unrepresentable rather than merely discouraged.
 */

/**
 * A CTA target reachable from the GVTEWAY portal.
 *
 * The template literal is the whole point: `"/m/clock"` is not assignable to
 * `` `/p/${string}` ``, so the exact regression this contract exists to
 * prevent fails `tsc` instead of shipping. Cross-shell links are still legal
 * where they're honest — they just have to be spelled with an explicit
 * disposition (see `ClockInDisposition`) rather than smuggled in as a string.
 */
export type PortalHref = `/p/${string}`;

/**
 * Where the shift punch happens for a given portal audience.
 *
 * The portal never punches. It either signposts COMPVSS (for an audience
 * entitled to reach it) or stays silent (for one that isn't). Making this an
 * explicit union rather than an optional href means a new portal persona page
 * must *state* which it is — there is no default that quietly advertises an
 * app the reader can't open.
 *
 * - `"compvss"` — the audience holds `compvss` reach (the `crew` band:
 *   `{compvss: full, ...}`). Render a labeled signpost that says where the
 *   punch lives and why, not a bare CTA that reads like a broken button.
 * - `"none"`   — the audience has no `compvss` reach (the `partner`/vendor
 *   band). Say nothing. A vendor doesn't punch a clock; their time reaches
 *   us through POs and invoices.
 */
export type ClockInDisposition = "compvss" | "none";

/**
 * The COMPVSS deep link for audiences entitled to it.
 *
 * Deliberately the ONE place `/m/clock` is spelled in portal-reachable code.
 * It is not a `PortalHref` and must never be passed as one — it is only ever
 * reached through a `ClockInDisposition` of `"compvss"`, which is the
 * explicit, reviewed decision that this reader can actually open the app.
 */
export const COMPVSS_CLOCK_HREF = "/m/clock";
