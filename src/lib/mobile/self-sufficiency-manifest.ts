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
    note: "G3. The parity half SHIPPED — mobile mirrors the console's manager+ gate via the shared transitionAssetState, verified writing an asset_movements ledger row. BLOCKED on a product decision for the rest: may CREW take custody of their own gear? That is a new authorization model, not a port.",
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
    note: "G1 — the flagship gap. RLS HALF SHIPPED (20260715150000, verified under a real member JWT): a member may now file as themselves. The SURFACE is not built. expenses.receipt_path is still populated by NO surface in the repo, console included.",
  },
  {
    id: "requisition.raise",
    label: "Raise a purchase requisition from site",
    state: "gap",
    roles: ALL,
    note: "G19. RLS half shipped (20260715160000, verified). Surface not built.",
  },
  {
    id: "mileage.log",
    label: "Log a drive",
    state: "gap",
    roles: WORKS_ON_SITE,
    note: "G21. RLS half shipped (20260715160000, verified). Surface not built. GPS + metersBetween already exist.",
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
    state: "gap",
    roles: ["owner", "admin"],
    note: "G18/G26. Zero admin surface on mobile — there is no isAdmin/isOwner call site anywhere in (mobile). An owner on site can do nothing administrative.",
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
    note: "G36 + S5. Only 5 fetch endpoints queue durably (IndexedDB outbox). Every mobile server action outside them loses the submission. Photos can't queue at all — the localStorage queue does String(v), which is the same coercion that produced the phantom photos; the daily-log form now refuses honestly rather than pretending.",
  },
];

/** Cells that need a human, not code. Surfaced so they can't be forgotten. */
export const OPEN_DECISIONS: readonly { id: string; question: string }[] = [
  {
    id: "asset.custody",
    question:
      "May CREW take custody of their own gear, or is asset movement manager-device only? transitionAsset has always refused the member band; mobile now mirrors that exactly. Changing it is a new policy.",
  },
];
