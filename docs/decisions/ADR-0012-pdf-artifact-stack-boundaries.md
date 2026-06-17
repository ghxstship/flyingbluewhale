# ADR-0012 — PDF artifact stack boundaries

**Status:** Proposed
**Date:** 2026-06-17
**Owner:** Platform engineering
**Relates to:** the Documents system (v6, `src/lib/documents/`), the react-pdf library (`src/lib/pdf/`), ADR-0011 (proposal pipeline), and the `project-doc-builder-bifurcation` pattern note. Covers the standalone PDF routes left after the proposal (ADR-0011) and invoice (this change) convergence.

## Context

The platform renders client-facing artifacts through **three** stacks, all server-side:

1. **Kit documents engine** — `src/lib/documents/` + `DocEngine`/`render-html`. Token-driven merge-field templates → `.doc` HTML (browser-print → PDF via `@media print`). OpenAPI-described (`/api/v1/documents/{docType}`), contract auto-derived, white-label, 29 doc types.
2. **react-pdf library** — `src/lib/pdf/*` (`compileAndStore` → `@react-pdf/renderer` → `proposals` bucket → 302 to a signed URL). Produces **downloadable binary PDFs**. ~12 document components.
3. **System B proposal builder** — `src/lib/proposals/` + `ProposalBlockRenderer` (interactive signing surface). Out of scope here; see ADR-0011.

Stacks #1 and #2 overlap for a handful of doc types, which is the contradiction the doc-builder-bifurcation work is resolving. This ADR inventories the react-pdf routes, decides which converge onto the documents engine and which legitimately stay react-pdf, and sets a rule for new artifacts so the overlap doesn't grow.

### Inventory — every react-pdf route

| Route | Backing tables | react-pdf component | Kit doc type exists? | Classification |
| ----- | -------------- | ------------------- | -------------------- | -------------- |
| `GET /api/v1/invoices/{id}/pdf` | `invoices` + line items + client/org/project | `pdf/invoice` | **Yes** (`invoice`) | **Converge (data layer done)** |
| `GET /api/v1/proposals/{id}/pdf` | `proposals.blocks` | `pdf/proposal` | **Yes** (`proposal`) | **Converge / retire** — see ADR-0011 |
| `GET /api/v1/deliverables/{id}/pdf` | `deliverables` + org/project | `pdf/deliverables` | No (file-centric doc-spec) | **Keep standalone** |
| `GET /api/v1/guides/{id}/pdf` | `event_guides` + org/project | `pdf/guide` | No (Boarding Pass / `GuideView` system) | **Keep standalone** |
| `GET /api/v1/site-plans/{id}/pdf` | site plan record | `pdf/*` | No | **Keep standalone** |
| `GET /api/v1/pay-apps/{id}/pdf` | `payment_applications` (+ lines, POs, vendors) | `pdf/aia-pay-app` | No (AIA G702/G703) | **Keep standalone** |
| `GET /api/v1/payroll-runs/{id}/pdf` | `payroll_runs` (+ lines, users) | `pdf/certified-payroll` | No (certified payroll / WH-347) | **Keep standalone** |
| `POST /api/v1/wip/snapshot-pdf` | `wip_snapshots` | `pdf/wip-report` | No (WIP accounting report) | **Keep standalone** |

## Decision

**1. Two canonical lanes, by artifact nature — not "one engine to rule them all".**

- **Kit documents engine** is canonical for **merge-field business documents** — anything expressible as the cover/head/section/sign/foot block vocabulary over a `data-path` contract. It earns the OpenAPI contract, white-label, the print-clean `.doc`, and record-binding for free.
- **react-pdf library** is canonical for **binary-PDF artifacts whose layout is statutory, pixel-exact, multi-page, or otherwise not a merge-field document** — AIA G702/G703 pay applications, certified payroll (WH-347), WIP accounting snapshots, file-centric deliverables, and the Boarding Pass guide. These are **not** doc-builder contradictions; forcing them through the merge-field model would lose the exact statutory layouts react-pdf gives us.

**2. Where a kit doc type already exists, unify the data layer (do not duplicate the fetch).** The contradiction worth removing is **two code paths that independently query + shape the same record** and can silently drift, not the existence of two output formats (HTML vs binary PDF are both legitimate).

- **Invoice (done in this change):** `src/lib/documents/sources/invoice.ts#loadInvoiceArtifact` is now the single fetch; both the kit `invoice` resolver and `/api/v1/invoices/{id}/pdf` consume it. The PDF route's ~25 lines of inline queries are gone; column set and row ordering can no longer diverge between the HTML and PDF invoice.
- **Proposal:** data already unified on `proposals.blocks` via `proposal-binding.ts`; renderer/endpoint convergence is ADR-0011.

**3. Long-term option (deferred, not adopted now): a PDF output mode on the documents engine.** If/when the engine can emit binary PDF (render `.doc` HTML → PDF), the *duplicate* react-pdf components for kit doc types (`pdf/invoice`, `pdf/proposal`, `pdf/call-sheet`, `pdf/guide` where it overlaps) could retire, leaving react-pdf only for the statutory/standalone set. This is a meaningful infra lift (headless render or a per-template react-pdf path) and is explicitly **out of scope** here — recorded so the boundary above is understood as a waypoint, not a permanent split.

**4. Rule for new artifacts.** New client-facing documents go through the **kit documents engine first**. Drop to react-pdf only when the layout is statutory/pixel-exact or genuinely non-merge-field — and when you do, note why in the route. This keeps the overlap from regrowing.

## Consequences

- **Positive:** the only two duplicated-fetch contradictions (invoice, proposal) are addressed — invoice now, proposal via ADR-0011. The remaining six react-pdf routes are explicitly classified as legitimate standalone artifacts, so future audits don't re-flag them. New-doc guidance prevents new overlap.
- **Neutral:** two rendering stacks persist by design; that is correct given statutory layouts. The deferred PDF-output-mode option leaves a clear path to collapse the duplicate components later.
- **Cost:** none incurred now beyond the invoice loader extraction (contained, typechecked, build-verified). The deferred option is a separate, larger effort if pursued.

## Follow-ups

- (ADR-0011) Close the proposal binding gap + retire the proposal `/pdf` route.
- (Optional, deferred) Prototype a documents-engine PDF output mode; if adopted, retire `pdf/invoice` + `pdf/proposal` and route those PDFs through the engine.
- Add a one-line "why react-pdf" comment to the five statutory/standalone routes (pay-apps, payroll-runs, wip, site-plans, deliverables, guides) referencing this ADR.
