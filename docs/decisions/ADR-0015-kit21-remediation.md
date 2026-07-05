# ADR-0015 — Kit 21 remediation: 3NF SSOT disposition of the remaining wave items

**Status:** Accepted · 2026-07-05
**Supersedes/extends:** [ADR-0014](ADR-0014-kit-v78-3nf-disposition.md) (the 3NF SSOT law — one noun, one store; reach new views by facet + alias, not a new table).

## Context

The kit 21 (Jul 2026) enhancement wave landed W0–W8 plus the offline queue,
KB verification, and the deliverable multi-reviewer tally. Eight items were
left open and initially framed as "features/new surfaces." Run each through
the 3NF SSOT law first and they collapse into **facets, lenses, actions, and
reads over stores that already exist** — the dividend a normalized store layer
is meant to pay.

Two axes govern the remediation:

- **3NF SSOT** decides *where the data lives* — almost always an existing store.
- **2026 SaaS trends** decide *how it surfaces* — polymorphic object+lens model
  (Attio), realtime activity feeds (Stripe/Linear), one-domain-three-shells,
  progressive completion (Raken/FloQast), and schema-as-data with live preview
  (Airtable/Retool).

## Decision — disposition

| # | Item | 3NF verdict | Rides existing store | Migration | Trend |
|---|---|---|---|---|---|
| 1 | Opportunities bizdev sub-types | Facet + lens | `crm` (kind deal/lead/rfp) | +1 col `bd_type` | Attio object + saved views |
| 2 | Audit-log live prepend | Realtime read | `audit_log` (append-only) | none | Stripe/Linear activity feed |
| 3 | Mobile inbox record-ref chips | Shared resolver + shell route map | none (refactor) | none | One-domain-three-shells |
| 4 | Daily-log sections-signed | New child | `daily_logs` + `daily_log_*` | +1 child `daily_log_signoffs` | Raken progressive completion |
| 5 | Period Close checklist | Facet on `tasks` | `tasks` + `accounting_periods` | +2 cols on tasks | FloQast guided close |
| 6 | job_templates → work order | Record-action (clone) + facet | `job_templates`/`_steps`, `work_orders` | +1 col `last_used_at` | Clone-to-start blueprints |
| 7 | Community Q&A | Facet (category + accepted) | `community_posts`/`_comments` | +1 col `accepted_comment_id` | Discourse/SO Q&A |
| 8 | Schema Builder | Read/derive over SSOT | documents registry + `contract.ts` | none | Airtable/Retool schema-as-data |

Only two items require net-new schema (one child table, two facet columns).
Nothing needs a new **store**.

## Sequence

- **R1 — zero-migration:** audit realtime prepend (#2), Schema Builder read
  surface (#8), mobile record-ref shared resolver + shell route map (#3).
- **R2 — single-column facets + actions:** Opportunities `bd_type` lens (#1),
  Community Q&A accepted-answer facet (#7), job-template clone action (#6).
- **R3 — child-table completeness (reuses the `deliverable_reviewers` shape):**
  daily-log sign-off child (#4), Period Close `tasks` facet (#5).

## Future-proofing rules (codified)

1. **"New noun" decision gate.** Before any `create table`, answer in order —
   *facet? lens/alias? child of an existing parent? record-action?* A new table
   is the last resort and needs an ADR line.
2. **Shared-resolver + shell-route-map** is the canon for any cross-shell chip
   or deep-link: one resolution SSOT returning record identity, a per-shell
   mapper for the destination.
3. **Realtime-over-SSOT** is the canon for all activity/audit/feed surfaces —
   never a second event store.
4. Guards ride each phase: `nav-routes` / `gen:ia-map` for new lenses,
   `no-as-any` for typed registries, the in-section-empty (`EMPTY_COPY_RE`)
   discipline for panel empties.
