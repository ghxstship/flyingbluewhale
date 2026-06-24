-- Voice canon: never name competitors. Scrub the competitor reference from the
-- public.reviews table comment (the mutual-release / counterpart-gating pattern
-- is described without attribution).
comment on table public.reviews is '0002 — Bidirectional reviews. hidden_until_counterpart=true keeps reviews dark until both sides post (mutual-release pattern). released_at flips visible.';
