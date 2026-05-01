-- flyingbluewhale · XPMS · Seaworthy hardening
--
-- Closes every Supabase advisor finding owned by the XPMS spine:
--   1) The 3 spine views (v_xtc_codebook, v_xpms_atom_tier_composition,
--      v_xpms_variance_summary) flip from default-creator to
--      `security_invoker = true`. RLS enforcement now follows the calling
--      user, which is correct because the underlying tables already carry
--      the right org-scoped policies (xtc_codes_read on `to authenticated`;
--      xpms_atoms / xpms_atom_tiers / xpms_variance_ledger via
--      is_org_member(org_id)).
--   2) `xpms_build_identifier` gets a pinned search_path so a malicious
--      same-named function in another schema can't shadow built-ins.
--   3) Eleven FK columns introduced by the spine migrations gain covering
--      btree indexes. Most are low-volume audit columns (created_by,
--      recorded_by, lineage_root_id, owner_user_id) but indexing them
--      now keeps cascade-delete and join scans cheap as the atom table
--      grows.

alter view v_xtc_codebook                set (security_invoker = true);
alter view v_xpms_atom_tier_composition  set (security_invoker = true);
alter view v_xpms_variance_summary       set (security_invoker = true);

alter function xpms_build_identifier(text, text, smallint, text, smallint, smallint, smallint, text, int, text)
  set search_path = public, pg_temp;

create index if not exists xpms_atoms_created_by_idx       on xpms_atoms(created_by);
create index if not exists xpms_atoms_owner_user_id_idx    on xpms_atoms(owner_user_id) where owner_user_id is not null;
create index if not exists xpms_atoms_lineage_root_id_idx  on xpms_atoms(lineage_root_id) where lineage_root_id is not null;
create index if not exists xpms_atoms_division_code_idx    on xpms_atoms(division_code);
create index if not exists xpms_atoms_section_code_idx     on xpms_atoms(section_code);
create index if not exists xpms_provenance_edges_created_by_idx on xpms_provenance_edges(created_by);
create index if not exists xpms_variance_ledger_recorded_by_idx on xpms_variance_ledger(recorded_by);
create index if not exists cost_codes_xtc_code_idx         on cost_codes(xtc_code) where xtc_code is not null;
create index if not exists crew_members_xtc_code_idx       on crew_members(xtc_code) where xtc_code is not null;
create index if not exists equipment_xtc_code_idx          on equipment(xtc_code) where xtc_code is not null;
create index if not exists fabrication_orders_xtc_code_idx on fabrication_orders(xtc_code) where xtc_code is not null;
