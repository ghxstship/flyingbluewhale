-- seed_org_xpms_defaults: fix the cost_centers insert for FRESH orgs.
--
-- The original (20260723010000) omitted `scope`, which is NOT NULL with no
-- default, so the function raised 23502 on any org that didn't already carry
-- its cost centers. The demo-org smoke test masked it (rows pre-existed, the
-- WHERE NOT EXISTS skipped the insert). Found by the /start wizard build's
-- live rolled-back verification. Same function, `scope: 'org'` added.

CREATE OR REPLACE FUNCTION "public"."seed_org_xpms_defaults"("p_org_id" uuid)
RETURNS void
LANGUAGE "plpgsql"
SECURITY DEFINER
SET "search_path" TO 'public', 'private', 'pg_temp'
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NOT NULL
     AND NOT private.has_org_role(p_org_id, ARRAY['owner','admin']) THEN
    RAISE EXCEPTION 'Only an owner or admin can install the base kit'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  INSERT INTO public.cost_centers (org_id, code, name, scope, active)
  SELECT p_org_id, v.code, v.name, 'org', true
  FROM (VALUES
    ('0000','Executive'), ('1000','Creative'), ('2000','Talent'),
    ('3000','Marketing'), ('4000','Build'),    ('5000','Production'),
    ('6000','Operations'),('7000','Experience'),('8000','Hospitality'),
    ('9000','Technology')
  ) AS v(code, name)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.cost_centers c
    WHERE c.org_id = p_org_id AND c.code = v.code
  );

  INSERT INTO public.positions (org_id, title, department_code)
  SELECT p_org_id, v.title, v.dept
  FROM (VALUES
    ('Executive Producer','0000'), ('Creative Director','1000'),
    ('Talent Director','2000'),    ('Marketing Director','3000'),
    ('Head Of Build','4000'),      ('Production Director','5000'),
    ('Operations Director','6000'),('Experience Director','7000'),
    ('Hospitality Director','8000'),('Technology Director','9000')
  ) AS v(title, dept)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.positions p
    WHERE p.org_id = p_org_id AND lower(p.title) = lower(v.title)
  );
END;
$$;
