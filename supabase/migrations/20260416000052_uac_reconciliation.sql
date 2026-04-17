-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 052: UAC State Machine Extension
-- Adds exception states (lost, stolen, destroyed) to
-- the allocation lifecycle and updates transitions.
-- ═══════════════════════════════════════════════════════

alter type allocation_state add value if not exists 'lost';
alter type allocation_state add value if not exists 'stolen';
alter type allocation_state add value if not exists 'destroyed';

create or replace function validate_allocation_transition()
returns trigger as $$
declare
  valid boolean;
begin
  if old.state = new.state then
    return new;
  end if;

  valid := case old.state
    when 'reserved' then new.state in ('confirmed', 'reserved')
    when 'confirmed' then new.state in ('in_transit', 'reserved')
    when 'in_transit' then new.state in ('on_site', 'confirmed', 'lost', 'stolen', 'destroyed')
    when 'on_site' then new.state in ('returned', 'maintenance', 'lost', 'stolen', 'destroyed')
    when 'returned' then new.state in ('reserved', 'maintenance')
    when 'maintenance' then new.state in ('returned', 'reserved', 'destroyed')
    when 'lost' then new.state in ('returned') -- If found
    when 'stolen' then new.state in ('returned') -- If recovered
    when 'destroyed' then false -- Terminal state
    else false
  end;

  if not valid then
    raise exception 'Invalid allocation state transition: % -> %', old.state, new.state;
  end if;

  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
