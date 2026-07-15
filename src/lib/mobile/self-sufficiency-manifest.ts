/**
 * COMPVSS self-sufficiency manifest — the exit test, as data.
 *
 * The parity audit asks one question: can every role complete 100% of
 * their work on COMPVSS with no desktop session? A prose answer rots the
 * day it's written. This is the machine-checkable version.
 *
 * Every role × workflow cell is exactly one of:
 *
 *   "shipped"      the field can do it, and a spec proves it
 *   "gap"          the field cannot do it yet, and we say so
 *   "console-only" a documented decision (see KIT_CANON "Console-only by
 *                  decision") — NOT a gap
 *   "blocked"      cannot proceed without a human decision, named here
 *
 * The rule the guard enforces: **no cell may be blank, and no cell may be
 * "shipped" without a spec that exercises it.** A workflow nobody can name
 * the proof for is not shipped, it is hoped.
 *
 * This is deliberately not generated. It is the claim a human makes about
 * what the product can do; the guard's job is to stop that claim drifting
 * from reality.
 */

export type CellState = "shipped" | "gap" | "console-only" | "blocked";

export type Workflow = {
  id: string;
  /** What the person is actually trying to do, in their words. */
  label: string;
  state: CellState;
  /** Roles this workflow belongs to. */
  roles: readonly FieldRole[];
  /** For "shipped": the spec that proves it. Required. */
  provenBy?: string;
  /** For "gap"/"blocked"/"console-only": why. Required. */
  note?: string;
};

/**
 * The roles that actually use COMPVSS, derived from the codebase
 * (`PlatformRole` × `Persona` in src/lib/supabase/types.ts) and collapsed
 * to the bands the shell can distinguish.
 *
 * NOTE the shell currently has exactly ONE role gate — `isManagerPlus`.
 * There is no isAdmin/isOwner call site anywhere in `(mobile)`, so
 * owner/admin are indistinguishable from manager on the device, and
 * crew/contractor/collaborator are indistinguishable from member. That
 * collapse is itself tracked (audit S1); the manifest lists the roles the
 * PRODUCT has, not the ones the shell can currently tell apart.
 */
export const FIELD_ROLES = ["owner", "admin", "manager", "crew", "contractor"] as const;
export type FieldRole = (typeof FIELD_ROLES)[number];

const ALL = FIELD_ROLES;
const MANAGER_UP = ["owner", "admin", "manager"] as const;
const WORKS_ON_SITE = ["manager", "crew", "contractor"] as const;

export const WORKFLOWS: readonly Workflow[] = [
  // ── Onboarding ──────────────────────────────────────────────────────
  {
    id: "onboard.complete",
    label: "Finish onboarding, including signing and uploading what's asked for",
    state: "gap",
    roles: ["crew", "contractor"],
    note: "G23. Every step_kind (read|sign|upload|quiz|course|form) renders as one self-attest checkbox; completeStep writes progress[stepId]=true with no artifact. The kit `sign` field and a real file input now exist (Phase 1) but are not wired into the step machine.",
  },

  // ── Daily operations ────────────────────────────────────────────────
  {
    id: "shift.see",
    label: "Know when and where I work today",
    state: "shipped",
    roles: WORKS_ON_SITE,
    provenBy: "e2e/compvss-field-loop.spec.ts · G6",
  },
  {
    id: "shift.swap",
    label: "Say I can't make a shift",
    state: "shipped",
    roles: WORKS_ON_SITE,
    provenBy: "e2e/compvss-field-loop.spec.ts · G8",
  },
  {
    id: "shift.assign",
    label: "Assign or reassign someone to a shift",
    state: "gap",
    roles: MANAGER_UP,
    note: "G7, cross-shell. `shifts` has NO writer in ANY shell — 16 rows exist in prod, all seed. The console can't do this either, so it is not a mobile parity gap; it is a product hole.",
  },
  {
    id: "clock.punch",
    label: "Clock in and out, offline if needed",
    state: "shipped",
    roles: WORKS_ON_SITE,
    provenBy: "e2e/compvss-field-personas.spec.ts (clock journey)",
  },
  {
    id: "task.create",
    label: "Write down something I spotted on site",
    state: "shipped",
    roles: ALL,
    provenBy: "e2e/compvss-field-loop.spec.ts · G13",
  },
  {
    id: "task.complete",
    label: "Finish a task assigned to me",
    state: "shipped",
    roles: ALL,
    provenBy: "migration 20260715140000 (RLS) + m/tasks/[taskId]",
  },
  {
    id: "dailylog.submit",
    label: "Write the site diary and submit it",
    state: "shipped",
    roles: WORKS_ON_SITE,
    provenBy: "e2e/compvss-field-loop.spec.ts · G9",
  },
  {
    id: "asset.custody",
    label: "Take and return custody of gear",
    state: "blocked",
    roles: WORKS_ON_SITE,
    note: "G3. Manager+ custody SHIPPED (e0da4b03) — mobile mirrors the console's gate via the shared transitionAssetState, DB-verified writing an asset_movements checkout row. Crew self-checkout: DECIDED ('assignable', 2026-07-15), and the pieces that DON'T need the resolver are now in place — `asset:custody` is in the catalog, transitionAssetState gates the two custody targets on can() (retire/maintenance stay manager+; asset-custody-grant.test.ts pins the narrowness), and /studio/settings/capabilities administers grants by role and by person, which is the part nobody had noticed was missing: ADR-0015 shipped ENFORCED but UNADMINISTERED, both grant tables had zero consumers, so turning a capability on meant SQL against prod. STILL BLOCKED on the same thing as before: `can()` has no grants branch and `resolveGrants` does not exist in HEAD, so a granted crew member still resolves to nothing and transitionAssetState falls through to isManagerPlus (i.e. today's behaviour, safely). Do NOT build a second mechanism — an org-level feature flag was tried and reverted for exactly that reason. See OPEN_DECISIONS.",
  },
  {
    id: "punchlist.raise",
    label: "Raise or close a snag",
    state: "gap",
    roles: WORKS_ON_SITE,
    note: "G10. /studio/punch is unreachable from the field. Note /m/punch is the TIME CLOCK — the name collision is fixed (Phase 0) but the surface isn't built.",
  },

  // ── Money ───────────────────────────────────────────────────────────
  {
    id: "expense.file",
    label: "Photograph a receipt and file the expense",
    state: "gap",
    roles: ALL,
    note: "G1 — the flagship gap. BUILT: /m/expenses (self-scoped list, explicit submitter_id — expenses RLS is org-member-readable, so 'everyone's spend' is one missing predicate away and /m/requests shipped exactly that bug) + /m/expenses/new mounting the kit expense spec, which had sat in UNMOUNTED_PHOTO_SPECS: written, complete, reachable from nowhere. This is the FIRST surface in the repo to populate expenses.receipt_path — the column existed and no surface, console included, ever wrote it, so 'photograph the receipt' was a product gap that mobile only made obvious. The storage question is settled by precedent, not by widening RLS: `receipts` is service-only (SERVICE_ONLY_BUCKETS) and every existing receipts upload is service-side (the AP-OCR intake), so this uploads service-side too, keeping an org-prefixed path so a future decision to open the bucket needs no re-layout. Receipt upload precedes the insert, and a failed upload degrades to a warning rather than losing the expense — the amount and date are the perishable part; the receipt is still in their camera roll. REMAINING for 'shipped': an e2e that files an expense with a photo and asserts receipt_path is non-null. Nobody has watched it work end to end.",
  },
  {
    id: "requisition.raise",
    label: "Raise a purchase requisition from site",
    state: "shipped",
    roles: ALL,
    provenBy: "e2e/compvss-field-intake.spec.ts · G19 (DB-verified: £40 → 4000 cents, draft, requester bound to caller by RLS)",
  },
  {
    id: "mileage.log",
    label: "Log a drive",
    state: "shipped",
    roles: WORKS_ON_SITE,
    provenBy: "e2e/compvss-field-intake.spec.ts · G21 (DB-verified: 12.4mi at the default 67c rate, driver bound by RLS; rate is never a form field)",
  },
  {
    id: "timesheet.submit",
    label: "Turn my punches into a timesheet",
    state: "gap",
    roles: ALL,
    note: "G22. Punch ≠ payroll: /m/clock writes time_entries only; `timesheets` is never read or written on mobile.",
  },
  {
    id: "approval.clear",
    label: "Clear the approval queue",
    state: "gap",
    roles: MANAGER_UP,
    note: "G2. /m/requests is a hand-rolled two-table queue (time-off + swaps), not the approval_instances engine. D7 (Phase 0) unblocked it — the queue no longer reads structurally zero.",
  },
  {
    id: "mywork.see",
    label: "See what I owe and what waits on me",
    state: "shipped",
    roles: ALL,
    provenBy: "G14 · m/my-work (browser-verified as crew; renders the non-manager branch)",
  },

  // ── Safety ──────────────────────────────────────────────────────────
  {
    id: "incident.file",
    label: "File an incident with photo evidence",
    state: "shipped",
    roles: ALL,
    provenBy: "e2e/compvss-field-loop.spec.ts · D3 (+ prod-verified upload: 2400px → 18KB in incident-photos)",
  },
  {
    id: "incident.triage",
    label: "Triage and close a filed incident",
    state: "gap",
    roles: MANAGER_UP,
    note: "G4. Mobile is file-and-forget; list rows aren't even links. The open→investigating→resolved→closed FSM is console-only.",
  },
  {
    id: "crisis.receive",
    label: "Find out a crisis was declared",
    state: "shipped",
    roles: ALL,
    provenBy: "src/lib/push/unsilenceable.test.ts · D8 (guard verified failing on the original defect first)",
  },
  {
    id: "crisis.respond",
    label: "Declare a code, acknowledge muster, mark myself safe",
    state: "gap",
    roles: ALL,
    note: "G39. /m/emergency is read-only — no actions.ts exists; the row chevron implies a drill-down that isn't there.",
  },
  {
    id: "briefing.signin",
    label: "Receive a toolbox talk and sign in",
    state: "gap",
    roles: WORKS_ON_SITE,
    note: "G11. The console's own empty state promises 'Crew acknowledges via mobile'. No such surface exists; an operator proxy-signs every attendee by hand. SignaturePad is now mounted in the kit (Phase 1) and unblocks this.",
  },
  {
    id: "lostfound.file",
    label: "Log a lost or found item",
    state: "shipped",
    roles: ALL,
    provenBy: "D14 · m/lost-found (+ migration 20260715130000 report_kind)",
  },
  {
    id: "guardtour.run",
    label: "Run a patrol and hit checkpoints",
    state: "gap",
    roles: ["manager", "crew"],
    note: "G12. The console's empty state promises '/m/guard'. That route does not exist, and `route: []` is inserted empty with no editor in any shell.",
  },

  // ── Admin ───────────────────────────────────────────────────────────
  {
    id: "org.invite",
    label: "Invite a member or change their role",
    state: "shipped",
    roles: ["owner", "admin"],
    provenBy: "e2e/compvss-admin.spec.ts · G18/S1 (both the admin path AND the crew refusal)",
  },
  {
    id: "org.zones",
    label: "Retune a time-clock geofence from the site it governs",
    state: "gap",
    roles: ["admin", "manager"],
    note: "G18 (Field Config). The geofence for the mobile punch surface can only be changed from a desk.",
  },
  {
    id: "org.billing",
    label: "Manage billing and seats",
    state: "console-only",
    roles: ["owner"],
    note: "Documented decision — KIT_CANON 'Console-only by decision'. Org treasury is not field work.",
  },
  {
    id: "reports.author",
    label: "Author a report",
    state: "console-only",
    roles: MANAGER_UP,
    note: "Documented decision — the .rpt-grid print canvas is desk-shaped. A field-relevant KPI SUBSET remains a real gap (G33).",
  },

  // ── Cross-cutting ───────────────────────────────────────────────────
  {
    id: "offline.durable",
    label: "Work through a dead zone without losing what I typed",
    state: "gap",
    roles: ALL,
    note: "G36 + S5. Only 5 fetch endpoints queue durably (IndexedDB outbox). Every mobile server action outside them loses the submission. Photos NO LONGER block a queued daily log: `lib/offline/photo-blobs` parks the bytes in an IndexedDB sidecar keyed by the queue item, and the payload carries a manifest — so the localStorage String(v) coercion never sees a File. The daily log is the only surface wired to it; incidents, lost & found, handover and market still take the direct path and fail outright with no signal, which is the remaining half of this gap.",
  },
];

/** Cells that need a human, not code. Surfaced so they can't be forgotten. */
export const OPEN_DECISIONS: readonly { id: string; question: string }[] = [
  {
    id: "asset.custody",
    question:
      "Still blocked on ADR-0015's resolver, but the surrounding work is done and the remaining step is now one function. `asset:custody` is in the catalog; transitionAssetState already gates the two custody targets on can(session, 'asset:custody') and keeps retire/maintenance manager+ (asset-custody-grant.test.ts pins that); /studio/settings/capabilities administers grants by role and by person with a validity window. What is missing is only the DATA half: `can()` has no grants branch and `resolveGrants` does not exist in HEAD, so a granted crew member resolves to nothing. When that lands, this cell needs no code — only an e2e that grants asset:custody to a crew fixture and checks gear out end-to-end. CAUTION, learned the hard way: the resolver exists as uncommitted work in a shared working tree, so `grep` says it's there and HEAD says it isn't. Verify against `git show HEAD:src/lib/auth.ts`, not the file on disk. SEPARATELY RESOLVED: writing grants narrowed from the manager band to admin (20260715230000) — grants are additive with no denies, so whoever writes a grant row hands out any capability, and a manager's base has no scan:* at all, making 'manager grants their own crew role scan:credential' a real escalation rather than a theoretical one.",
  },
];
