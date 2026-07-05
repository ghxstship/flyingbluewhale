-- Kit 21 wave W7 — Knowledge Base verification stamps (Guru canon). Per-article
-- "verified" trust signal + a review interval so an article goes stale once the
-- window lapses. All nullable/additive: existing rows read as never-verified.
-- Applied to the live project 2026-07-05 via the Supabase MCP; committed here
-- for repo/migration parity.

alter table public.kb_articles
  add column if not exists verified_at          timestamptz,
  add column if not exists verified_by          uuid references auth.users(id) on delete set null,
  add column if not exists review_interval_days integer not null default 180;
