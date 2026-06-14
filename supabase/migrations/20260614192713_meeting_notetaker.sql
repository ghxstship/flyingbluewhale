-- F1 — Meeting notetaker (transcript → AI summary + extracted action items).
--
-- One org-scoped table, `public.meeting_notes`: a pasted/typed transcript
-- that an operator runs through Anthropic to produce a summary + a list of
-- extracted action items, then optionally pushes those action items into the
-- existing `public.tasks` table.
--
--   - transcript : free text the operator pastes (no live audio/STT yet —
--                  see "future enhancement" below).
--   - summary    : the model-generated recap, filled by the "Summarize" action.
--   - action_items : jsonb array of {text, owner?, due?, task_id?} objects —
--                    `task_id` is set once an item has been pushed to tasks so
--                    we never double-create.
--   - note_state : LDP-named lifecycle enum (NOT a bare `status`).
--
-- meeting_id is an OPTIONAL FK to public.meetings so a note can either stand
-- alone (ad-hoc paste) or hang off a scheduled meeting record.
--
-- Standard org-scoping: org_id FK → public.orgs, RLS enabled,
-- private.is_org_member select + private.has_org_role write, deleted_at
-- soft-delete, public.touch_updated_at() trigger. DO NOT APPLY by hand —
-- this is a PENDING migration; promote + apply via the Supabase MCP, then
-- regenerate database.types.ts and drop the LooseSupabase casts.
--
-- FUTURE ENHANCEMENT: live audio capture + speech-to-text. Today the
-- transcript is a text input only; an STT pipeline (e.g. Whisper / a media
-- enhance-speech step) would populate `transcript` automatically before the
-- Summarize step runs unchanged.

-- ── enum type ───────────────────────────────────────────────────────────
-- note_state: draft (transcript captured, not yet summarized) → summarized
-- (AI run complete) → archived (closed out). Cyclical operational arc, so
-- `_state` per the LDP naming discipline.
do $$ begin
  create type public.note_state as enum ('draft', 'summarized', 'archived');
exception when duplicate_object then null; end $$;

-- ── meeting_notes ───────────────────────────────────────────────────────
create table if not exists public.meeting_notes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  meeting_id uuid references public.meetings(id) on delete set null,
  title text not null,
  transcript text not null default '',
  summary text,
  action_items jsonb not null default '[]'::jsonb,
  note_state public.note_state not null default 'draft',
  summarized_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint meeting_notes_action_items_is_array check (jsonb_typeof(action_items) = 'array')
);

create index if not exists meeting_notes_org_created_idx
  on public.meeting_notes (org_id, created_at desc)
  where deleted_at is null;

create index if not exists meeting_notes_org_state_idx
  on public.meeting_notes (org_id, note_state)
  where deleted_at is null;

create index if not exists meeting_notes_meeting_idx
  on public.meeting_notes (meeting_id)
  where deleted_at is null;

alter table public.meeting_notes enable row level security;

create policy meeting_notes_org_select
  on public.meeting_notes for select
  using (private.is_org_member(org_id));

create policy meeting_notes_org_write
  on public.meeting_notes
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger meeting_notes_touch_updated_at
  before update on public.meeting_notes
  for each row execute function public.touch_updated_at();
