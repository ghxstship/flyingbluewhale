-- LYTEHAUS Technologies · XPMS · promote existing rows to atoms
--
-- The atoms table is the new SSOT for cross-class addressing. Existing
-- single-purpose tables (crew_members, equipment, fabrication_orders,
-- rentals) remain the 3NF home for class-specific attributes, but each
-- now carries a `xpms_atom_id` pointer to its canonical atom. The atom
-- carries the XTC code, tier composition, phase, state, identifier, and
-- variance hooks.
--
-- No backwards-compat shims: callers should query atoms for cross-class
-- views; the per-class tables are pure attribute extensions.

------------------------------------------------------------------
-- 1. Add canonical atom pointers
------------------------------------------------------------------

alter table crew_members
  add column if not exists xpms_atom_id uuid references xpms_atoms(id) on delete set null,
  add column if not exists xtc_code     int  references xtc_codes(code) on delete set null;

alter table equipment
  add column if not exists xpms_atom_id uuid references xpms_atoms(id) on delete set null,
  add column if not exists xtc_code     int  references xtc_codes(code) on delete set null;

alter table fabrication_orders
  add column if not exists xpms_atom_id uuid references xpms_atoms(id) on delete set null,
  add column if not exists xtc_code     int  references xtc_codes(code) on delete set null;

alter table rentals
  add column if not exists xpms_atom_id uuid references xpms_atoms(id) on delete set null;

alter table tasks
  add column if not exists xpms_atom_id uuid references xpms_atoms(id) on delete set null;

create index if not exists crew_members_atom_idx       on crew_members(xpms_atom_id)       where xpms_atom_id is not null;
create index if not exists equipment_atom_idx          on equipment(xpms_atom_id)          where xpms_atom_id is not null;
create index if not exists fabrication_orders_atom_idx on fabrication_orders(xpms_atom_id) where xpms_atom_id is not null;
create index if not exists rentals_atom_idx            on rentals(xpms_atom_id)            where xpms_atom_id is not null;
create index if not exists tasks_atom_idx              on tasks(xpms_atom_id)              where xpms_atom_id is not null;

------------------------------------------------------------------
-- 2. Backfill atoms for existing crew_members
--
-- Each crew member becomes a Class 6 · Division 62 atom under the section
-- that best matches their role. Default to 622 (Stagehands) if no match.
-- The xtc_code defaults to the position-root for that section.
------------------------------------------------------------------

with backfill as (
  insert into xpms_atoms (
    org_id, identifier, xtc_code, class_code, division_code, section_code,
    org_token, sequence_no, revision, state, phase, name, description,
    created_by, owner_user_id, payload
  )
  select
    cm.org_id,
    'GHX-CREW-6.2.2-LBR-' || lpad(row_number() over (partition by cm.org_id order by cm.created_at)::text, 4, '0') || 'A',
    case
      when cm.role ilike '%bar%'        then 62100
      when cm.role ilike '%pa%'         then 62300
      when cm.role ilike '%runner%'     then 62300
      when cm.role ilike '%rigger%'     then 54100
      when cm.role ilike '%light%'      then 51100
      when cm.role ilike '%video%'      then 52100
      when cm.role ilike '%audio%'
        or cm.role ilike '%foh%'
        or cm.role ilike '%sound%'      then 53100
      when cm.role ilike '%security%'   then 66100
      when cm.role ilike '%medic%'
        or cm.role ilike '%emt%'        then 67100
      when cm.role ilike '%host%'       then 71100
      else 62200
    end as xtc,
    case
      when cm.role ilike '%rigger%'     then 5
      when cm.role ilike '%light%'      then 5
      when cm.role ilike '%video%'      then 5
      when cm.role ilike '%audio%'
        or cm.role ilike '%foh%'
        or cm.role ilike '%sound%'      then 5
      when cm.role ilike '%security%'   then 6
      when cm.role ilike '%medic%'
        or cm.role ilike '%emt%'        then 6
      when cm.role ilike '%host%'       then 7
      else 6
    end as class_code,
    case
      when cm.role ilike '%rigger%'     then 54
      when cm.role ilike '%light%'      then 51
      when cm.role ilike '%video%'      then 52
      when cm.role ilike '%audio%'
        or cm.role ilike '%foh%'
        or cm.role ilike '%sound%'      then 53
      when cm.role ilike '%security%'   then 66
      when cm.role ilike '%medic%'
        or cm.role ilike '%emt%'        then 67
      when cm.role ilike '%host%'       then 71
      else 62
    end as div,
    case
      when cm.role ilike '%bar%'        then 621
      when cm.role ilike '%pa%'         then 623
      when cm.role ilike '%runner%'     then 623
      when cm.role ilike '%rigger%'     then 541
      when cm.role ilike '%light%'      then 511
      when cm.role ilike '%video%'      then 521
      when cm.role ilike '%audio%'
        or cm.role ilike '%foh%'
        or cm.role ilike '%sound%'      then 531
      when cm.role ilike '%security%'   then 661
      when cm.role ilike '%medic%'
        or cm.role ilike '%emt%'        then 671
      when cm.role ilike '%host%'       then 711
      else 622
    end as sec,
    'GHX',
    row_number() over (partition by cm.org_id order by cm.created_at) as seq,
    'A',
    'uac', 'advance', cm.name,
    cm.role,
    coalesce(cm.user_id, (select id from users limit 1)),
    cm.user_id,
    jsonb_build_object('crew_member_id', cm.id, 'phone', cm.phone, 'email', cm.email, 'day_rate_cents', cm.day_rate_cents)
  from crew_members cm
  where cm.xpms_atom_id is null
  returning id, payload
)
update crew_members c
set xpms_atom_id = b.id,
    xtc_code     = (select xtc_code from xpms_atoms where id = b.id)
from backfill b
where c.id = (b.payload ->> 'crew_member_id')::uuid;

-- Each backfilled crew atom gets a primary Physical tier (live work)
insert into xpms_atom_tiers (atom_id, tier, is_primary, weight)
select a.id, 'physical', true, 1.0
from xpms_atoms a
where a.class_code = 6
  and not exists (select 1 from xpms_atom_tiers t where t.atom_id = a.id);

-- Production-class crew get Physical primary; promote rigging/lighting that
-- cross into theatrical via secondary
insert into xpms_atom_tiers (atom_id, tier, is_primary, weight)
select a.id, 'physical', true, 1.0
from xpms_atoms a
where a.class_code = 5
  and not exists (select 1 from xpms_atom_tiers t where t.atom_id = a.id);

------------------------------------------------------------------
-- 3. Backfill atoms for existing equipment
--
-- Equipment maps to Class 5 (Production) by default. We use 53200 (Main PA
-- Stack) as the generic fallback line code; subsequent edits assign the
-- right code per inventory class.
------------------------------------------------------------------

with backfill_eq as (
  insert into xpms_atoms (
    org_id, identifier, xtc_code, class_code, division_code, section_code,
    org_token, sequence_no, revision, state, phase, name, description,
    cost_cents, currency, created_by, payload
  )
  select
    e.org_id,
    'GHX-EQP-5.3.2-INV-' || lpad(row_number() over (partition by e.org_id order by e.created_at)::text, 4, '0') || 'A',
    53200,
    5, 53, 532,
    'GHX',
    row_number() over (partition by e.org_id order by e.created_at),
    'A',
    'uac', 'advance', e.name, e.notes,
    e.daily_rate_cents, 'USD',
    coalesce((select id from users limit 1)),
    jsonb_build_object('equipment_id', e.id, 'category', e.category, 'asset_tag', e.asset_tag, 'serial', e.serial)
  from equipment e
  where e.xpms_atom_id is null
  returning id, payload
)
update equipment eq
set xpms_atom_id = b.id,
    xtc_code     = 53200
from backfill_eq b
where eq.id = (b.payload ->> 'equipment_id')::uuid;

insert into xpms_atom_tiers (atom_id, tier, is_primary, weight)
select a.id, 'physical', true, 1.0
from xpms_atoms a
where a.payload ? 'equipment_id'
  and not exists (select 1 from xpms_atom_tiers t where t.atom_id = a.id);

------------------------------------------------------------------
-- 4. Backfill projects → tier composition (default Physical 100%)
--
-- Projects without explicit composition get a Physical-100% baseline.
-- Real composition is recomputed once atoms are tagged.
------------------------------------------------------------------

insert into xpms_project_composition (project_id, tier, share, metric)
select p.id, 'physical', 1.0000, 'scope'
from projects p
where not exists (
  select 1 from xpms_project_composition c where c.project_id = p.id and c.metric = 'scope'
)
on conflict do nothing;

------------------------------------------------------------------
-- 5. Migrate cost_codes → ensure each carries an xtc_code
--
-- cost_codes was a free-form bucket. New canonical posting code is
-- xpms_atoms.xtc_code; existing references via cost_codes(id) remain
-- valid but cost_codes is no longer the authoritative codebook.
------------------------------------------------------------------

alter table cost_codes
  add column if not exists xtc_code int references xtc_codes(code) on delete set null;

------------------------------------------------------------------
-- 6. Comments — document the SSOT promotion
------------------------------------------------------------------

comment on column crew_members.xpms_atom_id      is 'Canonical XPMS atom for this crew member. Atom is the SSOT.';
comment on column equipment.xpms_atom_id         is 'Canonical XPMS atom for this equipment unit. Atom is the SSOT.';
comment on column fabrication_orders.xpms_atom_id is 'Canonical XPMS atom for this fab order. Atom is the SSOT.';
comment on column rentals.xpms_atom_id           is 'Canonical XPMS atom for this rental. Atom is the SSOT.';
comment on column tasks.xpms_atom_id             is 'Canonical XPMS atom for this task (when atomically addressable).';
comment on column cost_codes.xtc_code            is 'Cross-reference to canonical XTC line item.';
