-- Capability grants are an ADMIN act, not a manager one.
--
-- `role_capability_grants` and `user_capability_grants` shipped with write
-- policies on the manager band:
--
--   has_org_role(org_id, ARRAY['owner','admin','manager'])
--
-- That is wider than it looks. Grants are ADDITIVE and there are no denies
-- (ADR-0015), so whoever can write a grant row can hand out any grantable
-- capability — to any role, to any person, including themselves. A manager's
-- base capabilities contain no `scan:*` at all, so this is a real escalation
-- path and not a theoretical one: a manager could grant their own crew role
-- `scan:credential` and walk onto a gate.
--
-- It also quietly undermines the one place ADR-0015 reasons hardest about
-- authority. `SHIFT_DERIVABLE_BY_DEFAULT` deliberately excludes
-- `scan:credential` because shift-derived grants would make the SCHEDULER an
-- authorization surface — "whoever can roster Bob onto a warehouse shift can
-- hand him that role's capabilities". But if the roster-owning band can write
-- the grant table directly, that care buys nothing.
--
-- So the write band narrows to admin. This matches:
--   * the app gate in studio/settings/capabilities/actions.ts (isAdmin), which
--     until now was the *only* thing enforcing it — and an app gate is not a
--     backstop, PostgREST is right there;
--   * the principle the capability catalog already states — the sensitive
--     capability should require "a deliberate, attributable grant".
--
-- SELECT stays `is_org_member`: seeing which capabilities your org hands out
-- is not sensitive, and the field surfaces need to read their own grants.
--
-- `crew_roles` write stays on the manager band deliberately — naming a role is
-- catalog maintenance, not granting power. The power is the grant row.
--
-- ALTER, not DROP/CREATE: a DROP would silently discard anything added to
-- these policies since (that exact mistake cost /m/market its uploads earlier
-- today).

ALTER POLICY "role_capability_grants_write"
  ON "public"."role_capability_grants"
  USING (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text]))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text]));

ALTER POLICY "user_capability_grants_write"
  ON "public"."user_capability_grants"
  USING (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text]))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner'::text, 'admin'::text]));
