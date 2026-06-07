-- ============================================================================
-- 20260605170000 — projects.xpms_phase → XPMS v08 8-Gate Lifecycle alignment
-- ============================================================================
-- ALIGNMENT REMEDIATION (E2E-LRP item A-1, 2026-06-05 — see
-- reports/E2E_LRP_CASA_MIAMI_READINESS.md §7 A-1).
--
-- The project macro-phase enum public.xpms_phase still held the pre-v08
-- fab-shop sequence:
--   discovery | concept | development | advance | build | show | strike | wrap
-- while budgets.xpms_phase (migration 0070), the Casa Miami proposal package,
-- and src/lib/eventkit all use the canonical XPMS v08 8-Gate Lifecycle:
--   Discovery | Design | Advance | Procurement | Build | Install | Operate | Close
-- The two phase axes were misaligned, forcing the E2E-LRP harness to map v08
-- gates onto the old enum to drive projects. This migration retires the legacy
-- value set and converts every dependent column to v08.
--
-- Columns sharing the public.xpms_phase enum (verified via pg_depend on the
-- live project xrovijzjbyssajhtwvas — there are no functions, triggers, views,
-- rules, or check constraints depending on the type):
--   • projects.xpms_phase                    (NOT NULL, default 'discovery')
--   • project_phase_transitions.from_phase   (nullable)
--   • project_phase_transitions.to_phase     (NOT NULL)
--
-- Value mapping for existing rows:
--   discovery   -> Discovery
--   concept     -> Design
--   development -> Design
--   advance     -> Advance
--   build       -> Build
--   show        -> Operate
--   strike      -> Operate
--   wrap        -> Close
-- Procurement and Install are new gates with no pre-v08 source value — no
-- existing row maps onto them; they exist for forward use.
--
-- IMPORTANT: xpms_atoms.phase uses a SEPARATE enum, public.xpms_atom_phase,
-- which intentionally retains the Eight Production Phases (whitepaper §9) at the
-- atom level. It is a distinct axis and is NOT touched by this migration.
-- ============================================================================

begin;

-- 1. Drop the default so the column no longer pins the legacy enum literal.
alter table public.projects alter column xpms_phase drop default;

-- 2. Rename the legacy enum out of the way (its array companion renames with it).
alter type public.xpms_phase rename to xpms_phase_legacy;

-- 3. Create the canonical v08 8-gate enum. Order = sequential macro arc, so
--    ORDER BY on the column sorts chronologically through the lifecycle.
create type public.xpms_phase as enum (
  'Discovery',
  'Design',
  'Advance',
  'Procurement',
  'Build',
  'Install',
  'Operate',
  'Close'
);

-- 4. Convert each dependent column, remapping legacy values to v08.
alter table public.projects
  alter column xpms_phase type public.xpms_phase
  using (
    case xpms_phase::text
      when 'discovery'   then 'Discovery'
      when 'concept'     then 'Design'
      when 'development' then 'Design'
      when 'advance'     then 'Advance'
      when 'build'       then 'Build'
      when 'show'        then 'Operate'
      when 'strike'      then 'Operate'
      when 'wrap'        then 'Close'
    end::public.xpms_phase
  );

alter table public.project_phase_transitions
  alter column from_phase type public.xpms_phase
  using (
    case from_phase::text
      when 'discovery'   then 'Discovery'
      when 'concept'     then 'Design'
      when 'development' then 'Design'
      when 'advance'     then 'Advance'
      when 'build'       then 'Build'
      when 'show'        then 'Operate'
      when 'strike'      then 'Operate'
      when 'wrap'        then 'Close'
      else null
    end::public.xpms_phase
  );

alter table public.project_phase_transitions
  alter column to_phase type public.xpms_phase
  using (
    case to_phase::text
      when 'discovery'   then 'Discovery'
      when 'concept'     then 'Design'
      when 'development' then 'Design'
      when 'advance'     then 'Advance'
      when 'build'       then 'Build'
      when 'show'        then 'Operate'
      when 'strike'      then 'Operate'
      when 'wrap'        then 'Close'
    end::public.xpms_phase
  );

-- 5. Re-establish the default on the new enum.
alter table public.projects
  alter column xpms_phase set default 'Discovery'::public.xpms_phase;

-- 6. Drop the legacy enum (nothing depends on it now).
drop type public.xpms_phase_legacy;

-- 7. Document the canon.
comment on type public.xpms_phase is
  'XPMS v08 8-Gate Lifecycle (locked Jun 2026): Discovery / Design / Advance / Procurement / Build / Install / Operate / Close. Project macro-phase axis. DISTINCT from public.xpms_atom_phase (Eight Production Phases, atom-level).';

comment on column public.projects.xpms_phase is
  'XPMS v08 8-Gate Lifecycle phase — sequential macro arc (LDP *_phase). Aligned with budgets.xpms_phase (migration 0070) and the proposal/event-kit budget axes.';

commit;
