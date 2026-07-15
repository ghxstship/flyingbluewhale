import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { tmpdir } from "node:os";

import { SOFT_DELETABLE_TABLES } from "./resource";

/**
 * Soft-delete read canon guardrail (HP-10).
 *
 * 109 tables carry `deleted_at` (SOFT_DELETABLE_TABLES in
 * `src/lib/db/resource.ts`), but the filter historically lived ONLY inside
 * listOrgScoped/getOrgScoped/listOrgScopedPage/countOrgScoped — every raw
 * `.from("<table>").select(...)` chain bypassed it, and the 2026-07-10
 * health audit found 400+ such chains leaking archived rows into live
 * surfaces (portal invoice lists, external P&L rollups, the public store's
 * cart resolution). One sweep already patched a prior wave
 * (`scripts/fix-soft-delete-leaks.py`) and the class recurred — so, like
 * the `status`-column class before it (`ldp-naming-canon.test.ts`), it now
 * fails CI instead.
 *
 * The rule: a raw `.from("<soft-deletable>")` chain that calls `.select(`
 * must either
 *   - carry a `deleted_at` filter somewhere in the SAME chain
 *     (`.is("deleted_at", null)`, `.not("deleted_at", "is", null)` for
 *     Trash views, …), or
 *   - go through the `fromScoped()` chokepoint from `@/lib/db/resource`
 *     (which pre-applies the gate and exposes `withArchived` for
 *     Trash/restore surfaces), or
 *   - be annotated on the line above (or the same line) with
 *     `soft-delete-exempt: <reason>` for the rare legitimate unfiltered
 *     read (e.g. resolving a display name for a row that may be archived).
 *
 * LEGACY_ALLOWLIST below freezes the pre-existing offender counts at the
 * time the guard landed. Entries may only ratchet DOWN: fixing a file
 * without removing/decrementing its entry fails the suite (stale grant),
 * and adding a new unfiltered chain anywhere fails it too. Do not add new
 * entries — new code uses fromScoped(), the inline filter, or an
 * annotated exemption.
 */

const REPO_ROOT = process.cwd();
const SRC_DIR = join(REPO_ROOT, "src");

const EXEMPT_MARKER = "soft-delete-exempt";

/** Files whose raw-chain scan is meaningless or self-referential. */
const SKIP_FILES = new Set<string>([
  // The chokepoint itself + the loose-client type it wraps.
  "src/lib/db/resource.ts",
  "src/lib/supabase/loose.ts",
]);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "__generated__") continue;
      walk(full, out);
    } else if (
      /\.(ts|tsx)$/.test(name) &&
      !/\.(test|spec)\.(ts|tsx)$/.test(name) &&
      !full.includes("__tests__") &&
      !name.endsWith("database.types.ts")
    ) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Given the index of the char right after `.from(...)`'s closing paren,
 * consume the rest of the fluent chain (`.method(...)` repeated, allowing
 * whitespace + comments between links) and return the end index. String
 * literals inside argument lists are skipped so parens in strings don't
 * derail the balance count.
 */
function chainEnd(src: string, start: number): number {
  let i = start;
  for (;;) {
    let j = i;
    // Skip whitespace + comments between chain links.
    for (;;) {
      while (j < src.length && /\s/.test(src[j]!)) j++;
      if (src.startsWith("//", j)) {
        const nl = src.indexOf("\n", j);
        j = nl === -1 ? src.length : nl + 1;
        continue;
      }
      if (src.startsWith("/*", j)) {
        const e = src.indexOf("*/", j);
        j = e === -1 ? src.length : e + 2;
        continue;
      }
      break;
    }
    if (src[j] !== ".") return i;
    let k = j + 1;
    if (src[k] === "!") k++; // non-null assertion between links (rare)
    while (k < src.length && /[\w$]/.test(src[k]!)) k++;
    if (src[k] !== "(") return i;
    // Consume balanced parens, skipping string/template literals.
    let depth = 0;
    let m = k;
    let quote: string | null = null;
    for (; m < src.length; m++) {
      const c = src[m]!;
      if (quote) {
        if (c === "\\") {
          m++;
          continue;
        }
        if (c === quote) quote = null;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") {
        quote = c;
        continue;
      }
      if (c === "(") depth++;
      else if (c === ")") {
        depth--;
        if (depth === 0) {
          m++;
          break;
        }
      }
    }
    i = m;
  }
}

const FROM_RE = /\.from\(\s*["'`]([a-z0-9_]+)["'`]\s*\)/g;

type Offense = { file: string; line: number; table: string };

function scanFile(fullPath: string): Offense[] {
  const rel = relative(REPO_ROOT, fullPath);
  const src = readFileSync(fullPath, "utf8");
  const offenses: Offense[] = [];
  for (const match of src.matchAll(FROM_RE)) {
    const table = match[1]!;
    if (!SOFT_DELETABLE_TABLES.has(table)) continue;
    const fromStart = match.index!;
    const afterFrom = fromStart + match[0].length;
    const end = chainEnd(src, afterFrom);
    const chain = src.slice(fromStart, end);
    // Writes (insert/update/delete/upsert without a select) are out of
    // scope — this guard is about READ leaks.
    if (!chain.includes(".select(")) continue;
    // Any deleted_at mention in the chain counts: the live-rows gate, the
    // inverted Trash filter, or selecting the column for display.
    if (chain.includes("deleted_at")) continue;
    // Annotated exemption on the same line or up to two lines above.
    const lineStartIdx = src.lastIndexOf("\n", fromStart) + 1;
    const precedingWindow = src.slice(Math.max(0, lineStartIdx - 240), end);
    if (precedingWindow.includes(EXEMPT_MARKER)) continue;
    const line = src.slice(0, fromStart).split("\n").length;
    offenses.push({ file: rel, line, table });
  }
  return offenses;
}

/**
 * Frozen offender counts at guard-landing time (2026-07-10). RATCHET-ONLY:
 * decrement/remove an entry when you fix a file; never increment, never add.
 * The bulk of these are console list/detail pages awaiting mechanical
 * migration to `fromScoped()`; notable intentional stragglers kept here
 * rather than annotated inline:
 *   - `users`-by-id display-name hydrations (archived users still need
 *     their name rendered on historical records),
 *   - Trash/restore/admin surfaces that list archived rows on purpose,
 *   - existence/slug-uniqueness probes where archived rows should still
 *     be considered (though several of those are themselves questionable —
 *     see health-p2 §2c).
 */
const LEGACY_ALLOWLIST: Record<string, number> = {
  "src/app/(legend)/legend/certifications/[holderId]/page.tsx": 1,
  "src/app/(legend)/legend/engine/rules/actions.ts": 1,
  "src/app/(legend)/legend/engine/runs/[id]/page.tsx": 1,
  "src/app/(legend)/legend/learn/[course]/page.tsx": 1,
  "src/app/(legend)/legend/profile/page.tsx": 1,
  "src/app/(legend)/legend/resources/actions.ts": 1,
  "src/app/(legend)/legend/resources/collections/actions.ts": 1,
  "src/app/(legend)/legend/signage/actions.ts": 1,
  "src/app/(mobile)/m/advances/[assignmentId]/actions.ts": 1,
  "src/app/(mobile)/m/advances/[assignmentId]/page.tsx": 1,
  "src/app/(mobile)/m/advances/actions.ts": 2,
  "src/app/(mobile)/m/advances/page.tsx": 1,
  "src/app/(mobile)/m/check-in/batch/actions.ts": 1,
  "src/app/(mobile)/m/clock/page.tsx": 2,
  "src/app/(mobile)/m/connections/page.tsx": 1,
  "src/app/(mobile)/m/daily-log/actions.ts": 1,
  "src/app/(mobile)/m/emergency/page.tsx": 2,
  "src/app/(mobile)/m/feed/page.tsx": 1,
  "src/app/(mobile)/m/handover/actions.ts": 1,
  "src/app/(mobile)/m/handover/page.tsx": 1,
  "src/app/(mobile)/m/market/page.tsx": 1,
  "src/app/(mobile)/m/onboarding/[assignmentId]/page.tsx": 1,
  "src/app/(mobile)/m/onboarding/page.tsx": 1,
  "src/app/(mobile)/m/profile/page.tsx": 2,
  "src/app/(mobile)/m/requests/page.tsx": 1,
  "src/app/(mobile)/m/settings/account/page.tsx": 1,
  "src/app/(mobile)/m/settings/page.tsx": 1,
  "src/app/(mobile)/m/tasks/[taskId]/page.tsx": 1,
  "src/app/(mobile)/m/tasks/page.tsx": 1,
  "src/app/(mobile)/m/wallet/page.tsx": 2,
  "src/app/(personal)/me/offers/page.tsx": 1,
  "src/app/(personal)/me/page.tsx": 1,
  "src/app/(personal)/me/profile/page.tsx": 1,
  "src/app/(personal)/me/reviews/new/actions.ts": 2,
  "src/app/(platform)/layout.tsx": 1,
  "src/app/(platform)/studio/advancing/deliverables/[deliverableId]/actions.ts": 1,
  "src/app/(platform)/studio/agency/tours/new/actions.ts": 2,
  "src/app/(platform)/studio/ai/agents/[agentId]/page.tsx": 1,
  "src/app/(platform)/studio/assets/[id]/page.tsx": 1,
  "src/app/(platform)/studio/assets/actions.ts": 1,
  "src/app/(platform)/studio/assets/new/actions.ts": 1,
  "src/app/(platform)/studio/assets/pull-sheets/page.tsx": 2,
  "src/app/(platform)/studio/bim/[id]/edit/actions.ts": 1,
  "src/app/(platform)/studio/bim/new/actions.ts": 1,
  "src/app/(platform)/studio/bookings/holds/new/page.tsx": 1,
  "src/app/(platform)/studio/captures/new/actions.ts": 1,
  "src/app/(platform)/studio/clients/[clientId]/branding/actions.ts": 1,
  "src/app/(platform)/studio/clients/[clientId]/branding/page.tsx": 1,
  "src/app/(platform)/studio/clients/actions.ts": 1,
  "src/app/(platform)/studio/collaborate/docs/new/actions.ts": 1,
  "src/app/(platform)/studio/collaborate/sheets/actions.ts": 1,
  "src/app/(platform)/studio/collaborate/whiteboards/actions.ts": 1,
  "src/app/(platform)/studio/commercial/hospitality/page.tsx": 1,
  "src/app/(platform)/studio/comms/announcements/[id]/actions.ts": 1,
  "src/app/(platform)/studio/comms/announcements/new/actions.ts": 1,
  "src/app/(platform)/studio/comms/polls/new/actions.ts": 1,
  "src/app/(platform)/studio/comms/surveys/[id]/actions.ts": 1,
  "src/app/(platform)/studio/comms/surveys/new/actions.ts": 1,
  "src/app/(platform)/studio/compliance/page.tsx": 1,
  "src/app/(platform)/studio/dashboards/page.tsx": 2,
  "src/app/(platform)/studio/drawings/[id]/actions.ts": 1,
  "src/app/(platform)/studio/drawings/[id]/edit/actions.ts": 1,
  "src/app/(platform)/studio/drawings/new/actions.ts": 1,
  "src/app/(platform)/studio/envelopes/actions.ts": 1,
  "src/app/(platform)/studio/estimates/[id]/page.tsx": 1,
  "src/app/(platform)/studio/estimates/new/actions.ts": 1,
  "src/app/(platform)/studio/finance/ap-ocr/actions.ts": 4,
  "src/app/(platform)/studio/finance/budgets/[budgetId]/actions.ts": 1,
  "src/app/(platform)/studio/finance/budgets/[budgetId]/page.tsx": 1,
  "src/app/(platform)/studio/finance/entities/new/actions.ts": 1,
  "src/app/(platform)/studio/finance/forecasts/new/actions.ts": 1,
  "src/app/(platform)/studio/finance/invoices/[invoiceId]/page.tsx": 1,
  "src/app/(platform)/studio/finance/invoices/actions.ts": 2,
  "src/app/(platform)/studio/finance/lien-waivers/new/actions.ts": 1,
  "src/app/(platform)/studio/finance/pay-apps/new/actions.ts": 1,
  "src/app/(platform)/studio/finance/pay-apps/new/page.tsx": 1,
  "src/app/(platform)/studio/finance/payroll/new/actions.ts": 1,
  "src/app/(platform)/studio/finance/sub-invoices/actions.ts": 1,
  "src/app/(platform)/studio/finance/timesheets/[id]/page.tsx": 1,
  "src/app/(platform)/studio/finance/timesheets/page.tsx": 1,
  "src/app/(platform)/studio/finance/treasury/page.tsx": 1,
  "src/app/(platform)/studio/goals/[id]/page.tsx": 1,
  "src/app/(platform)/studio/goals/actions.ts": 1,
  "src/app/(platform)/studio/guides/page.tsx": 1,
  "src/app/(platform)/studio/inbox/actions.ts": 4,
  "src/app/(platform)/studio/inbox/page.tsx": 1,
  "src/app/(platform)/studio/inspections/[id]/edit/page.tsx": 2,
  "src/app/(platform)/studio/inspections/new/page.tsx": 1,
  "src/app/(platform)/studio/leads/actions.ts": 1,
  "src/app/(platform)/studio/legal/contracts/new/actions.ts": 1,
  "src/app/(platform)/studio/marketplace/calls/[callId]/edit/page.tsx": 1,
  "src/app/(platform)/studio/marketplace/calls/[callId]/page.tsx": 1,
  "src/app/(platform)/studio/marketplace/calls/[callId]/submissions/[submissionId]/actions.ts": 1,
  "src/app/(platform)/studio/marketplace/calls/[callId]/submissions/page.tsx": 1,
  "src/app/(platform)/studio/marketplace/calls/new/actions.ts": 3,
  "src/app/(platform)/studio/marketplace/discounts/actions.ts": 1,
  "src/app/(platform)/studio/marketplace/discounts/promoters/actions.ts": 1,
  "src/app/(platform)/studio/marketplace/offers/[offerId]/page.tsx": 1,
  "src/app/(platform)/studio/marketplace/offers/new/page.tsx": 1,
  "src/app/(platform)/studio/marketplace/postings/[postingId]/applicants/page.tsx": 1,
  "src/app/(platform)/studio/marketplace/postings/[postingId]/edit/page.tsx": 1,
  "src/app/(platform)/studio/marketplace/postings/[postingId]/page.tsx": 1,
  "src/app/(platform)/studio/marketplace/postings/new/actions.ts": 3,
  "src/app/(platform)/studio/marketplace/talent/[talentId]/edit/page.tsx": 1,
  "src/app/(platform)/studio/marketplace/talent/[talentId]/riders/page.tsx": 1,
  "src/app/(platform)/studio/marketplace/talent/new/actions.ts": 2,
  "src/app/(platform)/studio/meetings/notes/actions.ts": 1,
  "src/app/(platform)/studio/operations/day-sheets/new/actions.ts": 1,
  "src/app/(platform)/studio/operations/day-sheets/new/page.tsx": 1,
  "src/app/(platform)/studio/operations/incidents/actions.ts": 2,
  "src/app/(platform)/studio/operations/incidents/page.tsx": 1,
  "src/app/(platform)/studio/operations/reservations/actions.ts": 3,
  "src/app/(platform)/studio/operations/schedule/page.tsx": 1,
  "src/app/(platform)/studio/photos/upload/page.tsx": 1,
  "src/app/(platform)/studio/position/forecast/page.tsx": 1,
  "src/app/(platform)/studio/procurement/compliance/page.tsx": 1,
  "src/app/(platform)/studio/procurement/network/page.tsx": 1,
  "src/app/(platform)/studio/procurement/po-change-orders/[id]/actions.ts": 2,
  "src/app/(platform)/studio/procurement/po-change-orders/new/page.tsx": 1,
  "src/app/(platform)/studio/procurement/prequalification/new/page.tsx": 1,
  "src/app/(platform)/studio/procurement/purchase-orders/[poId]/checklist/page.tsx": 1,
  "src/app/(platform)/studio/procurement/purchase-orders/actions.ts": 3,
  "src/app/(platform)/studio/procurement/receiving/[id]/page.tsx": 1,
  "src/app/(platform)/studio/procurement/requisitions/actions.ts": 1,
  "src/app/(platform)/studio/procurement/rfqs/[rfqId]/actions.ts": 1,
  "src/app/(platform)/studio/procurement/scorecards/page.tsx": 2,
  "src/app/(platform)/studio/procurement/sourcing/page.tsx": 1,
  "src/app/(platform)/studio/procurement/vendors/[vendorId]/page.tsx": 1,
  "src/app/(platform)/studio/procurement/vendors/[vendorId]/pos/page.tsx": 1,
  "src/app/(platform)/studio/procurement/vendors/[vendorId]/scorecard/page.tsx": 1,
  "src/app/(platform)/studio/procurement/wo-broadcasts/[broadcastId]/actions.ts": 1,
  "src/app/(platform)/studio/procurement/wo-broadcasts/new/page.tsx": 1,
  "src/app/(platform)/studio/production/rentals/page.tsx": 1,
  "src/app/(platform)/studio/production/work-orders/[id]/page.tsx": 1,
  "src/app/(platform)/studio/production/work-orders/[id]/thread/page.tsx": 1,
  "src/app/(platform)/studio/programs/cases/page.tsx": 1,
  "src/app/(platform)/studio/projects/[projectId]/advancing/assignments/[assignmentId]/actions.ts": 2,
  "src/app/(platform)/studio/projects/[projectId]/advancing/assignments/[assignmentId]/page.tsx": 1,
  "src/app/(platform)/studio/projects/[projectId]/advancing/assignments/actions.ts": 2,
  "src/app/(platform)/studio/projects/[projectId]/advancing/assignments/new/actions.ts": 2,
  "src/app/(platform)/studio/projects/[projectId]/advancing/assignments/page.tsx": 1,
  "src/app/(platform)/studio/projects/[projectId]/branding/page.tsx": 1,
  "src/app/(platform)/studio/projects/[projectId]/portal-preview/page.tsx": 1,
  "src/app/(platform)/studio/projects/[projectId]/sprints/new/page.tsx": 1,
  "src/app/(platform)/studio/projects/[projectId]/sprints/page.tsx": 1,
  "src/app/(platform)/studio/projects/[projectId]/stage-plots/[stagePlotId]/edit/actions.ts": 1,
  "src/app/(platform)/studio/proposals/[proposalId]/edit/actions.ts": 3,
  "src/app/(platform)/studio/proposals/[proposalId]/edit/page.tsx": 1,
  "src/app/(platform)/studio/proposals/actions.ts": 5,
  "src/app/(platform)/studio/punch/[id]/edit/actions.ts": 1,
  "src/app/(platform)/studio/punch/[id]/edit/page.tsx": 4,
  "src/app/(platform)/studio/punch/new/actions.ts": 1,
  "src/app/(platform)/studio/punch/new/page.tsx": 4,
  "src/app/(platform)/studio/rfis/[id]/edit/page.tsx": 2,
  "src/app/(platform)/studio/rfis/new/page.tsx": 2,
  "src/app/(platform)/studio/safety/briefings/new/page.tsx": 1,
  "src/app/(platform)/studio/safety/cyber-ir/page.tsx": 1,
  "src/app/(platform)/studio/safety/osha/page.tsx": 1,
  "src/app/(platform)/studio/sales/beos/actions.ts": 2,
  "src/app/(platform)/studio/sales/diary/actions.ts": 1,
  "src/app/(platform)/studio/schedule/baselines/new/actions.ts": 1,
  "src/app/(platform)/studio/settings/account-managers/[id]/page.tsx": 2,
  "src/app/(platform)/studio/settings/account-managers/page.tsx": 2,
  "src/app/(platform)/studio/settings/catalog/new/actions.ts": 1,
  "src/app/(platform)/studio/settings/integrations/submissions/[id]/actions.ts": 1,
  "src/app/(platform)/studio/settings/time-clock-zones/new/actions.ts": 1,
  "src/app/(platform)/studio/site-plans/[id]/edit/actions.ts": 2,
  "src/app/(platform)/studio/site-plans/[id]/edit/page.tsx": 1,
  "src/app/(platform)/studio/site-plans/[id]/map/page.tsx": 1,
  "src/app/(platform)/studio/site-plans/[id]/page.tsx": 6,
  "src/app/(platform)/studio/site-plans/new/actions.ts": 2,
  "src/app/(platform)/studio/site-plans/new/page.tsx": 1,
  "src/app/(platform)/studio/specs/[id]/actions.ts": 2,
  "src/app/(platform)/studio/specs/[id]/edit/actions.ts": 1,
  "src/app/(platform)/studio/specs/new/actions.ts": 1,
  "src/app/(platform)/studio/submittals/[id]/edit/page.tsx": 3,
  "src/app/(platform)/studio/submittals/new/page.tsx": 3,
  "src/app/(platform)/studio/subscriptions/actions.ts": 1,
  "src/app/(platform)/studio/takeoffs/[id]/page.tsx": 2,
  "src/app/(platform)/studio/takeoffs/new/actions.ts": 1,
  "src/app/(platform)/studio/transmittals/[id]/page.tsx": 1,
  "src/app/(platform)/studio/transmittals/new/actions.ts": 1,
  "src/app/(platform)/studio/warranties/new/actions.ts": 1,
  "src/app/(platform)/studio/workforce/onboarding/new/actions.ts": 1,
  "src/app/(platform)/studio/workforce/recognition/new/actions.ts": 1,
  "src/app/(platform)/studio/workforce/recognition/page.tsx": 1,
  "src/app/(platform)/studio/workforce/shift-swaps/page.tsx": 1,
  "src/app/(platform)/studio/workforce/time-off/page.tsx": 2,
  "src/app/(portal)/p/[slug]/artist/advancing/actions.ts": 2,
  "src/app/(portal)/p/[slug]/inbox/page.tsx": 1,
  "src/app/(portal)/p/[slug]/layout.tsx": 1,
  "src/app/(portal)/p/[slug]/messages/[roomId]/page.tsx": 1,
  "src/app/(portal)/p/[slug]/messages/page.tsx": 2,
  "src/app/(portal)/p/[slug]/messages/start/route.ts": 1,
  "src/app/(portal)/p/[slug]/page.tsx": 1,
  "src/app/(portal)/p/[slug]/producer/approvals/page.tsx": 1,
  "src/app/(portal)/p/[slug]/producer/risk/page.tsx": 1,
  "src/app/(portal)/p/[slug]/promoter/co-pro/page.tsx": 1,
  "src/app/(portal)/p/[slug]/tasks/page.tsx": 2,
  "src/app/api/scim/v2/Users/route.ts": 2,
  "src/app/api/v1/deliverable-templates/route.ts": 1,
  "src/app/api/v1/deliverables/[id]/download/route.ts": 1,
  "src/app/api/v1/deliverables/[id]/pdf/route.tsx": 2,
  "src/app/api/v1/deliverables/[id]/transition/route.ts": 2,
  "src/app/api/v1/drawings/[siteplanId]/markups/route.ts": 2,
  "src/app/api/v1/email-templates/[id]/route.ts": 1,
  "src/app/api/v1/email-templates/route.ts": 1,
  "src/app/api/v1/equipment/scan/route.ts": 1,
  "src/app/api/v1/exports/osha/route.ts": 1,
  "src/app/api/v1/guides/[guideId]/pdf/route.tsx": 2,
  "src/app/api/v1/guides/comments/route.ts": 2,
  "src/app/api/v1/handovers/route.ts": 1,
  "src/app/api/v1/import/vendors/route.ts": 1,
  "src/app/api/v1/incidents/route.ts": 2,
  "src/app/api/v1/integrations/qb-online/push/route.ts": 5,
  "src/app/api/v1/marketplace-listings/route.ts": 1,
  "src/app/api/v1/me/export/route.ts": 8,
  "src/app/api/v1/pay-apps/[payAppId]/pdf/route.tsx": 4,
  "src/app/api/v1/payroll-runs/[runId]/pdf/route.tsx": 3,
  "src/app/api/v1/payroll-runs/[runId]/state-xml/route.ts": 2,
  "src/app/api/v1/projects/[projectId]/advance-book/route.tsx": 3,
  "src/app/api/v1/projects/[projectId]/call-sheet/route.tsx": 1,
  "src/app/api/v1/projects/[projectId]/expense-report/route.tsx": 1,
  "src/app/api/v1/projects/[projectId]/signage-grid/route.tsx": 1,
  "src/app/api/v1/projects/[projectId]/wristbands/route.tsx": 1,
  "src/app/api/v1/rentals/[rentalId]/pull-sheet/route.tsx": 1,
  "src/app/api/v1/shift-notes/route.ts": 1,
  "src/app/api/v1/stage-plots/[id]/route.ts": 1,
  "src/app/api/v1/stage-plots/route.ts": 1,
  "src/app/api/v1/stripe/checkout/route.ts": 1,
  "src/app/api/v1/tasks/[taskId]/comments/route.ts": 1,
  "src/app/api/v1/webhooks/docusign/route.ts": 2,
  "src/app/api/v1/webhooks/endpoints/[id]/route.ts": 1,
  "src/app/api/v1/webhooks/endpoints/route.ts": 1,
  "src/app/api/v1/webhooks/stripe/route.ts": 2,
  "src/app/api/v1/zapier/actions/create-project/route.ts": 1,
  "src/app/api/v1/zapier/triggers/deliverables/route.ts": 1,
  "src/app/api/v1/zapier/triggers/invoices/route.ts": 1,
  "src/app/proposals/[token]/actions.ts": 2,
  "src/app/proposals/[token]/page.tsx": 3,
  "src/app/share/[token]/page.tsx": 3,
  "src/components/collab/getPresenceUser.ts": 1,
  "src/components/ldp/LdpStateTimeline.tsx": 1,
  "src/components/workforce/feed-action.ts": 1,
  "src/components/workforce/kudos-actions.ts": 1,
  "src/components/workforce/LearningSurface.tsx": 1,
  "src/lib/chat/record-refs.ts": 2,
  "src/lib/db/annotations.ts": 2,
  "src/lib/db/assignments.ts": 3,
  "src/lib/db/legend-people.ts": 1,
  "src/lib/db/projects.ts": 3,
  "src/lib/db/templates.ts": 2,
  "src/lib/documents/resolvers.ts": 26,
  "src/lib/documents/sources/invoice.ts": 3,
  "src/lib/email.ts": 1,
  "src/lib/gvteway.ts": 1,
  "src/lib/proposals/portal/mutations.ts": 2,
  "src/lib/proposals/portal/queries.ts": 2,
  "src/lib/reports/resolvers/legend.ts": 1,
  "src/lib/share/links.ts": 2,
  "src/lib/subscriptions.ts": 1,
};

describe("soft-delete read canon (HP-10)", () => {
  it("no unguarded .from(<soft-deletable>).select chain outside the frozen allowlist", () => {
    const files = walk(SRC_DIR).filter((f) => !SKIP_FILES.has(relative(REPO_ROOT, f)));
    const counts = new Map<string, Offense[]>();
    for (const f of files) {
      const offenses = scanFile(f);
      if (offenses.length > 0) counts.set(offenses[0]!.file, offenses);
    }

    const problems: string[] = [];
    for (const [file, offenses] of counts) {
      const allowed = LEGACY_ALLOWLIST[file] ?? 0;
      if (offenses.length > allowed) {
        const detail = offenses.map((o) => `:${o.line} (${o.table})`).join(", ");
        problems.push(
          `${file} has ${offenses.length} unguarded chain(s), allowlist grants ${allowed} — ${detail}`,
        );
      }
    }
    // Stale grants: file fixed (or deleted) but the allowlist entry wasn't
    // ratcheted down — keep the list honest.
    for (const [file, allowed] of Object.entries(LEGACY_ALLOWLIST)) {
      const actual = counts.get(file)?.length ?? 0;
      if (actual < allowed) {
        problems.push(`STALE allowlist entry: ${file} grants ${allowed} but has ${actual} — ratchet it down`);
      }
    }

    if (problems.length > 0) {
      // Developer convenience: dump the true current counts so the
      // allowlist can be reconciled without hand-counting.
      const actual: Record<string, number> = {};
      for (const [file, offenses] of [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
        actual[file] = offenses.length;
      }
      const dump = join(tmpdir(), "soft-delete-canon-actual.json");
      writeFileSync(dump, JSON.stringify(actual, null, 2));
      problems.push(`(actual per-file counts written to ${dump})`);
    }

    expect(
      problems,
      `Unguarded soft-deletable reads — archived rows will render in live surfaces. Fix by routing through fromScoped() from @/lib/db/resource, adding .is("deleted_at", null) to the chain, or (rare, justified) an inline \`// ${EXEMPT_MARKER}: <reason>\` annotation. Never add allowlist entries.\n  ${problems.join("\n  ")}`,
    ).toEqual([]);
  });
});
