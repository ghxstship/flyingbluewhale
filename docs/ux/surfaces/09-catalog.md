# Surface Spec #9 — Catalog (UAC / TPC)

**Shell:** ATLVS · **Route:** /console/xpms (landing) + /console/xpms/atoms (atom catalog) + /console/xpms/atoms/[atomId] (atom detail — new) + /console/xpms/classes/[code] + /console/xpms/{tiers,phases,variance,provenance,codebook} + /console/settings/catalog (master catalog items)
**Status:** Drafted · awaiting review — stop signal per brief
**Theme:** Bermuda Triangle only. ATLVS pink throughout.

## 1. Data class & lifecycle

| Item                           | Value                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conceptual XPMS class          | **9 TECHNOLOGY** — the atom registry is itself the canonical TECHNOLOGY-class surface per ADR-0004. The catalog is the spine the whole platform leans on.                                                                                                                                                                                                                        |
| Primary lifecycle (state)      | **`xpms_state`** enum (`'uac'                                                                                                                                                                                                                                                                                                                                                    | 'tpc'`) per `0001_remote_snapshot.sql:737`. UAC = Universal Atom Catalog (planned / template). TPC = Tactical Project Catalog (deployed on a specific project). Constraint: TPC rows carry `uac_origin_id`(FK back to the UAC row they were instantiated from); UAC rows have`uac_origin_id IS NULL`. Per `0001:6389` CHECK constraint. **State = "kind of catalog row," not "lifecycle phase."** |
| Secondary lifecycle (phase)    | **`xpms_atoms.phase`** — integer 1-9 corresponding to `XPMS_PHASES` per `src/lib/xpms/index.ts:118`. Same 8-phase arc that governs `projects.xpms_phase`, but here at the atom grain — what production phase does this atom belong to (e.g. an "AV truss" atom lives in phase 5 BUILD).                                                                                          |
| Class axis                     | `xpms_atoms.class_code` — 0–9 per the 10 XPMS Classes. Combined with `phase` this forms the **Class × Phase matrix** which is the canonical landing visualization.                                                                                                                                                                                                               |
| Tier axis                      | `xpms_project_composition.tier` per row → references one of 6 XPMS Tiers (social/digital/virtual/physical/experiential/theatrical). Atoms can belong to one or more tiers via composition.                                                                                                                                                                                       |
| Variance ledger                | `xpms_variance_ledger` — when a TPC atom diverges from its UAC origin during execution (substitution, quantity delta, weather, etc.), a variance row records why. `xpms_variance_reason` enum (11+ values per `0001:769`).                                                                                                                                                       |
| Master catalog items (sibling) | `master_catalog_items` per migration 0051 — org-scoped reusable inventory (credential / catering / radio / tool / equipment / uniform / travel / lodging / vehicle SKUs). Distinct from `xpms_atoms` (which are production-design atoms); master catalog rows are the **what-you-can-assign** menu, atoms are the **what-you-actually-deployed** units. Spec touches both in §3. |
| Authority docs                 | `src/lib/xpms/index.ts` (canonical XPMS constants), `src/app/(platform)/console/xpms/page.tsx` (landing), `0001_remote_snapshot.sql:6357` (xpms_atoms), `0051_catalog_account_manager_canon.sql` (master catalog), `docs/XPMS_TO_ATLVS_MAPPING.md` (UAC/TPC concept layer), ADR-0004 (TECHNOLOGY class).                                                                         |

**Two-axis truth (composite).** Atom state (UAC vs TPC) is "what kind of catalog row." Atom phase (1–9) is "where in the production arc does this belong." Combined with class_code (0–9) the atom has a canonical home in the 10×8 = 80-cell matrix that ADR-0004 Axis A × Axis B defines. The catalog surface is the canonical place to **browse and author** the matrix.

## 2. SaaS parity targets

Per brief: Notion databases, Airtable interface designer. Specific patterns:

| Product                     | Specific pattern to match or exceed                                                                                                                                                                                         | Why it applies                                                                                                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Notion Database             | Schema-aware list with field types (text, number, select, relation), view toggle (table / board / gallery / timeline), inline edit. The "database that's also a wiki" feel — every row has a long-form detail page.         | Direct fit for atom rows. Each atom = a database row with rich detail page; field types are typed by the schema.                                                |
| Airtable Interface Designer | "Page designer" — build a per-record detail page from blocks (field, chart, related table, button). Org-level admin authors the layout once; everyone sees the same chrome for that record type.                            | Future-fit: catalog admins will want to author per-atom-class detail layouts. Spec calls this out as a Phase 3 — not v1. v1 ships a canonical 3-section detail. |
| Notion Linked Database      | "Filtered view" — same database surfaced multiple places with different filters. Each surface gets a slice.                                                                                                                 | Class × Phase matrix at /console/xpms IS a set of linked-database views over `xpms_atoms`. Spec formalizes this as the navigation pattern.                      |
| Airtable Sync               | "Source of truth" feel — when a UAC atom changes, every TPC atom derived from it can opt to inherit changes (or be pinned to the original). Pinning preserves project archives; opt-in inheritance keeps active rows fresh. | Direct fit for the UAC→TPC relationship. Schema has `uac_origin_id`; spec adds an `uac_inheritance_mode` column controlling sync behavior.                      |
| Linear Projects (views)     | "Saved views as first-class navigation entries" — each view shows in the sidebar.                                                                                                                                           | Catalog navigation is overwhelming without entry points; saved views become the sidebar of `/console/xpms`.                                                     |

**Rejected references:** SAP Material Master (HRIS-class compliance bloat). Salesforce Product2 (deal-shaped, wrong abstraction). NetSuite items (too transactional).

## 3. Primary view

**Class × Phase Matrix landing at `/console/xpms`** — already partially built. 10 rows (classes) × 8 columns (phases) = 80 cells. Each cell shows the count of atoms in that (class, phase). Cell color tint = atom-density (light → dark by atom count). Click a cell → drill into the `/console/xpms/atoms?class=N&phase=M` filtered list.

Layout polish vs. today:

- Top: existing metric strip (Atoms / UAC / TPC / Variance entries) — kept.
- Middle: **the matrix itself**, replacing the current "Ten Classes" grid. Rows = classes (Anton CAPITAL CASE class names left-anchored), columns = phases (compact numbered headers across top). Each cell tappable, cell shows count + tiny state breakdown bar (UAC vs TPC ratio).
- Below matrix: existing "Six Tiers" + "Eight Phases" reference grids — kept as legend material.

For deeper atom work, the primary view at `/console/xpms/atoms` is a **state-filtered table + tile strip** (Asset Panda pattern — atoms run 100–5000 rows per org).

Tile strip: `[ UAC | TPC | Variance ]` chips with counts. Click toggles `?state=` filter.

Columns (table): identifier (mono) · name · class (chip) · phase (numbered dot) · state (UAC/TPC chip) · uac_origin_id link (when state=tpc) · last variance count · linked project (when state=tpc) · updated_at (relative).

Hover row → row actions: Open detail · Clone as UAC · Instantiate as TPC on project · Open provenance graph.

## 4. Secondary views

| View       | When operator uses it                                                                                                                                                       | Source                                  | Verdict    |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ---------- |
| `matrix`   | The Class × Phase grid (already specced as the landing).                                                                                                                    | atoms aggregated by (class_code, phase) | **Accept** |
| `table`    | Atom catalog directory. Bulk: bulk-clone, bulk-promote (UAC → TPC), bulk-archive.                                                                                           | xpms_atoms                              | **Accept** |
| `tree`     | UAC → TPC provenance tree. Roots = UAC rows; children = TPC instances grouped by project. Already partly present at `/console/xpms/provenance`.                             | `uac_origin_id` recursive               | **Accept** |
| `board`    | Reject. Atoms aren't lifecycle-board-shaped (state is binary UAC/TPC); phase board would be 8 lanes but atoms don't transition between phases — phase is a fixed attribute. | n/a                                     | **Reject** |
| `timeline` | Reject. Atoms don't have date-bound spans.                                                                                                                                  | n/a                                     | **Reject** |
| `gallery`  | Reject. Atoms are typed descriptors, not visual artifacts.                                                                                                                  | n/a                                     | **Reject** |
| `map`      | Reject. Atoms aren't geographic.                                                                                                                                            | n/a                                     | **Reject** |
| `variance` | Sub-view at `/console/xpms/variance` (already exists). List of every `xpms_variance_ledger` row with reason filter, project filter. Useful at post-mortem.                  | `xpms_variance_ledger`                  | **Accept** |

Allowed `DataViewKind` set: `["matrix", "table", "tree", "variance"]`. Default `matrix`. The `matrix` and `variance` kinds extend the DataViewKind union (similar to Surface #5's `"strip"` addition).

Filter chips (atoms):

- State (UAC / TPC)
- Class (multi)
- Phase (multi)
- Tier (multi)
- Project (typeahead — only meaningful when state = TPC)
- Has variance (toggle)
- Author / created_by (typeahead)
- Updated within (preset chips)

Saved views:

- "UAC Active" — state = UAC AND not archived.
- "TPC on Project X" — state = TPC AND project = X.
- "High-Variance" — variance_count > N over last 90d.
- "Engineering Atoms" — phase = 3 (engineering).

## 5. Lifecycle visualization

| Element                      | Pattern                                                                                                                                                                                                                                                                                         | Visual                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Landing matrix               | The matrix IS the navigation. Cell tint = density. Click → filtered atom list.                                                                                                                                                                                                                  | New `<ClassPhaseMatrix>` component.          |
| Atom state chip              | `<StatusBadge state={atom.state} />` — binary UAC/TPC with the same tone palette (UAC = muted, TPC = info).                                                                                                                                                                                     | Existing.                                    |
| Atom phase numbered dot      | `<PhaseDot phase={atom.phase} />` — the dot atom extracted in Surface #2.                                                                                                                                                                                                                       | Existing (extracted in Surface #2).          |
| Atom class chip              | `<ClassChip code={atom.class_code} />` — new primitive. Color from `XPMS_CLASSES[code].accent`. Label = "{code} {name}".                                                                                                                                                                        | New primitive.                               |
| Provenance graph             | Vertical tree, root = UAC atom, children = TPC instances by project. Each node carries variance count + last-touched.                                                                                                                                                                           | New `<ProvenanceTree>` component.            |
| Variance ledger              | `<LdpStateTimeline>`-equivalent for variance rows. Each entry shows TPC atom, reason, delta amount.                                                                                                                                                                                             | Reuse primitive.                             |
| Atom detail page             | 3-section: Identity (top — identifier, name, class chip, phase dot, state chip, lineage chip showing uac_origin if TPC), Composition (middle — child atoms when this is a composite, master_catalog_items linkage when assignable), Activity (right rail — variances + transitions + comments). | New `/console/xpms/atoms/[atomId]/page.tsx`. |
| UAC → TPC instantiation flow | One-click "Use on project" button on UAC detail → modal: pick project → confirm. Creates TPC row with `uac_origin_id` pointer. Inheritance mode default = `follow` (TPC tracks UAC edits) with `pin` opt-in (TPC frozen at instantiation time).                                                 | New flow component.                          |

## 6. RBAC affordances

| Action                                                                        | Owner | Admin | Manager                 | Member                 | Treatment                                                                                                         |
| ----------------------------------------------------------------------------- | ----- | ----- | ----------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| View matrix / atom catalog / detail                                           | ✓     | ✓     | ✓                       | ✓                      | **Shown.**                                                                                                        |
| Create UAC atom                                                               | ✓     | ✓     | ✓ (designer-class role) | —                      | **Shown** for owner/admin always; manager only with explicit `catalog_author` capability flag.                    |
| Edit UAC atom                                                                 | ✓     | ✓     | ✓ (author)              | —                      | Author-only or admin+.                                                                                            |
| Archive / delete UAC atom (with TPC descendants)                              | ✓     | ✓     | —                       | —                      | **Hidden** for manager. Confirm dialog: "N TPC instances reference this UAC. They'll detach to pinned. Continue?" |
| Instantiate UAC as TPC on a project                                           | ✓     | ✓     | ✓                       | ✓ (PM on that project) | Shown for the project's authors.                                                                                  |
| Edit TPC atom                                                                 | ✓     | ✓     | ✓ (project member)      | —                      | Shown for project members.                                                                                        |
| Log variance                                                                  | ✓     | ✓     | ✓                       | ✓ (project)            | Shown universally — variance is the field-level signal.                                                           |
| Promote TPC → UAC (reverse-engineer a deployed atom into a reusable template) | ✓     | ✓     | —                       | —                      | **Hidden** for manager + member. Owner/admin only.                                                                |
| Bulk operations                                                               | ✓     | ✓     | ✓                       | —                      | Manager+.                                                                                                         |

## 7. Empty / loading / error states

| State                            | Copy                                                                                                                                                                                                                                         | Visual          |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Empty — no atoms (admin)         | Title: "Empty Catalog" · Body: "An XPMS atom is the canonical unit of production — every truss, every cue, every credential. Author your first UAC atom or import the seed catalog." · CTAs: "+ New UAC Atom" + "Seed From Industry Catalog" | `<EmptyState>`. |
| Empty cell (matrix)              | Cell renders "0" muted with dashed border. Click still navigates to the filtered (empty) list with a "+ New in {class} × {phase}" CTA.                                                                                                       | Inline.         |
| Empty variance ledger            | "No variance recorded yet. Variance entries log when reality diverged from the plan."                                                                                                                                                        | Inline.         |
| Empty provenance tree            | "This UAC atom has no TPC instances yet. Use it on a project to create one."                                                                                                                                                                 | Inline.         |
| Loading                          | Matrix: 10×8 cell skeleton grid. Table: standard.                                                                                                                                                                                            | New + existing. |
| Optimistic instantiation failure | Toast: "Couldn't instantiate {atom.name} on {project.name} — {reason}."                                                                                                                                                                      | Sonner.         |
| Archive UAC with active TPC      | Confirm dialog (see RBAC §6).                                                                                                                                                                                                                | `<Dialog>`.     |

## 8. Bulk actions, filters, saved views, keyboard nav

| Capability   | Spec                                                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bulk actions | Atom table: Bulk-clone (UAC → new UAC) · Bulk-instantiate (UAC → TPC on selected project) · Bulk-archive · Bulk-tag tier · Bulk-export. Manager+.                                    |
| Filters      | Chip strip per §4. URL-stateful.                                                                                                                                                     |
| Saved views  | Per-user + org-share. Defaults in §4.                                                                                                                                                |
| Keyboard nav | ⌘K: atom by identifier or name. `g x` jump to /console/xpms. Matrix: arrow keys move between cells; Enter opens filtered list. Detail: `c` clone, `i` instantiate, `v` log variance. |

## 9. Mobile / narrow viewport behavior

Catalog is desktop-primary (authoring + planning); not mobile-relevant. ≤768px: matrix collapses to vertical 10-class accordion with phase sub-rows; atom table hides all but identifier + name + state. No COMPVSS entry.

## 10. Surface composition

| Path                                                                 | Change                                                                                                                                                                                                              |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/(platform)/console/xpms/page.tsx`                           | Replace "Ten Classes" + "Six Tiers" + "Eight Phases" grids with the **Class × Phase matrix** as the primary landing. Keep metric strip top. Keep "Six Tiers" + "Eight Phases" as bottom legend.                     |
| `src/app/(platform)/console/xpms/ClassPhaseMatrix.tsx`               | **New.** 10×8 grid with cell counts + density tint + click-to-drill.                                                                                                                                                |
| `src/app/(platform)/console/xpms/atoms/page.tsx`                     | Replace flat list with view resolver + tile strip + filter chips.                                                                                                                                                   |
| `src/app/(platform)/console/xpms/atoms/AtomTable.tsx`                | **New.** DataTable with column set from §3.                                                                                                                                                                         |
| `src/app/(platform)/console/xpms/atoms/AtomProvenanceTree.tsx`       | **New.** Tree view UAC → TPC by project.                                                                                                                                                                            |
| `src/app/(platform)/console/xpms/atoms/[atomId]/page.tsx`            | **New.** Atom detail page per §5 row "Atom detail page".                                                                                                                                                            |
| `src/app/(platform)/console/xpms/variance/page.tsx`                  | Polish: filter chips + saved view selector. Existing surface kept.                                                                                                                                                  |
| `src/components/xpms/ClassChip.tsx`                                  | **New.** Per-class chip with accent.                                                                                                                                                                                |
| `src/components/xpms/ProvenanceTree.tsx`                             | **New.**                                                                                                                                                                                                            |
| `src/components/views/DataViewKind.ts`                               | Add `"matrix"` and `"variance"` to the DataViewKind union.                                                                                                                                                          |
| `src/lib/db/xpms.ts`                                                 | **New.** `listAtoms`, `getAtom`, `instantiateUacAsTpc`, `logVariance`, `listProvenance`, `cloneAtom`. Mirror the production-phase.ts SDK shape.                                                                     |
| `src/lib/auth/policy.ts`                                             | Add `canAuthorAtom`, `canInstantiateAtom`, `canPromoteTpcToUac`.                                                                                                                                                    |
| `supabase/migrations/{next}_xpms_atom_inheritance_mode.sql`          | **New.** Add `xpms_atoms.uac_inheritance_mode text NOT NULL DEFAULT 'follow' CHECK (uac_inheritance_mode IN ('follow', 'pin'))`. Future-fits Airtable Sync pattern.                                                 |
| `supabase/migrations/{next}_xpms_uac_change_propagation_trigger.sql` | **New (optional).** Trigger on UAC atom UPDATE → for each `follow`-mode TPC descendant, apply diff. Cautious — opt-in trigger, conservative on what fields propagate (name, description, default qty; NOT actuals). |

## 11. Acceptance

1. Operator finds an atom by identifier via ⌘K + opens detail in ≤2 actions.
2. Clicking a matrix cell (class 5, phase 6) renders the atom list filtered to that cell in <200ms.
3. UAC → TPC instantiation flow completes in ≤3 clicks; provenance tree on the UAC detail page updates within 30s.
4. Logging variance on a TPC atom appends to ledger; matrix tile (class × phase) recalculates the variance count within 30s.
5. Archiving a UAC with 3 active TPC instances triggers confirm dialog; on confirm, TPC rows flip to `inheritance_mode = pin` automatically.

## 12. Resolutions — 2026-05-24

1. **Matrix vs grid landing — which is the canonical?** **Matrix is canonical.** The Class × Phase grid is the surface's signature visualization; ADR-0004's two-axis spine is literally what it draws. Today's "Ten Classes" grid loses the phase axis, leaving operators to navigate by class alone.
2. **UAC → TPC inheritance — follow or pin by default?** **Follow.** Reasoning: most edits to a UAC atom (typo fixes, spec refinements) should ripple to active TPCs unless explicitly pinned. The reverse default would silo improvements to UACs and trap projects in stale specs. The `pin` mode is the explicit opt-out for projects that have already deployed and don't want late changes.
3. **Variance ledger — visible on every atom detail or only TPC?** **Only TPC.** UAC atoms don't deploy, so variance is meaningless for them. Variance section is conditional render on `atom.state === 'tpc'`.
4. **`master_catalog_items` vs `xpms_atoms` — should they merge?** **No, keep separate.** `master_catalog_items` is the assignable-to-individuals catalog (credentials, catering, radios — Surface #4 deliverable scope). `xpms_atoms` is the production-design catalog (truss, dimmer rack, plot — design + execution scope). Different domains, different consumers. A future "linked" view at the detail page might surface master_catalog_items that belong to a particular xpms_atom class — additive, not a merge.
5. **Promote TPC → UAC — when does this happen?** **Rare but valuable.** A TPC atom that proves itself on a project (clean execution, no variance, customer-loved) can be promoted to a UAC template for future reuse. Owner/admin only. Confirms "Promote this TPC to UAC? Future projects can instantiate it. Original TPC stays linked as the first instance."
6. **Atom detail page — Airtable-style designer or canonical layout?** **Canonical for v1.** Per-class custom layouts is a Phase 3 capability; v1 ships the 3-section detail (Identity / Composition / Activity). Adding designer layouts later doesn't break callers because each section is a slot.

---

**Phase 2 ready.**
