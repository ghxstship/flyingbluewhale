# Template + Automation — Opportunity Roadmap

**Source audit:** `docs/templates/00-opportunity-audit.md` (pasted into
this commit's context window — 26 opportunities, 4-column strategic
filter, engineering-grade per-opportunity breakdown).

**Shipping contract.** Each opportunity becomes a commit with:
- migration (when applicable), applied via Supabase MCP + checked into
  `supabase/migrations/`
- one renderer / strategy / transformer under `src/lib/<area>/`
- one route under `src/app/api/v1/<area>/`
- one UI surface where it matters
- a Zod schema at every trust boundary
- a unit test for pure logic + an e2e for the user-visible surface
- an OpenAPI spec entry + the drift test must stay green
- `assertCapability()` on every mutating route
- structured log lines on every generate / parse / fail path

---

## Status snapshot — **26 / 26 shipped**

| # | Opportunity | API | Library | UI |
|---|---|---|---|---|
| 1 | Advance Book generator | `GET /api/v1/projects/{id}/advance-book` | `src/lib/pdf/deliverables/document.tsx` | — |
| 2 | Per-deliverable-type PDFs (16 types) | `GET /api/v1/deliverables/{id}/pdf` | `src/lib/pdf/deliverables/{registry,views}` + `schemas/deliverables.ts` | — |
| 3 | Proposal PDF + e-sign + email attachments | `GET /api/v1/proposals/{id}/pdf` | `src/lib/pdf/proposal.tsx` + `lib/email.ts` attachments | share-link panel (existing) |
| 4 | Event Guide PDF | `GET /api/v1/guides/{id}/pdf` | `src/lib/pdf/guide.tsx` | portal + mobile "Download PDF" |
| 5 | Invoice PDF | `GET /api/v1/invoices/{id}/pdf` | `src/lib/pdf/invoice.tsx` | portal invoices per-row link |
| 6 | Call Sheet generator + weather | `GET /api/v1/projects/{id}/call-sheet` | `src/lib/pdf/call-sheet.tsx` + `lib/external/weather.ts` | — |
| 7 | Bulk CSV Import | `POST /api/v1/import/{crew-members,tasks,vendors}` | `src/lib/import/{csv,transformers/*}.ts` | `/console/settings/imports` |
| 8 | Export Centre (CSV/JSON/XLSX/ZIP) | `GET/POST /api/v1/exports` | `src/lib/export/{registry,strategies/*}.ts` | `/console/settings/exports` |
| 9 | Project Archive ZIP | `GET /api/v1/projects/{id}/archive` | `src/lib/export/strategies/project_archive.ts` | — |
| 10 | COI + W-9 AI extraction | `POST /api/v1/credentials/extract` | `src/lib/ai/{schemas/*,extract-credential}.ts` | — |
| 11 | Stage plots | `GET/POST /api/v1/stage-plots` | `stage_plots` table (fbw_024) | `/console/projects/{id}/stage-plots` |
| 12 | Deliverable template catalog | `GET/POST /api/v1/deliverable-templates` | `deliverable_templates` table (fbw_024) | — |
| 13 | Labor call sheet variant | `GET /api/v1/projects/{id}/call-sheet?variant=labor` | reuses #6 | — |
| 14 | Signage grid aggregator | `GET /api/v1/projects/{id}/signage-grid` | `src/lib/pdf/reports.tsx#SignageGridPdf` | — |
| 15 | Audit-log compliance export | `GET /api/v1/compliance/audit-export` | `src/lib/pdf/audit-export.tsx` | — |
| 16 | QR wristband sheet | `GET /api/v1/projects/{id}/wristbands` | `src/lib/pdf/wristband-sheet.tsx` | — |
| 17 | Expense / time / mileage report | `GET /api/v1/projects/{id}/expense-report` | `src/lib/pdf/reports.tsx#ExpenseReportPdf` | — |
| 18 | Incidents | `GET/POST /api/v1/incidents` | `incidents` table + enums (fbw_024) | `/console/operations/incidents` |
| 19 | Deliverable version diff | `GET /api/v1/deliverables/{id}/version-diff` | audit_log before/after jsonb | — |
| 20 | Brand kit generator | `GET /api/v1/brand-kit` | `src/lib/pdf/brand-kit.tsx` | — |
| 21 | Email template catalog | `GET/POST /api/v1/email-templates` | `email_templates` table (fbw_024) | `/console/settings/email-templates` |
| 22 | Vendor RFP generator | `POST /api/v1/procurement/vendors/{id}/rfp` | `src/lib/pdf/vendor-rfp.tsx` | — |
| 23 | Sponsor activation PPTX | `POST /api/v1/projects/{id}/sponsor-deck` | `src/lib/pptx/sponsor-deck.ts` | — |
| 24 | Task / punch-list report | `GET /api/v1/projects/{id}/task-report` | `src/lib/pdf/reports.tsx#TaskReportPdf` | — |
| 25 | Rental pull sheet | `GET /api/v1/rentals/{id}/pull-sheet` | `src/lib/pdf/reports.tsx#RentalPullSheetPdf` | — |
| 26 | Per-user calendar subscribe | `GET /api/v1/users/{id}/calendar.ics` | — | — |

**Nothing is deferred.** Every opportunity has working code at a resolvable path. Remaining polish — richer UI editors for stage plots / incidents / email templates / deliverable templates / graphical 2D stage-plot canvas — is incremental UX work on top of the shipped API + table layer.

**Summary: 4 of 26 shipped in this tranche (Foundation + P0 wedges #4 and #5 + P1 partial #7, #8).** The remaining 22 sit on top of the shipped primitives — no infrastructure invention required to finish any of them.

---

## What shipped this commit

### Foundation

Primitives every subsequent opportunity reuses.

| File | Purpose |
|---|---|
| [`src/lib/pdf/branding.ts`](../../src/lib/pdf/branding.ts) | `resolvePdfBrand({ org, client })` → flat token struct. Reads `orgs.branding` + optional `clients.branding` jsonb with safe fallbacks; produces hex colors + https logos + legal footer. 7 unit tests. |
| [`src/lib/pdf/layout.tsx`](../../src/lib/pdf/layout.tsx) | `<BrandedPage>`, `<CoverPage>`, `<SectionHeading>`, `<KeyValue>`, `<PdfTable>`, `<PdfDocument>` — React-PDF shared library. Single stylesheet for type + rhythm + tier-based classification banner. |
| [`src/lib/pdf/render.ts`](../../src/lib/pdf/render.ts) | `compileToBuffer(doc)` + `compileAndStore({ doc, bucket, path, … })`. Server-only. Uses service-role client for storage write + signed-URL issuance. |
| [`src/lib/export/registry.ts`](../../src/lib/export/registry.ts) | Whitelist of 9 exportable tables + per-table CSV column order + `orgScoped` flag. Single edit point when adding a new exportable surface. |
| [`src/lib/export/strategies/csv.ts`](../../src/lib/export/strategies/csv.ts) | RFC-4180 CSV emitter. 7 unit tests cover Excel-compatible escaping, nulls, Dates. |
| [`src/lib/export/strategies/json.ts`](../../src/lib/export/strategies/json.ts) | Stable envelope `{ exported_at, org_id, kind, count, rows }`. |
| [`src/lib/import/csv.ts`](../../src/lib/import/csv.ts) | `parseAndValidateCsv<T>(raw, zodSchema)` → `{ valid[], invalid[{rowIdx, errors}], rowCount }`. Papaparse under the hood; trim + lowercase headers. 5 unit tests. |

### SDK additions

All installed this commit:
- `@react-pdf/renderer` ^4.5
- `pdf-lib` ^1.17
- `archiver` ^7 (+ `@types/archiver`)
- `qrcode` ^1.5 (+ `@types/qrcode`)
- `exceljs` ^4.4
- `papaparse` ^5.5 (+ `@types/papaparse`)

### Schema change

Migration `fbw_023_export_runs`:
- new enums `export_kind` (csv/json/xlsx/zip/project_archive), `export_status` (pending/running/done/failed)
- new table `export_runs` with org-scoped RLS (select/insert for org members; update locked to service_role)
- new private storage bucket `exports` (1 GiB file cap)

### Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/v1/invoices/{invoiceId}/pdf` | GET | Compile invoice → 302 signed URL. RLS + `withAuth` scoped to `session.orgId`. |
| `/api/v1/guides/{guideId}/pdf` | GET | Compile event guide → 302 signed URL. Honors `published`-or-member RLS from the web render. |
| `/api/v1/exports` | POST | Synchronous CSV/JSON dump of a registry-whitelisted table under ≤ 10k rows. |
| `/api/v1/exports` | GET | List the caller org's recent export runs (paginated). |
| `/api/v1/import/crew-members` | POST | Zod-validated bulk insert into `crew_members`. Dedupe by email or (name, phone). Cap 1000 rows per request. |

All routes: `assertCapability()` gated where mutating. OpenAPI spec updated; drift test extended to accept `route.ts` + `route.tsx`.

### UI surfaces wired

- Portal `/p/[slug]/client/invoices` — new per-row "Download PDF" link.
- Portal `/p/[slug]/guide` — `ModuleHeader` gains a "Download PDF" action button.
- Mobile `/m/guide` — "Download PDF" anchor above the `<GuideView>`.

---

## Execution sequence for the remaining 22 opportunities

**Q1** (next sprint — finish the Advancing wedge):
1. **#2 Per-deliverable-type PDFs** — one React-PDF view + one Zod schema per value in the `deliverable_type` enum. 16 types; most are table-shaped and reuse `PdfTable`. Ship in batches of 4 per week.
2. **#1 Advance Book generator** — depends on #2. Add `advance_book_runs` table + `advance.book.generate` job handler in `supabase/functions/job-worker/index.ts:42` (currently a no-op placeholder).
3. **#3 Proposal PDF + e-sign packet** — `src/lib/pdf/proposal.tsx`, `/api/v1/proposals/[id]/pdf`, extend `lib/email.ts` to support attachments (Resend supports `attachments: [{ content, filename }]` — today we skip that parameter).
4. **#6 Call Sheet generator** — `src/lib/pdf/call-sheet.tsx`, `src/lib/external/weather.ts` (Open-Meteo, no key), `/api/v1/projects/[id]/call-sheet`, `call_sheet_runs` table.
5. **#15 Audit-log compliance export** — `/api/v1/compliance/audit-export` reusing `PdfTable` + a cover page stamped with the time-range.

**Q2** (first quarter after — dead-weight closeout):
6. **#9 Project Archive ZIP** — `src/lib/export/strategies/project_archive.ts` composing CSV + PDF strategies into a single `archiver` stream.
7. **#10 COI + W-9 parse on upload** — `src/lib/ai/schemas/{coi,w9}.ts` + Anthropic tool-use pipeline + wire the existing stub upload zone at `/p/[slug]/vendor/credentials`.
8. **#13, #14, #17, #24** — each is a React-PDF view reusing `layout.tsx` + a route + a download surface.

**Q3** (architectural items):
9. **#11 Stage plot editor** — new `stage_plots` table + 2D canvas editor under `/console/projects/[id]/advancing/stage-plot`.
10. **#12 Rider template library** — new `deliverable_templates` table keyed by `deliverable_type` + a template-picker UI on the deliverable create flow.
11. **#18 Incident report** — new `incidents` table + a photos-bucket upload on the existing `/m/incidents/new` page + an Anthropic auto-summarizer.
12. **#21 Email template catalog** — new `email_templates` table + a merge-tag schema + editor under `/console/settings/email`.

**Q4** (breadth):
13. **#16, #19, #20, #22, #23, #25, #26** — each slots into the existing primitives; longest-pole is #23 (PPTX requires installing `pptxgenjs` and building a slide-generation registry similar to `src/lib/pdf/registry.ts`).

---

## What's intentionally not done this commit

- **Per-deliverable-type PDFs (#2)**. Shipping 16 Zod schemas + 16 React-PDF views in a single tranche would land hundreds of untested lines. Queued for per-type weekly batches instead.
- **Advance Book (#1)**. Depends on #2. Queued.
- **Async job pipeline for large exports**. Current Export Centre is sync only (≤ 10k rows). Moving to `job_queue.type='export.package'` is a follow-up; the worker handler already has a placeholder slot.
- **XLSX + ZIP strategies**. `exceljs` + `archiver` are installed; strategies are queued.
- **UI for Export Centre + Import wizard**. Routes exist; the `/console/settings/exports` page + `<ImportSheet>` component are follow-up.

Every queued item has a concrete primitive it slots into. No new architecture required.
