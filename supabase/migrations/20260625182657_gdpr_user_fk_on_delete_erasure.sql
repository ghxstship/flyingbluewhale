-- GDPR Art. 17 — make every FK referencing a user safe under account purge.
--
-- PROBLEM: the account-purge worker hard-deletes public.users + auth.users, but
-- ~158 FKs referencing them had ON DELETE NO ACTION / RESTRICT (the PG default).
-- The delete therefore either THROWS (purge aborts, "30-day deletion" never
-- completes) or — if it had cascaded — would vaporize shared business records
-- (invoices, proposals, projects). Neither is acceptable.
--
-- DECISION FRAMEWORK (conservative — SET NULL is the default):
--   * Attribution / audit columns (created_by, assigned_to, actor_id,
--     submitter_id, reviewed_by, …): ON DELETE SET NULL. Keep the business
--     record; sever the user link. NOT NULL attribution columns are made
--     nullable so SET NULL is legal.
--   * Rows that ARE the user's personal data and have no standalone business
--     value: ON DELETE CASCADE. Here only ai_conversations (the chat history
--     is personal; ai_messages already cascades from its conversation).
--   * Columns already SET NULL / CASCADE are left untouched.
--
-- The rewrite is data-driven over pg_constraint so it can never drift from the
-- live FK graph and is safely re-runnable. Idempotent: only touches FKs that
-- still reference users and aren't already SET NULL/CASCADE.

DO $$
DECLARE
  r RECORD;
  -- columns we want CASCADE instead of SET NULL (true child / personal-data rows)
  cascade_cols text[] := ARRAY['ai_conversations.user_id'];
  want text;
BEGIN
  FOR r IN
    SELECT con.conname,
           src_ns.nspname AS src_schema, src.relname AS src_table,
           att.attname AS src_column, att.attnotnull AS not_null,
           con.confdeltype, con.confupdtype,
           tgt_ns.nspname AS tgt_schema, tgt.relname AS tgt_table,
           tgt_att.attname AS tgt_column
    FROM pg_constraint con
    JOIN pg_class src ON src.oid = con.conrelid
    JOIN pg_namespace src_ns ON src_ns.oid = src.relnamespace
    JOIN pg_class tgt ON tgt.oid = con.confrelid
    JOIN pg_namespace tgt_ns ON tgt_ns.oid = tgt.relnamespace
    JOIN unnest(con.conkey)  WITH ORDINALITY AS k(attnum, ord)  ON TRUE
    JOIN unnest(con.confkey) WITH ORDINALITY AS fk(attnum, ord) ON fk.ord = k.ord
    JOIN pg_attribute att     ON att.attrelid = con.conrelid  AND att.attnum = k.attnum
    JOIN pg_attribute tgt_att ON tgt_att.attrelid = con.confrelid AND tgt_att.attnum = fk.attnum
    WHERE con.contype = 'f'
      AND src_ns.nspname = 'public'
      AND ((tgt_ns.nspname='public' AND tgt.relname='users')
        OR (tgt_ns.nspname='auth'   AND tgt.relname='users'))
      AND con.confdeltype IN ('a','r')   -- only NO ACTION / RESTRICT need fixing
      -- single-column FKs only (all user FKs are single-column; guards composite edge cases)
      AND (SELECT count(*) FROM unnest(con.conkey)) = 1
  LOOP
    IF (r.src_table || '.' || r.src_column) = ANY (cascade_cols) THEN
      want := 'CASCADE';
    ELSE
      want := 'SET NULL';
      -- SET NULL requires a nullable column.
      IF r.not_null THEN
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP NOT NULL',
                       r.src_table, r.src_column);
      END IF;
    END IF;

    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.src_table, r.conname);
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I.%I(%I) ON DELETE %s',
      r.src_table, r.conname, r.src_column,
      r.tgt_schema, r.tgt_table, r.tgt_column, want);

    RAISE NOTICE 'rewired %.% (%) -> ON DELETE %', r.src_table, r.src_column, r.conname, want;
  END LOOP;
END $$;

-- Assertion: after this migration ZERO FKs referencing users may be NO ACTION/RESTRICT.
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n
  FROM pg_constraint con
  JOIN pg_class tgt ON tgt.oid = con.confrelid
  JOIN pg_namespace tgt_ns ON tgt_ns.oid = tgt.relnamespace
  JOIN pg_class src ON src.oid = con.conrelid
  JOIN pg_namespace src_ns ON src_ns.oid = src.relnamespace
  WHERE con.contype='f' AND src_ns.nspname='public'
    AND ((tgt_ns.nspname='public' AND tgt.relname='users') OR (tgt_ns.nspname='auth' AND tgt.relname='users'))
    AND con.confdeltype IN ('a','r');
  IF n > 0 THEN
    RAISE EXCEPTION 'GDPR FK remediation incomplete: % user-FK(s) still NO ACTION/RESTRICT', n;
  END IF;
END $$;
