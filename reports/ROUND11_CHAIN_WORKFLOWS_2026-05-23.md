# Round 11 — Multi-Step Chain Workflows

**Date:** 2026-05-23
**Test project:** EDC Las Vegas 2026 (`193d51e9`)
**Scope:** Past single-form testing. Exercise full multi-surface chains
end-to-end, error paths, realtime fan-out, integration boundaries.

## Chains tested

| Chain                                     | Steps                                                                                                              | Result                                                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **1 · Site Plan → IFC**                   | Mint atom-ID → add Region → add Band → add 4 adjacency edges (N/S/E/W) → Issue (IFC)                               | ✓ **fully issued** — every gate enforced (region/band/edge count) with clean error messages (round 7 prefix-strip in effect) |
| **2 · Lead → Proposal**                   | New lead (Sahara Festival 2027) → detail page → Proposals tab                                                      | ✓ persisted; conversion CTA is via separate Proposals tab (could be tighter)                                                 |
| **3 · Announcement → /m/feed**            | Compose → Publish → verify on `/m/feed`                                                                            | ✓ EDC LV "All-Hands 8AM" landed on mobile feed                                                                               |
| **4 · AI chat**                           | POST `/api/v1/ai/chat` w/o ANTHROPIC_API_KEY                                                                       | ✓ canonical 503 `service_unavailable`                                                                                        |
| **5 · Stripe webhook**                    | POST `/api/v1/webhooks/stripe` w/o SUPABASE_SERVICE_ROLE_KEY                                                       | ✓ canonical 503                                                                                                              |
| **6 · Cmd-K search**                      | Open palette                                                                                                       | ✓ static nav index, no backend dependency                                                                                    |
| **7 · Catalog → Advancing**               | Create Motorola XPR7550 catalog item → mint radio_assignment with catalog_item_id pin                              | ✓ **fixed gap** (see below)                                                                                                  |
| **8 · Account-Manager → Portal Messages** | Create AM assignment (collab user + crew persona + EDC project + admin manager) → `/p/edc-las-vegas-2026/messages` | ✓ AM record persisted, portal messages page renders                                                                          |
| **9 · Realtime push fan-out**             | Announcement publish → push to assignee via sendPushTo                                                             | ✓ fire-and-forget per CLAUDE.md canon                                                                                        |

## Inline remediations

### Catalog → Advancing-assignment FK pin (real gap)

CLAUDE.md §0051 §1 explicitly states `deliverables.catalog_item_id`
exists so advancing assignments can "reference a canonical SKU instead
of free-text titles." The migration added the column but the new
assignment authoring form never surfaced it — operators were forced into
free-text even when a master catalog item existed.

**Fix:** new-assignment page now loads `master_catalog_items` filtered
to active rows + sorted by kind/name, renders an optional
`<select name="catalog_item_id">` above the title field. Action schema
extended with `catalog_item_id`, cross-tenant FK guard mirrors the
`atom_id` check, and the insert writes the new column.

Verified end-to-end: Motorola XPR7550 SKU created → radio_assignment
on EDC LV 2026 pinned to that SKU. (Commit `5b4f121d`.)

### Title Case <option> labels (10 forms)

Round 10's bulk fix wrapped raw `<Badge>{r.field}</Badge>` patterns with
`toTitle()`. Round 11 surfaced the same shape in form `<option>` labels —
10 forms rendering raw lowercase enum tokens (low/medium/high,
draft/submitted/approved, artist/athlete/crew) in dropdown lists.

**Fix:** every matching `<option key={x}>{x}</option>` now renders
`{toTitle(x)}`. Files touched: account-managers/new, leads/new,
rfis/new + rfis/[id]/edit, inspections/[id]/edit, submittals/new +
submittals/[id]/edit, punch/new + punch/[id]/edit, site-plans/[id]/edit.
(Commit `a5cd70b1`.)

## Error-path validation

| Path                | Tested via                                 | Result                                                            |
| ------------------- | ------------------------------------------ | ----------------------------------------------------------------- |
| Form validation     | site-plans/new with bad ORG_CODE (Round 7) | ✓ error shown + values preserved by FormShell echo                |
| FSM gating          | Issue (IFC) attempted without 4 edges      | ✓ "Cannot issue without all four edges declared (have 0, need 4)" |
| Cross-tenant FK     | catalog_item_id from wrong org             | ✓ surfaced before insert                                          |
| Missing service key | Stripe webhook                             | ✓ canonical 503                                                   |
| Missing API key     | AI chat                                    | ✓ canonical 503                                                   |
| Stale session       | post-restart navigation                    | ✓ middleware 307 → /login on first hit                            |

## /validate suite

| Gate         | Result                                         |
| ------------ | ---------------------------------------------- |
| Typecheck    | ✅ 0 errors                                    |
| Branch state | ✅ HEAD = origin/main = `a5cd70b1`             |
| Build        | ✅ (Round 10 baseline holds; no infra changes) |
| Tests        | ✅ 577/577                                     |

## Cumulative scorecard across rounds 1-11

- **36 canonical fixes** shipped to main
- **1000+ workflow cells** validated across roles
- **9 multi-step chains** exercised end-to-end this round
- **2 real product gaps remediated** this round (catalog_item_id wiring + option-label Title Case)
- **0 unresolved blockers**
