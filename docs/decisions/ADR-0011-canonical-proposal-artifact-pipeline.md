# ADR-0011 — One canonical proposal artifact pipeline

**Status:** Accepted — executed 2026-06-17 (rollout steps 1–4 + 6 landed; step 5 HTML→PDF file parity remains an open follow-up)
**Date:** 2026-06-17
**Owner:** Platform engineering
**Relates to:** the Documents system (v6, `src/lib/documents/`), the proposal builder (`src/lib/proposals/`), and the `project-doc-builder-bifurcation` pattern note. Second half of the proposal-system convergence begun by `src/lib/documents/proposal-binding.ts` (data layer already unified).

## Context

The proposal artifact is produced by **three separate renderers** reading the **same** `proposals.blocks` jsonb store, and exposed through **two artifact endpoints**. The data layer was just unified (the kit resolver now reads `proposals.blocks` via `proposal-binding.ts`), so all three are driven from one store — but the renderers and endpoints still diverge. This ADR decides the renderer/endpoint convergence; it does **not** rip anything out (planning only, per the task).

### The three renderers

| # | Renderer | File(s) | Output | Block coverage |
| - | -------- | ------- | ------ | -------------- |
| 1 | **ProposalBlockRenderer** | `src/components/proposals/ProposalBlockRenderer.tsx` (+ `PhaseBlock`) | Interactive HTML/Tailwind, server-rendered | All **23** block types of the `ProposalBlock` union |
| 2 | **react-pdf compiler** | `src/app/api/v1/proposals/[proposalId]/pdf/route.tsx` → `src/lib/pdf/proposal.tsx` (`ProposalPdf`) | Server-compiled PDF file, stored in `proposals` bucket, returned via 302 to a signed URL | A **different, stale** block shape — see defect below |
| 3 | **kit DocEngine** | `src/components/documents/DocEngine.tsx` + `src/lib/documents/render-html.ts`, template in `registry.ts`, bridge in `proposal-binding.ts` | `.doc` HTML (browser print → PDF via `@media print`); also the OpenAPI artifact | **12** of 23 block types mapped by the bridge; rendered as the 17-section kit canon |

### The two artifact endpoints

- `GET /api/v1/proposals/{proposalId}/pdf` — react-pdf (#2). Server-generated **downloadable file**. OpenAPI line 527.
- `POST /api/v1/documents/proposal` — kit engine (#3). Returns **HTML**; PDF is the client's browser print. PAT-scoped (`documents:read`/`documents:write`), contract-guarded, white-label.

### Exactly which surfaces call each renderer

Inventoried by grep across `src/` (call sites only, not the renderer files themselves):

**Renderer 1 — ProposalBlockRenderer (1 caller):**
- `src/app/proposals/[token]/page.tsx:87` — the **public, share-link-gated, customer-facing** proposal viewer ("on its own page"). HMAC-verified token → service-role read. Renders the full 23-block proposal **plus** the interactive `SignatureBlock` (`"use client"`, `useActionState` → `signProposalAction`), the `ProposalTopBar` (sticky nav + `IntersectionObserver` active-section tracking against `[data-section-index]`), co-brand lockup, and `<details>` legal panels. This is the live signing/engagement surface, not a static document.

**Renderer 2 — react-pdf `/pdf` route (1 caller):**
- `src/app/(platform)/console/proposals/[proposalId]/page.tsx:82` — the console proposal-detail "PDF" `DownloadLink`. Only entry point.

**Renderer 3 — kit DocEngine (callers + API):**
- `src/app/(platform)/console/proposals/[proposalId]/page.tsx:77` — the console proposal-detail **"Document"** link → `/console/documents/proposal?recordId={id}`.
- `src/app/(platform)/console/documents/[docType]/page.tsx` — the documents hub preview/print page (`?recordId=` binds a live record), wrapped in `DocToolbar` (brand toggle + `window.print()`).
- `POST /api/v1/documents/proposal` (`src/app/api/v1/documents/[docType]/route.ts`) — internal (`{recordId}`) + external (`{data}`) generation.

> The portal client proposal detail (`/p/[slug]/client/proposals/[proposalId]`) renders **none** of these — it is a metadata/management page (lifecycle, approvals, change-orders, revisions). Not an artifact surface.

### Two defects the inventory surfaced

1. **The react-pdf renderer is schema-stale.** `ProposalPdf` (`src/lib/pdf/proposal.tsx:21-26`) types a block as `{ kind?: "pricing"|"milestones"|…; title?; body?; items? }`. The real `proposals.blocks` are the `{ type: "hero"|"investment_table"|… }` discriminated union (23 variants, `src/lib/proposals/types.ts`). No real block has a `kind`, so **every block falls through to the generic `block.body` branch** (`proposal.tsx:225-230`); `body` is also absent on the real union, so block content renders as a bare fallback heading or nothing. The `/pdf` artifact today effectively contains only the summary key-values (number/status/total/deposit), notes, and signatures — **the entire authored proposal body is dropped.** This is a live correctness bug, not just duplication.

2. **The kit bridge has an expressiveness gap.** `proposalDataFromBlocks` maps 12 block types; 11 are unbound. Structural ones are harmlessly skipped (`spacer`, `section_eyebrow`, `heading`, `signature_block`, `cta`). But **content-bearing** ones — `journey`, `capabilities`, `equipment_manifest`, `callout`, `prose`, `custom` — carry real proposal copy that **silently vanishes** in the kit artifact. So #3 is not yet a faithful superset of #1.

### Why this is a contradiction worth resolving

- **Drift risk:** three code paths, one store. A new block type or a copy change must be reflected in up to three places or the artifacts disagree. #2 already disagrees (defect 1).
- **Endpoint ambiguity:** "the proposal PDF" resolves to two different documents depending on which button you press (console "PDF" vs console "Document" → print). They don't even render the same content.
- **Single-SSOT mandate:** CLAUDE.md designates the kit documents engine as the OpenAPI-described, print-clean `.doc` SSOT; a parallel react-pdf representation of the same artifact undercuts that.

## Decision

Adopt a **two-surface model, one document-artifact pipeline** — explicitly *not* three renderers, and *not* a forced collapse of all three into one component.

1. **The kit documents engine (#3) is the single canonical *document artifact* renderer.** It is the one print/PDF/OpenAPI representation of "the proposal as a document." `POST /api/v1/documents/proposal` (+ `/console/documents/proposal`) is the single artifact endpoint.

2. **Retire the react-pdf proposal route (#2).** `GET /api/v1/proposals/{proposalId}/pdf`, `src/lib/pdf/proposal.tsx`, and its OpenAPI entry are removed. The console "PDF" button repoints to the kit document (Print/PDF from `/console/documents/proposal?recordId=`). This deletes the stale, defective second representation rather than fixing it — there is no reason to maintain two artifact renderers, and #2 is the weaker one.

3. **ProposalBlockRenderer (#1) stays, but is reframed — and bounded — as the *interactive engagement surface*, not a document artifact.** The public `/proposals/[token]` viewer needs behaviors the static kit `.doc` deliberately does not have: in-page signature capture (`SignatureBlock` server action), sticky-nav + scroll-spy, hover/expand legal panels, and richer block types (`journey`, `capabilities`, `equipment_manifest`, `cta`, `custom`-HTML) the document canon doesn't express. Collapsing it into the kit engine would lose interactivity *and* content. It is kept as the live web experience and is **not** a third artifact path.

This is the honest reading of the task's "or document why they must stay separate": the two **PDF/document artifact** paths converge to one (kit); the **interactive viewer** is a genuinely different responsibility and stays — but we remove its ambiguity by naming it the engagement surface and forbidding it from growing a second export path.

### Closing the gap so #3 is a faithful superset of #1

Convergence is only safe once the kit artifact can represent everything the engagement surface authors. Before #2 is deleted:

- **Close the binding gap (defect 2):** extend `proposalDataFromBlocks` so the content-bearing unbound types (`journey`, `capabilities`, `equipment_manifest`, `callout`, `prose`, `custom`) map into kit `section` blocks. Per the bifurcation pattern, **no new DocEngine block kinds** — express richer coverage as more `section`/`table`/`kv`/`paras` blocks so the React↔HTML renderers stay byte-identical and the contract keeps auto-deriving. Where a block has no honest document representation, that omission is documented, not faked.
- **Guard it:** a test asserting every `ProposalBlock` variant either maps to a kit field or is on an explicit "intentionally view-only" allowlist — so a future block type can't silently disappear from the artifact again.

### Downloadable-file parity (follow-up, not blocking)

#2's one real capability the kit path lacks today is a **server-generated downloadable PDF file** (for email attachments / archival); the kit path relies on browser print-to-PDF. `compileAndStore` (`src/lib/pdf/render.ts`) is react-pdf-only. To reach one artifact representation with both browser-print and server-file outputs, add an HTML→PDF compile (headless Chromium / Playwright) over the kit `.doc` HTML, exposed as a `format=pdf` (or `/snapshot`) option on the documents endpoint. Tracked as a follow-up; the console "PDF" button works via Print/PDF in the interim.

## Consequences

**Positive**
- One artifact renderer, one artifact endpoint. Block/copy changes land in exactly one place; the three-way drift surface collapses to the kit template + its bridge.
- Deletes a live correctness bug (#2 dropping all block body) instead of carrying it.
- Preserves the customer-facing signing experience untouched; the public viewer keeps full expressiveness.
- The OpenAPI contract becomes the single description of "the proposal document."

**Negative / risks**
- Temporary loss of a server-generated **file** until the HTML→PDF follow-up lands; mitigated by browser Print/PDF.
- The kit artifact's visual language (letter `.doc`, 17-section canon) differs from the lush public web proposal. Acceptable: a contract/SOW document and a marketing-grade web proposal are legitimately different presentations of the same data — but the divergence must be intentional, not accidental, which the gap-closing + guard enforce.
- Removing a documented public endpoint (`/pdf`) is a contract change; needs the OpenAPI edit + a note for any external PAT consumer (grep shows only the internal console caller today).

**Neutral**
- `src/lib/pdf/` keeps its other compilers (invoice, call-sheet, AIA pay-app, payroll, WIP, vendor-RFP, wristband, reports). This ADR scopes **proposals only**; the invoice dual-PDF (`/api/v1/invoices/{id}/pdf` vs `/api/v1/documents/invoice`) is the next instance of the same pattern and should follow this precedent.

## Rollout (gated on this ADR being reviewed — nothing is removed before then)

1. Close the binding gap in `proposal-binding.ts` (+ unit tests) so the kit artifact is a faithful superset of the engagement surface.
2. Add the variant-coverage guard test.
3. Repoint the console "PDF" `DownloadLink` to `/console/documents/proposal?recordId=` (or the new `format=pdf` once it exists).
4. Delete `src/app/api/v1/proposals/[proposalId]/pdf/route.tsx` + `src/lib/pdf/proposal.tsx`; remove the OpenAPI `/api/v1/proposals/{proposalId}/pdf` entry (drift guard will flag it otherwise).
5. (Follow-up) HTML→PDF compile over the kit `.doc` for server-generated file parity.
6. Reframe `ProposalBlockRenderer` in code comments as the engagement surface; record the "interactive viewer stays separate" boundary so it doesn't regrow an export path.

## Alternatives considered

- **Make the kit engine the *only* renderer (collapse #1 too).** Rejected: loses interactive signing, scroll-spy, and 6 content-bearing block types; the public web proposal is a different product surface than a print SOW.
- **Keep all three, just fix #2's schema.** Rejected: maintains two artifact renderers and two endpoints in perpetuity — the exact contradiction this ADR exists to remove. Fixing #2 is strictly more work than deleting it once #3 is a faithful superset.
- **Make react-pdf (#2) canonical, retire the kit proposal template.** Rejected: react-pdf has no merge-field/`data-path` contract, no OpenAPI description, no white-label brand modes, and no shared format layer with the other 28 doc types; it would orphan the proposal from the documents system the rest of the platform standardizes on.
