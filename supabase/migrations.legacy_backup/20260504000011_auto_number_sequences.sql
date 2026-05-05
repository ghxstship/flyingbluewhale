-- ============================================================================
-- Auto Number Sequences — SmartSuite-parity Phase 1.3
-- ============================================================================
-- Per-org, per-scope monotonically-increasing counters with token-driven
-- formatting. Generates human-readable identifiers like:
--   INV-2026-0017     (format: 'INV-{YYYY}-{seq:04}')
--   RFI-MMW26-014     (format: 'RFI-MMW26-{seq:03}')
--   PO-26-0005        (format: 'PO-{YY}-{seq:04}')
--   {ORG}-{seq:05}    (resolves to e.g. LYTEHAUS-00001)
--
-- Design notes:
--   * One row per (org_id, scope). `scope` is the namespace — convention
--     suggests entity-typed strings like 'invoice', 'rfi:proj_xyz', 'ticket'.
--   * `next_sequence()` is `security definer` — it must upsert/advance the
--     counter regardless of whether the caller has a write policy on the
--     row, but it gates on `is_org_member(p_org_id)` so cross-org reads
--     are rejected with errcode 42501.
--   * `peek_sequence()` is `security invoker` — it relies on RLS to scope
--     reads to the caller's orgs.
--   * Format token grammar:
--       {seq}      zero-padded sequence (default width 4)
--       {seq:N}    zero-padded sequence to N width (e.g. {seq:6} -> 000042)
--       {YYYY}     UTC current year, 4 digits
--       {YY}       UTC current year, last 2 digits
--       {MM}       UTC month, zero-padded
--       {DD}       UTC day, zero-padded
--       {ORG}      uppercased orgs.slug (falls back to literal 'ORG')
--     Anything outside these tokens is a literal — the format itself is
--     persisted on the row so subsequent calls without `p_format` reuse it.
-- ============================================================================

-- ── org_sequences ──────────────────────────────────────────────────────────
create table if not exists org_sequences (
  org_id      uuid not null references orgs(id) on delete cascade,
  scope       text not null,
  current_val bigint not null default 0,
  format      text not null default '{seq:04}',
  updated_at  timestamptz not null default now(),
  primary key (org_id, scope)
);

create index if not exists org_sequences_org_idx on org_sequences(org_id);

alter table org_sequences enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'org_sequences' and policyname = 'org_sequences_select'
  ) then
    create policy "org_sequences_select" on org_sequences for select using (is_org_member(org_id));
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'org_sequences' and policyname = 'org_sequences_admin_write'
  ) then
    create policy "org_sequences_admin_write" on org_sequences for all
      using (has_org_role(org_id, array['owner','admin','manager']))
      with check (has_org_role(org_id, array['owner','admin','manager']));
  end if;
end $$;

-- ── next_sequence(org, scope, format?) ─────────────────────────────────────
-- Atomically advances the counter and returns the formatted identifier.
-- If `p_format` is non-null it is persisted (overwriting any prior format).
-- If `p_format` is null and no row exists yet, the default 'SEQ-{seq:04}'
-- is used.
create or replace function next_sequence(
  p_org_id uuid,
  p_scope  text,
  p_format text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_format text;
  v_next   bigint;
  v_year   text := to_char(now() at time zone 'utc', 'YYYY');
  v_yy     text := to_char(now() at time zone 'utc', 'YY');
  v_mm     text := to_char(now() at time zone 'utc', 'MM');
  v_dd     text := to_char(now() at time zone 'utc', 'DD');
  v_slug   text;
  v_out    text;
  v_match  text;
  v_width  int;
begin
  -- Authorization: caller must be a member of the org.
  if not is_org_member(p_org_id) then
    raise exception 'org_member_required' using errcode = '42501';
  end if;

  -- Upsert + atomic advance. ON CONFLICT lets us serialize concurrent callers
  -- via the row lock acquired during the update.
  insert into org_sequences as s (org_id, scope, current_val, format)
  values (p_org_id, p_scope, 1, coalesce(p_format, 'SEQ-{seq:04}'))
  on conflict (org_id, scope) do update
    set current_val = s.current_val + 1,
        format      = coalesce(p_format, s.format),
        updated_at  = now()
  returning current_val, format into v_next, v_format;

  -- Resolve {ORG} once.
  select upper(slug) into v_slug from orgs where id = p_org_id;
  if v_slug is null then v_slug := 'ORG'; end if;

  v_out := v_format;
  v_out := replace(v_out, '{YYYY}', v_year);
  v_out := replace(v_out, '{YY}',   v_yy);
  v_out := replace(v_out, '{MM}',   v_mm);
  v_out := replace(v_out, '{DD}',   v_dd);
  v_out := replace(v_out, '{ORG}',  v_slug);

  -- {seq:N} — iterate so multiple distinct widths in one format all resolve.
  loop
    v_match := substring(v_out from '\{seq:(\d+)\}');
    if v_match is null then
      exit;
    end if;
    v_width := v_match::int;
    v_out := regexp_replace(v_out, '\{seq:\d+\}', lpad(v_next::text, v_width, '0'));
  end loop;

  -- Plain {seq} — default width 4.
  v_out := replace(v_out, '{seq}', lpad(v_next::text, 4, '0'));

  return v_out;
end;
$$;

revoke execute on function next_sequence(uuid, text, text) from public;
grant  execute on function next_sequence(uuid, text, text) to authenticated;

-- ── peek_sequence(org, scope) ──────────────────────────────────────────────
-- Read-only inspection of the current counter + format. Returns no rows when
-- the sequence has not been initialized yet.
create or replace function peek_sequence(p_org_id uuid, p_scope text)
returns table(current_val bigint, format text)
language sql
stable
security invoker
set search_path = public
as $$
  select current_val, format
  from org_sequences
  where org_id = p_org_id and scope = p_scope;
$$;

revoke execute on function peek_sequence(uuid, text) from public;
grant  execute on function peek_sequence(uuid, text) to authenticated;
