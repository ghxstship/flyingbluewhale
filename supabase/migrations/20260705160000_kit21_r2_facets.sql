-- Kit 21 remediation R2 (ADR-0015) — three facets over existing stores, no new
-- tables. Each is nullable/additive. Applied to the live project 2026-07-05 via
-- the Supabase MCP; committed here for repo/migration parity.

-- 1 · Opportunities bizdev sub-type. A further facet under crm.kind='rfp'
-- (Public RFP · Invited Bid · Tender · Renewal · Partnership). NULL for
-- non-bizdev CRM records; the /studio/opportunities lens filters on it.
alter table public.opportunities
  add column if not exists bd_type text
    check (bd_type is null or bd_type in ('public_rfp','invited_bid','tender','renewal','partnership'));

-- 2 · Community Q&A accepted answer. category='question' turns a post into a
-- Q&A; accepted_comment_id points at the accepted answer. Team badge is
-- DERIVED from the answerer's org role (no column).
alter table public.community_posts
  add column if not exists accepted_comment_id uuid references public.community_comments(id) on delete set null;

-- 3 · job_templates last-used. Stamped when the template seeds a work order
-- (clone action), so the list shows "Last Used" without a join.
alter table public.job_templates
  add column if not exists last_used_at timestamptz;
