-- LYTEHAUS — AI Field Agents (Phase 4.4)
--
-- SmartSuite parity: an "AI Field Agent" auto-populates a column on a
-- target row by running a prompt template against named source columns,
-- refreshing whenever a dependency changes. This migration ships the
-- registry table + RLS + a seed agent for `incidents.ai_summary`
-- summarizing `incidents.description` (the canonical lighthouse).
--
-- Idempotent. Safe to re-run.

create table if not exists ai_agents (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references orgs(id) on delete cascade,
  -- Polymorphic target — table + column the agent populates.
  target_table    text not null,
  target_column   text not null,
  -- Source columns the agent reads. Validated server-side per-table.
  source_columns  text[] not null default '{}',
  -- Prompt template using {{column.name}} placeholders.
  prompt_template text not null,
  -- Output type — 'text' | 'number' | 'select' (options stored as metadata).
  output_type     text not null default 'text',
  -- Refresh on dependency change.
  auto_refresh    boolean not null default true,
  -- Model id.
  model           text not null default 'claude-sonnet-4-6',
  -- Max tokens for the AI call.
  max_tokens      int not null default 256,
  enabled         boolean not null default true,
  created_by      uuid references users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (org_id, target_table, target_column)
);

create index if not exists ai_agents_target_idx
  on ai_agents(org_id, target_table, target_column);

alter table ai_agents enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'ai_agents' and policyname = 'ai_agents_select'
  ) then
    create policy "ai_agents_select" on ai_agents
      for select using (is_org_member(org_id));
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'ai_agents' and policyname = 'ai_agents_admin_write'
  ) then
    create policy "ai_agents_admin_write" on ai_agents
      for all
      using (has_org_role(org_id, array['owner','admin']))
      with check (has_org_role(org_id, array['owner','admin']));
  end if;
end $$;

-- Seed lighthouse agent: incidents.ai_summary summarizing
-- incidents.description (tickets has no description column in this
-- schema — incidents is the closest match). Skips silently if the
-- target table or columns don't exist.
do $$
begin
  if to_regclass('public.incidents') is not null
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'incidents'
         and column_name = 'description'
     )
     and exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = 'incidents'
         and column_name = 'ai_summary'
     )
  then
    insert into ai_agents (
      org_id, target_table, target_column, source_columns,
      prompt_template, output_type, auto_refresh, model
    )
    select id, 'incidents', 'ai_summary', array['description'],
           'Summarize the following incident description in one short sentence (max 20 words). Lead with what happened, no preamble.' || E'\n\nDescription:\n{{description}}',
           'text', true, 'claude-sonnet-4-6'
      from orgs
    on conflict (org_id, target_table, target_column) do nothing;
  end if;
end $$;
