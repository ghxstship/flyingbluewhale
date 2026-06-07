-- ============================================================================
-- Salvage City — dev-only access codes for testing the unlock flow.
-- ============================================================================
-- Deterministic plaintexts per internal persona so a tester can paste them
-- without needing a console round-trip. Rotate / revoke in prod.
--
-- Plaintexts (case-insensitive, dashes optional):
--   Production       — PROD-2026-SC
--   Operations       — OPS0-2026-SC
--   F&B / Vendor     — FNB0-2026-SC
--   Brand Ambassador — BAMB-2026-SC
--   Sponsors         — SPNS-2026-SC
--   Talent           — TALN-2026-SC
--   Media & Press    — PRSS-2026-SC
--   Client           — CLNT-2026-SC
-- ============================================================================
with ctx as (
  select p.id as project_id, p.org_id
  from projects p join orgs o on o.id = p.org_id
  where p.slug = 'edclv26-salvage-city' and o.slug = 'demo'
), payload as (
  select 'staff'::guide_persona as persona, 'PR0D' as code_prefix,
         'a96025386b92d88dda46e6631f5c4c627170371c21edac8b20849bdb758a6876' as code_hash,
         'Dev seed — Production' as label
  union all select 'crew', '0PS0', 'b6cd7e7a8b66f6cc66d8638c6d248278caae4c08ead6c840192931d477700516', 'Dev seed — Operations'
  union all select 'vendor', 'FNB0', '02de4ab41edc00a0aa44c13de022386f05552d228ee71ec98074a79005dbf937', 'Dev seed — F&B'
  union all select 'brand_ambassador', 'BAMB', '16a3af16fd5b34323d0ef3bca1eb721c6a22e7a3beae0a1522c8ef89e1d66438', 'Dev seed — Brand Ambassador'
  union all select 'sponsor', 'SPNS', '320f23197ccff2849bae01b53fb0ee4ea8276beb0935db7401657fb9eaef696f', 'Dev seed — Sponsors'
  union all select 'artist', 'TA1N', '1a0a6f86f466e221d4fd9cab36b5e78c2b4352ed4cd5a4155a4385c5e283b202', 'Dev seed — Talent'
  union all select 'media_press', 'PRSS', 'a9a1b777ae19160d11713473b7c9322309bc8b6ca6528728638395a9facc2464', 'Dev seed — Media & Press'
  union all select 'client', 'C1NT', 'be6f808c263939355d9ad98d96de1ab8bca517b6e405928e2a2f342704405261', 'Dev seed — Client'
)
insert into guide_access_codes (org_id, project_id, persona, code_hash, code_prefix, label)
select c.org_id, c.project_id, p.persona, p.code_hash, p.code_prefix, p.label
from ctx c cross join payload p
on conflict (project_id, code_hash) do update set
  revoked_at = null,
  label = excluded.label;
