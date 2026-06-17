# ADR-0013 — Offer-letter artifact boundary

**Status:** Accepted — 2026-06-17
**Owner:** Platform engineering
**Relates to:** the Documents system (v6, `src/lib/documents/`), the offer-letters system (`src/lib/offer-letters/`, `src/components/offer-letters/LetterDocument.tsx`), the `project-doc-builder-bifurcation` pattern note, and ADR-0011 (the same two-surface model, applied to proposals). Formalizes the boundary left implicit after `src/lib/documents/offer-binding.ts` unified the data layer.

## Context

An offer letter is rendered by **two** components:

| # | Renderer | File(s) | Output | Role |
| - | -------- | ------- | ------ | ---- |
| 1 | **LetterDocument** | `src/components/offer-letters/LetterDocument.tsx` | Interactive React HTML; the public `/offer/[token]` signing viewer + its `/offer/[token]/print` WYSIWYS print view | The legal e-signature **instrument** — what the recipient reads, signs, and what the audit trail (typed signature, IP, timestamp) attaches to. |
| 2 | **kit DocEngine** (`offerletter`) | `src/components/documents/DocEngine.tsx` + `render-html.ts`, template in `registry.ts`, bridge in `offer-binding.ts` | `.doc` HTML (browser print → PDF via `@media print`); the OpenAPI artifact | The parametric, contract-described, white-label **document artifact** (`POST /api/v1/documents/offerletter`, `/console/documents/offerletter`). |

This is the same shape as the proposal system in ADR-0011: an interactive engagement/signing surface alongside the canonical kit document artifact. Unlike proposals, **offer letters never had a third (react-pdf) renderer**, so there is nothing to retire — the only work was unifying the data layer and recording the boundary.

### Why this is NOT an SSOT contradiction

Both renderers bind the **same canonical resolved record**, and share the **same formatters**, so they cannot drift on data or framing:

- **One record shape — `OfferLetterResolved`.** The kit resolver reads the `offer_letters_resolved` view (`resolvers.ts#offerletter`); `LetterDocument` reads the same resolved shape via the `get_offer_letter_by_token` RPC (`queries.ts#getOfferLetterByToken`) and the admin `offer_letters_resolved` read (`getOfferLetter`). The view is the single SSOT that applies every join/override.
- **One set of formatters.** `offer-binding.ts` deliberately reuses the rich renderer's own Nevada-IC-compliant helpers — `formatCompensation` / `formatPerDiem` (`src/lib/offer-letters/format.ts`) — and the shared `formatDate`. The comp/per-diem/date strings are produced by one implementation, not two.
- **No sample fallback on real letters.** Because the bridge maps the real record into the kit merge fields, the kit artifact can never silently fall back to template sample copy for a letter that exists.

The two surfaces are therefore **one document, two presentations of distinct responsibility** — exactly the boundary ADR-0011 draws for proposals.

## Decision

Adopt the **two-surface model, one document-artifact pipeline** for offer letters:

1. **The kit `offerletter` document (#2) is the single canonical *document artifact* renderer** — the parametric, OpenAPI-described, white-label representation. It is reachable from the console offer-letter detail page via the **"Document"** link (`/console/documents/offerletter?recordId={id}`), mirroring the proposal/invoice detail pattern.

2. **LetterDocument (#1) is the interactive e-signature *instrument*, not a document artifact.** The public `/offer/[token]` viewer needs behaviors the static `.doc` deliberately lacks: in-page acceptance capture (typed-signature + IP + timestamp audit trail), MSA cross-linking, and the legal WYSIWYS guarantee that the printed letter is byte-for-byte what was signed. Collapsing it into the kit engine would dissolve the signing instrument and break WYSIWYS. It is kept — and bounded: it must **not** grow a second parametric/PDF export path.

3. **The data layer is unified and must stay so.** Any new field on the offer letter is added to `offer_letters_resolved` and surfaced through `offer-binding.ts` (kit) — never bound from a divergent query. Formatters live once in `src/lib/offer-letters/format.ts` and are imported by both surfaces.

## Consequences

**Positive**
- One document artifact, one contract; the kit `offerletter` is discoverable and authoritative for "the offer letter as a document."
- The legal signing instrument is preserved intact, with its WYSIWYS and audit-trail guarantees.
- Data + formatting are single-sourced (`offer_letters_resolved` + `format.ts`), so the two surfaces cannot disagree.

**Negative / risks**
- Two render code paths still exist for one logical document. Mitigated by the shared record + shared formatters; the boundary is intentional (signing instrument vs parametric artifact), not accidental duplication.

**Neutral**
- No endpoints or files are removed by this ADR; it records and enforces a boundary. (Contrast ADR-0011, which additionally retired a broken react-pdf proposal route.)

## Alternatives considered

- **Retire `LetterDocument`, render the signing flow from the kit `.doc`.** Rejected: destroys the interactive acceptance capture and the WYSIWYS legal guarantee; a print-clean SOW-style `.doc` is not a safe e-signature instrument.
- **Make `LetterDocument` canonical, drop the kit `offerletter` template.** Rejected: orphans the offer letter from the documents system (no merge-field/`data-path` contract, no OpenAPI description, no white-label brand modes, no shared format layer with the other 28 doc types).
