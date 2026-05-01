-- flyingbluewhale · Seaworthy hardening (legacy views)
--
-- Three pre-existing views were left at SECURITY DEFINER, which makes them
-- run with the view-owner's RLS instead of the caller's. All three are
-- simple SELECT wrappers over org-scoped tables that already enforce
-- is_org_member(org_id) on the underlying rows, so flipping them to
-- security_invoker is the correct semantics — callers see only the rows
-- they're allowed to see directly.
--
--   • offer_letters_resolved — composite over offer_letters / crew_members
--     / org_roles / projects / venues / locations / rate_card_items /
--     org_offer_letter_settings. Underlying tables all org-scoped.
--   • v_action_items — UNION over rfis / submittals / punch_items /
--     inspections / tasks. All org-scoped.
--   • v_budget_health — projection over budgets. Org-scoped.
alter view v_budget_health         set (security_invoker = true);
alter view v_action_items          set (security_invoker = true);
alter view offer_letters_resolved  set (security_invoker = true);
