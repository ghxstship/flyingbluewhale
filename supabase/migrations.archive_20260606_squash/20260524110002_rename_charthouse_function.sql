-- R26.1 — last charthouse symbol: stored function used by the site-plan
-- transition flow. Not called from app code, but renamed for consistency.

ALTER FUNCTION public.charthouse_transition_state(uuid, text) RENAME TO siteplan_transition_state;
