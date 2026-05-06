-- ============================================================================
-- Salvage City — restrict per diem to travelers (Sarah + Vida only)
-- ============================================================================
-- Per Julian (2026-05-05): per diem is for travelers only. The playbook Labor
-- tab has Sarah Fry and Vida Sotakoun as the only crew members traveling in
-- to Las Vegas; everyone else is a local hire and is not entitled to per
-- diem. Strip per_diem_rate_card_item_id + override_per_diem_cents from the
-- non-traveler letters.
-- ============================================================================

do $$
declare
  v_org_id     uuid;
  v_project_id uuid;
begin
  select o.id, p.id into v_org_id, v_project_id
    from orgs o join projects p on p.org_id = o.id
   where o.slug = 'demo' and p.slug = 'edclv26-salvage-city' limit 1;

  if v_project_id is null then raise exception 'Salvage City project missing.'; end if;

  update offer_letters ol
     set per_diem_rate_card_item_id = null,
         override_per_diem_cents = null,
         updated_at = now()
    from crew_members cm
   where cm.id = ol.crew_member_id
     and ol.project_id = v_project_id
     and ol.status not in ('withdrawn')
     and cm.name not in ('Sarah Fry', 'Vida Sotakoun');
end $$;
