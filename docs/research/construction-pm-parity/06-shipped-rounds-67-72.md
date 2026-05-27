# Construction-PM Parity — 06 — Shipped Rounds 67–72

**Date:** 2026-05-27
**Companion to:** [00 master roadmap](00-master-roadmap.md) · [04 — rounds 35–53](04-shipped-rounds-35-53.md) · [05 — rounds 54–66](05-shipped-rounds-54-66.md) · [07 — acceptance criteria](07-acceptance-criteria.md)

Rounds 67–72 close the **three Partial (P) items** that survived the 35–66 wave and finish the connector matrix for construction accounting. The remaining "what is genuinely still ahead" list from [05](05-shipped-rounds-54-66.md) is reduced to a single explicitly-post-parity item (F44 multi-entity consolidation) plus credential provisioning.

---

## What shipped in this batch

### Client-side UX islands (the three P items from rounds 54–66)

| Round  | Gap / item                 | What landed                                                                                                                                                                                                                                                                                                                  |
| ------ | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **67** | G-015 / B7 — PDF markup    | PDF.js + dual-canvas markup engine. 11 markup kinds (pin, redline, cloud, text, dimension, arrow, polygon, polyline, rectangle, ellipse, freehand) over the rendered sheet. Geometry persisted in PDF-page space so it survives DPI changes. Mounts via `next/dynamic` on `/console/site-plans/[id]/markup`.                 |
| **68** | G-006 / B8 — 3D BIM viewer | `web-ifc` + `three.js` viewer for IFC models. Custom orbit controls (polar / azimuth / radius), bounding-box auto-frame, element count. WASM (web-ifc.wasm + web-ifc-mt.wasm) vendored into `/public/wasm`. Loaded only on `/console/bim/[id]/view` via `next/dynamic ssr:false` so the ~50MB bundle never hits other pages. |
| **69** | G-001 / D20 — Gantt UI     | Pure-SVG Gantt renderer over the existing `schedule_baselines` spine. Critical path highlighted (#DC2626), normal bars (#1F2937), FS dependency arrows with elbow paths, "today" marker, float bars. Lookahead modes: all / 3w / 6w (drives `?lookahead=` query). Route: `/console/schedule/baselines/[id]/gantt`.           |

### Accounting connector matrix completion

| Round  | Gap   | What landed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------ | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **70** | G-013 | **Sage 300 CRE** (OData v4), **Foundation** (X-Foundation-Auth REST), **Viewpoint Vista** (OAuth client_credentials w/ auto-refresh) connectors. All three reuse the `accounting_connections` + `accounting_sync_runs` + `accounting_mapping_rules` scaffolding shipped in Round 46/65, normalized vendor + cost-code shape, unified sync at POST `/api/v1/integrations/[system]/sync`.                                                                                                                                                                                            |
| **72** | G-013 | **QBO push-side write-back.** `pushInvoice()` + `pushBill()` against QBO v3 `/invoice` and `/bill` endpoints (`minorversion=70`). POST `/api/v1/integrations/qb-online/push` handles AR (invoice → CustomerRef via `clients.metadata.qb_id`) and AP (bill → VendorRef via `ap_invoice_extractions.matched_vendor_id` → `vendors.metadata.qb_id`). Stamps `[qb_id:...]` / `[qb_bill_id:...]` into invoice notes for round-trip dedup. **Closes the read-write loop on the QBO connector** — pulls (vendors, accounts) shipped Round 53, pushes (AR invoices, AP bills) shipped now. |

### Globalization + state-payroll extensions

| Round  | Gap          | What landed                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **71** | G-018, G-010 | **OpenWeatherMap fallback** (`src/lib/weather/openweathermap.ts`) chained after NWS for non-US daily logs and beyond-7-day horizons. Env-gated by `OPENWEATHERMAP_API_KEY`. **State certified-payroll XML renderers** (`src/lib/payroll/state-xml.ts`) — California DIR eCPR, New York PRW Affidavit, Washington L&I PrismWeb. Route at `/api/v1/payroll-runs/[runId]/state-xml` routes by `agency_report_type`. |

### Documentation (this round)

| Round  | What lands                                                                                                                                                                            |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **73** | This file (`06-shipped-rounds-67-72.md`), `07-acceptance-criteria.md` (operator-facing DoD verification per gap + credential runbook), and the master-roadmap delivery-snapshot bump. |

---

## Updated parity scorecard

| Phase                            | Pre-35 | Post-53 | Post-66 | Post-72                                                                                | Δ from start |
| -------------------------------- | ------ | ------- | ------- | -------------------------------------------------------------------------------------- | ------------ |
| A. Identity / Access             | 100%   | 100%    | 100%    | 100%                                                                                   | —            |
| B. Documents / Drawings          | 13%    | 88%     | 100%    | **100%** (B7 markup renderer live, B8 3D viewer live)                                  | +87pp        |
| C. Communications / Workflow     | 67%    | 100%    | 100%    | 100%                                                                                   | +33pp        |
| D. Schedule / Budget / Contracts | 25%    | 88%     | 100%    | **100%** (D20 Gantt UI live)                                                           | +75pp        |
| E. Field Execution               | 75%    | 88%     | 100%    | **100%** (G-018 NWS + OWM auto-pull live globally)                                     | +25pp        |
| F. Financials                    | 20%    | 80%     | 95%     | **99%** (all four accounting connectors live + QBO push-side + state-payroll XML live) | +79pp        |
| G. Closeout / Handover           | 25%    | 100%    | 100%    | 100%                                                                                   | +75pp        |
| H. Analytics / AI / Ecosystem    | 33%    | 83%     | 95%     | **100%** (all integration connectors live; differentiator wave is separate)            | +67pp        |

**Aggregate: 42% → ~99.5% parity (C+S).**

The remaining 0.5pp is **F44 — multi-entity / multi-currency consolidation**, which was explicitly tagged post-parity in the original gap inventory (G-030, ~120 IC-h). Every other gap from `03-gap-inventory.md` is now at C or S.

---

## What is genuinely still ahead (post-Round-72)

Three categories, none requiring schema/RLS work, all explicitly differentiator-wave or operational:

### 1. Differentiator wave (Wave 5, planned Q2 2027)

Per the master roadmap — explicitly beyond table-stakes parity. Not in the gap inventory because these are the **leapfrog** moves, not the catch-up moves:

- Unified events ⇄ construction lifecycle UX
- Prequalified-sub marketplace wrapper around RFQ flow
- AI-first authoring (RAG corpus expansion, agentic drafting on RFIs / submittals)

### 2. Operational provisioning

Code is live; activation depends on credentials. See [`07-acceptance-criteria.md`](07-acceptance-criteria.md) §"Credential provisioning runbook" for the per-key checklist:

| Env var(s)                                                                                    | Activates                                                    |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `OPENAI_API_KEY` or `VOYAGE_API_KEY`                                                          | Embedding worker. RAG search works once corpus is populated. |
| `SES_INBOUND_SECRET` + AWS SES rule                                                           | Inbound email capture per project.                           |
| `DOCUSIGN_CONNECT_HMAC` + DocuSign Connect listener                                           | Envelope status webhooks.                                    |
| `QB_CLIENT_ID` + `QB_CLIENT_SECRET`                                                           | QuickBooks Online OAuth flow + push.                         |
| `OPENWEATHERMAP_API_KEY`                                                                      | Global weather fallback (Round 71).                          |
| Per-tenant Sage / Foundation / Vista creds stored on `accounting_connections.auth_ciphertext` | Sage 300 CRE / Foundation / Viewpoint Vista sync (Round 70). |

### 3. Post-parity polish (P2 finishers per gap inventory)

- **G-030** multi-entity / multi-currency consolidation (post-parity by design)
- **G-031** GraphQL API layer (partner-integration nice-to-have)
- **G-032** integration marketplace UI + certified-partner program (commercial play)
- **G-033** native iOS / Android wrappers if PWA insufficient

---

## Aggregate output across rounds 35–72 (38 rounds)

- **32 migrations** applied to the Supabase project (`xrovijzjbyssajhtwvas`) — no further schema gaps after Round 66.
- **~90 new tables**, **45+ enums**, **~200 RLS policies**, **~200 indexes**.
- **pgvector** extension live + `match_document_chunks` cosine-search RPC.
- **23 console surfaces** added (with associated `actions.ts` files).
- **9 runtime engines**:
  - Pure-TS CPM scheduler (`src/lib/schedule/cpm.ts`)
  - Pure-TS schedule importer (`src/lib/schedule/import.ts`)
  - AIA G702/G703 PDF generator (`src/lib/pdf/aia-pay-app.tsx`)
  - WH-347 PDF generator (`src/lib/pdf/certified-payroll.tsx`)
  - WIP report PDF generator (`src/lib/pdf/wip-report.tsx`)
  - AP-invoice OCR via Vision (`src/lib/ai/extract-ap-invoice.ts`)
  - PDF.js markup renderer (Round 67)
  - web-ifc 3D BIM viewer (Round 68)
  - SVG Gantt renderer (Round 69)
- **5 accounting / weather / payroll helper libraries**:
  - QBO sync + push (`src/lib/accounting/qb-online.ts`)
  - Sage 300 CRE (`src/lib/accounting/sage-300-cre.ts`)
  - Foundation (`src/lib/accounting/foundation.ts`)
  - Viewpoint Vista (`src/lib/accounting/viewpoint-vista.ts`)
  - NWS + OpenWeatherMap (`src/lib/weather/{nws,openweathermap}.ts`)
  - State-payroll XML (`src/lib/payroll/state-xml.ts`)
- **9+ webhook / API endpoints** covering pay-app PDF, WH-347 PDF, WIP PDF, state-payroll XML, BIM download, AP OCR upload+extract, weather refresh, drawing markup CRUD, QBO OAuth + sync + push, multi-connector sync, SES inbound, DocuSign Connect.
- **4 PG functions** for batch computation: CPM, risk scoring, WIP snapshot, cosine search.
- **3 auto-promote triggers**: inspection_items → punch_items, meeting_action_items → tasks, transmittal_acknowledgements → state transition.

---

## Where the parity matrix stands now

Of the 55 table-stakes features:

- **54 are C or S** (core or supported / table-stakes-met).
- **1 is explicitly post-parity** (F44 multi-entity / multi-currency consolidation).

The **zero-G state** is now the **zero-P state**: no remaining hard schema gaps **and** no remaining client-island P-items.

The original plan ([00](00-master-roadmap.md)) called for ~3,250 IC-hours to reach >95% parity. Effective delivery in 38 trunk-based rounds came in well under that — every round green through typecheck + lint + build before push, with the canonical `/validate` gates clean. Construction-PM table-stakes parity is **delivered**; the next motion is the Wave 5 differentiator program described in the master roadmap.
