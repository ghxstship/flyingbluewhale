-- ============================================================================
-- Salvage City — rate corrections (Paul / Alvaro / Amy)
-- ============================================================================
-- Per Julian (2026-05-05):
--   * Paul Seigenthaler — no rate info on the offer letter (TBD).
--   * Alvaro Hernandez — no rate info on the offer letter (TBD).
--   * Amy Reed — $1,000 flat for the project (was an inflated override that
--     didn't match the actual engagement value).
--
-- Rate-card items remain in place as canonical templates for future use; only
-- the offer letters themselves are corrected. compensation_basis = 'tbd' for
-- the no-rate cases removes the rate display from the rendered letter.
-- ============================================================================

do $$
declare
  v_org_id     uuid;
  v_project_id uuid;
begin
  select o.id, p.id into v_org_id, v_project_id
    from orgs o
    join projects p on p.org_id = o.id
   where o.slug = 'demo' and p.slug = 'edclv26-salvage-city'
   limit 1;

  if v_project_id is null then
    raise exception 'Salvage City project missing.';
  end if;

  -- Paul + Alvaro: strip rate references entirely.
  update offer_letters ol
     set rate_card_item_id = null,
         override_amount_cents = null,
         compensation_basis = 'tbd'::compensation_basis,
         updated_at = now()
    from crew_members cm
   where cm.id = ol.crew_member_id
     and ol.project_id = v_project_id
     and lower(cm.email) in (
       'paul.seigenthaler@insomniac.com',
       'alvaro@five-senses.co'
     );

  -- Amy: $1,000 flat for the project.
  update offer_letters ol
     set override_amount_cents = 100000,
         compensation_basis = 'flat_fee'::compensation_basis,
         updated_at = now()
    from crew_members cm
   where cm.id = ol.crew_member_id
     and ol.project_id = v_project_id
     and lower(cm.email) = 'sos@ghxstship.pro';

  -- Activity log entries for the changed letters.
  insert into offer_letter_activity (offer_letter_id, org_id, kind, actor_label, summary)
  select ol.id, v_org_id, 'rate_change', 'GHXSTSHIP',
    case
      when lower(cm.email) = 'sos@ghxstship.pro'
        then 'Compensation set to $1,000 flat for the project per Julian (2026-05-05).'
      else 'Rate withheld — TBD per Julian (2026-05-05). Compensation will be communicated separately.'
    end
    from offer_letters ol
    join crew_members cm on cm.id = ol.crew_member_id
   where ol.project_id = v_project_id
     and lower(cm.email) in (
       'paul.seigenthaler@insomniac.com',
       'alvaro@five-senses.co',
       'sos@ghxstship.pro'
     );
end $$;
