-- Flag SSOT canonical-vs-deprecated pairs at the schema level so future
-- devs/agents see it before they choose the wrong side. Source of truth:
-- reports/3NF_SSOT_FK_AUDIT_2026-05-24.md.

COMMENT ON TABLE public.form_defs IS
'CANONICAL forms schema. App writes here. See 3NF audit §1.1. The parallel `form_definitions` ecosystem is unused and will be retired.';

COMMENT ON TABLE public.form_definitions IS
'DEPRECATED — 0 rows, 0 app refs. Use `form_defs` instead. See 3NF audit §1.1. Slated for drop alongside form_drafts/form_fields/form_field_options/ufs_form_submissions.';

COMMENT ON TABLE public.kb_articles IS
'CANONICAL knowledge schema. App writes here. See 3NF audit §1.2. The richer `knowledge_articles` ecosystem (revisions/subscribers/relations/collections) is unused; migrate before adding features that need versioning.';

COMMENT ON TABLE public.knowledge_articles IS
'DEPRECATED — 1 row, 0 app refs. Use `kb_articles` instead. See 3NF audit §1.2. Has dependent tables (knowledge_revisions, knowledge_subscribers, knowledge_relations, knowledge_collections, post_mortems.ukb_article_id).';

COMMENT ON TABLE public.tasks IS
'CANONICAL tasks schema. App writes here. See 3NF audit §1.3. Parallel `tasks_v2` has 9 stranded rows — verify before dropping.';

COMMENT ON TABLE public.tasks_v2 IS
'DEPRECATED — 9 stranded rows, 0 app refs. Use `tasks` instead. See 3NF audit §1.3. Has dependent tables (task_assignments, task_dependencies, task_recurring_definitions, task_status_history, corrective_actions). Inspect the 9 rows before dropping.';

COMMENT ON TABLE public.charthouse_adjacency IS 'Renames pending — "Charthouse" terminology banned per feedback_no_charthouse.md (Round 7). Schema rename deferred; UI text already purged.';
COMMENT ON TABLE public.charthouse_band IS 'Renames pending — see comment on charthouse_adjacency.';
COMMENT ON TABLE public.charthouse_placement IS 'Renames pending — see comment on charthouse_adjacency.';
COMMENT ON TABLE public.charthouse_station IS 'Renames pending — see comment on charthouse_adjacency.';
COMMENT ON TABLE public.charthouse_utility IS 'Renames pending — see comment on charthouse_adjacency.';
COMMENT ON TABLE public.charthouse_zone_region IS 'Renames pending — see comment on charthouse_adjacency.';
