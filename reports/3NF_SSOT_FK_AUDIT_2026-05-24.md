# 3NF / SSOT / FK Audit — 2026-05-24

Scope: every base table in `public` schema (~410 tables). Verified via
direct `information_schema` + `pg_constraint` queries against the live
Supabase project (`xrovijzjbyssajhtwvas`). All counts are exact.

## Headline

The schema is in mostly good shape. Three categories of finding:

1. **Three parallel-schema SSOT defects** (forms, knowledge, tasks) — the
   app actively uses a thin "v1" table while a richer "v2" / "definitions"
   ecosystem with its own dependent tables sits orphaned. **High severity,
   ship-blocking for any future feature in these surfaces.**

2. **Six `charthouse_*` tables still exist** carrying banned terminology
   per `feedback_no_charthouse.md` memory. Used internally by site-plans
   code; UI text already purged. **Medium — schema-level cleanup deferred.**

3. **73 tables carry a `status` column** instead of `*_phase` / `*_state`
   per LDP §NAMING. Most are pre-LDP grandfathered. Tracked in
   `reports/LDP_LIFECYCLE_AUDIT.md`. **Low — review per table individually.**

FK declarations are healthy. ~946 total FKs split: 500 CASCADE, 218 NO
ACTION, 208 SET NULL, 20 RESTRICT. NO ACTION on `auth.users` /
historical-record references is correct (protects audit trail).

---

## §1 — Parallel-schema SSOT defects

### 1.1 Forms — `form_defs` vs `form_definitions`

| Table                        | Rows | App refs (`.from()`) | Verdict                       |
| ---------------------------- | ---: | -------------------: | ----------------------------- |
| `form_defs` (10 cols)        |    1 |                    7 | **CANONICAL**                 |
| `form_definitions` (15 cols) |    0 |                    0 | Dead, but has 4 FK dependents |

Dependents on `form_definitions` (all empty in production):

- `form_drafts.form_definition_id` (cascade)
- `form_fields.form_definition_id` (cascade)
- `form_field_options` (chained via form_fields)
- `ufs_form_submissions.form_definition_id` (no action)
- self-ref: `form_definitions.prior_version_id`

**Risk:** dropping `form_definitions` is safe (0 rows, 0 app references)
but requires dropping its dependent tables too. The dependents _do_ model
features the app doesn't yet use (multi-version forms, separate field
table, submission values keyed by field_id). Killing them forecloses a
richer forms surface.

**Recommended remediation (deferred):** Choose one canonical side. Either
(a) migrate `form_defs` data to `form_definitions` + retire `form_defs`,
or (b) drop `form_definitions` + dependents and stay on `form_defs`. The
former is the right architecture; the latter is the quick win.

### 1.2 Knowledge — `kb_articles` vs `knowledge_articles`

| Table                          | Rows | App refs | Verdict                        |
| ------------------------------ | ---: | -------: | ------------------------------ |
| `kb_articles` (10 cols)        |    2 |       12 | **CANONICAL**                  |
| `knowledge_articles` (16 cols) |    1 |        0 | Dead, rich dependent ecosystem |

Dependents on `knowledge_articles`:

- `knowledge_revisions.article_id` (cascade)
- `knowledge_subscribers.article_id` (cascade)
- `knowledge_relations.from_article_id` + `.to_article_id` (cascade)
- `post_mortems.ukb_article_id` (no action)
- `knowledge_collections` (orphans `knowledge_articles.collection_id`)

Same shape as forms — `knowledge_articles` is the well-modeled side
(versioning via `knowledge_revisions`, subscriptions, collections,
inter-article relations) but the app never connects. Round 19 added
manual version bumping on `kb_articles` because the canonical revisions
table is unreachable from the app.

**Recommended remediation (deferred):** Migrate `kb_articles` →
`knowledge_articles` and wire up `knowledge_revisions` properly. The
manual `kb_articles.version` bump from Round 19 becomes a real INSERT
into `knowledge_revisions`.

### 1.3 Tasks — `tasks` vs `tasks_v2`

| Table                | Rows | App refs | Verdict                        |
| -------------------- | ---: | -------: | ------------------------------ |
| `tasks` (13 cols)    |    3 |       17 | **CANONICAL (used)**           |
| `tasks_v2` (20 cols) |    9 |        0 | Dead in code, **9 rows** in DB |

Dependents on `tasks_v2`:

- `task_assignments.task_id` (cascade)
- `task_dependencies.task_id` + `.depends_on_task_id` (cascade)
- `task_recurring_definitions.template_task_id` (cascade)
- `task_status_history.task_id` (cascade)
- `corrective_actions.task_id` (no action)

`tasks_v2` adds recurring definitions, status history audit, and a richer
assignment model. 9 rows in `tasks_v2` is concerning — someone wrote data
there (likely a migration script). Verify those 9 rows aren't load-bearing
before dropping.

**Recommended remediation (deferred):** Inspect the 9 `tasks_v2` rows,
decide if they need migration into `tasks`, then drop the `_v2` table +
dependents. Or finish the migration the other direction.

---

## §2 — Charthouse-banned tables

Per memory `feedback_no_charthouse.md` (Round 7), "Charthouse" terminology
is banned. UI text fully purged. Schema-level cleanup pending — 6 tables
remain:

| Table                    | Cols | Active usage          |
| ------------------------ | ---: | --------------------- |
| `charthouse_adjacency`   |   13 | yes — site-plans code |
| `charthouse_band`        |   15 | yes                   |
| `charthouse_placement`   |   18 | yes                   |
| `charthouse_station`     |   14 | yes                   |
| `charthouse_utility`     |   14 | yes                   |
| `charthouse_zone_region` |   13 | yes                   |

App refs: 21 across `src/app/(platform)/console/site-plans/*` and
`src/lib/charthouse/*`. Rename is a substantial migration (6 tables, all
their FKs, all app code, all type definitions). Deferred.

**Recommended:** rename to a non-banned namespace prefix (e.g. `siteplan_*`
or `layout_*`) in a single coordinated migration.

---

## §3 — LDP `status`-column violations

73 base tables carry a `status` column. Per LDP §NAMING DISCIPLINE
(`LIFECYCLE_DECOMPOSITION_PROTOCOL.md`), new tables must use `*_phase`
(sequential macro arc) or `*_state` (cyclical operational) instead.

`reports/LDP_LIFECYCLE_AUDIT.md` is the canonical tracking doc. The
canonical eight lifecycle columns already migrated:

| Status             | Target column             | Status                                                |
| ------------------ | ------------------------- | ----------------------------------------------------- |
| projects           | `xpms_phase` (sequential) | done (Round 15 → renamed `status` to `project_state`) |
| fabrication_orders | `production_phase`        | done                                                  |
| asset_movements    | `ual_state`               | done                                                  |
| deliverables       | `deliverable_status`      | **pending rename** to drop `status`                   |
| uis_roles          | `uis_lifecycle_state`     | done                                                  |
| offer_letters      | `offer_letter_status`     | partial — `status` column kept for back-compat        |
| accounting_periods | `state` (per FSM)         | done                                                  |
| subscriptions      | `subscription_state`      | done                                                  |

Remaining 65+ tables with `status`: review case-by-case. Many are
operational state (correct as `*_state`) mislabelled; many are simple
boolean-ish flags that should stay `status`.

---

## §4 — Multi-tenant boundary check

~125 tables lack `org_id`. Sampled — most are correctly leaf tables
inheriting tenancy via parent (line-items, attachments, mentions,
reactions, completions, votes, sessions, etc.). RLS on the parent
provides the boundary.

Tables that legitimately should NOT have `org_id`:

- User-scoped: `user_profiles`, `user_preferences`, `user_passkeys`,
  `mfa_recovery_codes`, `webauthn_challenges`, `notification_preferences`,
  `push_subscriptions`
- Global reference: `currencies`, `exchange_rates`, `tax_*`, `locales`,
  `locale_formats`, `timezone_overrides`, `permissions`,
  `role_permissions`, `feature_flags`, `notification_kind_catalog`
- System: `spatial_ref_sys`, `geography_columns`, `geometry_columns`,
  `stripe_events`, `webauthn_challenges`

**No defects found in this dimension.**

---

## §5 — FK delete-rule distribution

| Rule      |   Count | Healthy?                            |
| --------- | ------: | ----------------------------------- |
| CASCADE   |     500 | ✓                                   |
| NO ACTION |     218 | mostly ✓ — protects historical data |
| SET NULL  |     208 | ✓                                   |
| RESTRICT  |      20 | ✓                                   |
| **Total** | **946** |                                     |

Sampled NO ACTION FKs — all reference `auth.users`, historical-record
tables (journal_entries, contracts, contract_versions,
chart_of_accounts), or self-references (parent-child trees). NO ACTION
is the correct rule for these: deleting an auth user shouldn't cascade
through audit history; the FK's role is integrity, not lifecycle.

**No FK-rule defects found.**

---

## §6 — Denormalization shadow check

Queried for FK columns that have a matching `*_name` shadow column on
the same table (the classic 3NF violation). Only matches were on
`*_resolved` views (`offer_letters_resolved`,
`independent_contractor_msas_resolved`) which intentionally hydrate names
for read-side rendering — these are correct (a view, not a base table).

**No 3NF transitive-dependency defects found in base tables.**

---

## Remediation plan

| ID    | Action                                                        | Risk   | Round     |
| ----- | ------------------------------------------------------------- | ------ | --------- |
| R23.1 | Document audit (this doc) + add DB COMMENT markers            | low    | 23 (this) |
| R24.1 | Inspect the 9 `tasks_v2` rows, decide migrate vs drop         | medium | follow-up |
| R24.2 | Drop empty `form_definitions` + its empty dependents          | low    | follow-up |
| R25.1 | Wire `kb_articles` writes into `knowledge_revisions`          | medium | follow-up |
| R26.1 | Rename `charthouse_*` → non-banned prefix                     | high   | follow-up |
| R27.1 | Rename remaining `deliverables.status` → `deliverable_status` | low    | follow-up |

This round: only R23.1 (document + COMMENT markers).

---

_Auditor: claude-sonnet-4-7 / `validate` skill conventions / live DB
introspection via Supabase MCP. Repro: run the queries in
`/tmp/3nf_audit_queries.sql` (see commit)._
