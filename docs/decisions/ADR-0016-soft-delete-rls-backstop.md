# ADR-0016 — DB-level soft-delete read backstop (RLS)

**Status:** Proposed (design resolved, migration NOT yet applied) · **Date:** 2026-07-10 · **Owner:** platform

## Context

The 2026-07-10 health remediation confirmed soft-delete read leaks are a recurring class: 419 unfiltered select chains existed across the 109 `deleted_at` tables (168 in page files), including externally visible ones (deleted invoices in portal P&L, deleted store products purchasable). The app layer is now guarded — `fromScoped()` in `src/lib/db/resource.ts` pre-applies `deleted_at IS NULL`, and `src/lib/db/soft-delete-canon.test.ts` fails CI on new unfiltered chains (legacy allowlist is ratchet-only). But an app-layer guard cannot protect raw PostgREST/API consumers or future code that bypasses the helper: only RLS makes a leak impossible.

## Decision (proposed)

Add a DB-level backstop **without breaking the Trash/undo surfaces**, which legitimately read soft-deleted rows (`withArchived`, `restoreOrgScoped`, `/studio/trash`):

1. **Do NOT use a blanket `RESTRICTIVE` SELECT policy** (`USING (deleted_at IS NULL)`). It ANDs with every permissive policy and would break Trash, restore, and the delete-undo toasts for all roles. This was the naive design and it is rejected.
2. Instead, per soft-deletable table, split visibility by band:
   - Member-band SELECT policies gain `AND deleted_at IS NULL` (external/portal personas and plain members never see archived rows at the DB level).
   - Manager-band (owner/admin/controller/collaborator — `MANAGER_BAND_ROLES` in `src/lib/auth.ts`) keeps archived-row visibility, because Trash/restore is a manager+ surface and `restoreOrgScoped` runs under those sessions.
3. Roll out in three waves so a policy mistake is caught small: (a) the 14 externally-visible tables fixed in HP-10 (invoices, products/orders, proposals, deliverables …), (b) the remaining portal/mobile-read tables, (c) the console-only tail. Each wave = one migration, each policy change verified by `scripts/cross-tenant-isolation-probe.mjs` plus a new probe asserting a soft-deleted fixture row is invisible to a member session and visible to a manager session.

## Why not applied in the 2026-07-10 pass

The remediation pass carried a zero-behavioral-change bar and a no-migrations rule for its fix agents; this change intentionally alters DB-level visibility and needs the per-table policy audit (95 of 109 tables have SELECT policies that don't reference `deleted_at`, each shaped differently). It is deliberately staged behind this ADR rather than rushed.

## Consequences

- Until applied, the app-layer chokepoint + canon test are the only guard; raw API consumers can still read archived rows their RLS otherwise allows.
- When applied, the `soft-delete-canon.test.ts` allowlist can be aggressively shrunk, since a missed app filter no longer leaks.
