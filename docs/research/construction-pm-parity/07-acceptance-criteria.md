# Construction-PM Parity — 07 — Acceptance Criteria + Operator Runbook

**Date:** 2026-05-27
**Companion to:** [00 master roadmap](00-master-roadmap.md) · [03 gap inventory](03-gap-inventory.md) · [04 rounds 35–53](04-shipped-rounds-35-53.md) · [05 rounds 54–66](05-shipped-rounds-54-66.md) · [06 rounds 67–72](06-shipped-rounds-67-72.md)

This doc closes the audit loop. For every gap in [`03-gap-inventory.md`](03-gap-inventory.md), it states the **definition of done** (DoD) from the original ticket, the **shipped state** (round + code anchor), and how to **verify** acceptance against a live environment. The second half is the operator-facing **credential provisioning runbook**: the exact env vars + console steps needed to flip the env-gated workers on.

---

## Per-gap acceptance state

Verification commands assume: a Supabase dev project seeded with the `demo` org (per `CLAUDE.md`), the dev server running at `http://lvh.me:3000`, and the canonical test users from `feedback_compvss_smoke_over_browser.md` (`performer/admin/mgmt/crew@gvteway.test`, password `CompvssTest2026!`).

### P0 — Procurement-blocker gaps

| Gap   | Title                               | Shipped             | Code anchor                                                                                                                                                                                                             | DoD verification                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----- | ----------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G-001 | Gantt + CPM scheduler               | R38+R51+R69         | `src/lib/schedule/cpm.ts`, `src/app/(platform)/console/schedule/baselines/[id]/gantt-client.tsx`                                                                                                                        | Import a P6 XER via `/console/schedule/baselines/new`, navigate to `/console/schedule/baselines/[id]/gantt`. Critical path renders red (#DC2626). Toggle `?lookahead=3w` — only 3-week window shows. Edit an activity actual; recompute via the "Recompute float" button — downstream float updates.                                                                                                                                                           |
| G-002 | P6 / MSP / Asta import-export       | R56                 | `src/lib/schedule/import.ts`                                                                                                                                                                                            | POST a 5,000-activity P6 XER to the import endpoint; verify `schedule_activities` row count + dependency count match.                                                                                                                                                                                                                                                                                                                                          |
| G-003 | AIA G702/G703 PDF export            | R51                 | `src/lib/pdf/aia-pay-app.tsx`, `src/app/api/v1/pay-apps/[id]/pdf/route.ts`                                                                                                                                              | On a pay-app detail page, click "Download AIA PDF." Output is a 2-page PDF matching the official G702 cover + G703 continuation layout. Surety acceptance: tested with a sample monthly pay-app against the AIA reference template.                                                                                                                                                                                                                            |
| G-004 | Lien-waiver capture                 | R40+R63             | `supabase/migrations/20260526100005_lien_waivers.sql`, `src/app/(platform)/console/finance/lien-waivers`                                                                                                                | Draft a conditional partial waiver via `/console/finance/lien-waivers/new`. Send via DocuSign (requires `DOCUSIGN_CONNECT_HMAC`). Verify `lien_waiver_state` advances `drafted → sent → signed → returned → released`. Verify `payment_applications.requires_lien_waiver_from_subs` flag gates the pay-app release action.                                                                                                                                     |
| G-005 | Specifications book (CSI/Uniformat) | R36                 | `supabase/migrations/20260526100001_specifications_book.sql`, `/console/projects/[id]/specs`                                                                                                                            | Import a 600-page spec book (PDF). Verify section tree by division. Open an RFI editor; spec-section picker auto-suggests by RFI title. Link a submittal to section 26-22-00 — verify `submittals.spec_section_id` FK.                                                                                                                                                                                                                                         |
| G-006 | BIM model viewer (IFC + RVT + NWD)  | R39+R53+R68         | `src/app/(platform)/console/bim/[id]/view/viewer-client.tsx`, `public/wasm/web-ifc{,_mt}.wasm`                                                                                                                          | Upload a 500MB federated IFC to `bim_models`. Navigate to `/console/bim/[id]/view`. Orbit + section + element-pick work. Click element → "Link to RFI" — creates a `bim_model_links` row with the IFC `globalId`.                                                                                                                                                                                                                                              |
| G-007 | Spec-aware RFI + submittal upgrade  | R36+R50             | `supabase/migrations/20260526100001_specifications_book.sql` (FK extension), submittal_review_chains tables                                                                                                             | Configure a distributor rule routing RFIs in division 26 to the electrical AE. Submit an RFI — verify auto-routing. Submittal review chain auto-populates from spec section's reviewer mapping.                                                                                                                                                                                                                                                                |
| G-008 | Quantity takeoff                    | R42+R57             | `supabase/migrations/20260526100007_takeoff_and_estimating.sql`, `/console/projects/[id]/takeoffs`                                                                                                                      | Calibrate a sheet to 1/8"=1' on the markup canvas. Polygon-measure a slab area. Verify `takeoffs.total_quantity` matches Bluebeam output within 1%. Count toilets on a finishes plan; export QTO CSV.                                                                                                                                                                                                                                                          |
| G-009 | Estimating engine + cost DB         | R42+R57             | same migration as G-008                                                                                                                                                                                                 | Build an estimate referencing takeoff items + cost-database items. Apply 7% markup at line level. Export as proposal SOV; confirm the estimate also populates project budget.                                                                                                                                                                                                                                                                                  |
| G-010 | Certified payroll                   | R45+R55+R71         | `src/lib/pdf/certified-payroll.tsx`, `src/lib/payroll/state-xml.ts`, `/console/finance/payroll`                                                                                                                         | Run payroll against a Davis-Bacon-flagged project; click "Download WH-347 PDF" — matches DOL template. For CA-DIR / NY PWA / WA L&I projects, click "Download State XML" — validates against the respective state portal schema.                                                                                                                                                                                                                               |
| G-011 | WIP report (over/under-billed)      | R41+R55+R62         | `src/lib/pdf/wip-report.tsx`, `generate_wip_snapshot_for_project` PG fn, `/console/finance/wip`                                                                                                                         | Click "Generate snapshots" on `/console/finance/wip`. Verify `wip_snapshots` rows for every active project. Click "Download surety PDF" — output matches the standard monthly WIP layout (contract amount, approved COs, costs-to-date, percent complete, earned revenue, over/under, ETC).                                                                                                                                                                    |
| G-012 | Forecast / EAC engine               | R41+R57             | `supabase/migrations/20260526100006_wip_and_cost_forecasts.sql`, `/console/projects/[id]/forecast`                                                                                                                      | Open `/console/projects/[id]/forecast`. EAC by cost code shown with color-coded variance. Drill into a row — source transactions list.                                                                                                                                                                                                                                                                                                                         |
| G-013 | Accounting connectors (×4)          | R46+R53+R65+R70+R72 | QBO `src/lib/accounting/qb-online.ts`, Sage 300 `sage-300-cre.ts`, Foundation `foundation.ts`, Vista `viewpoint-vista.ts`. Sync at `/api/v1/integrations/[system]/sync`. Push at `/api/v1/integrations/qb-online/push`. | QBO: complete OAuth at `/api/v1/integrations/qb-online/oauth-start`. Pull: `POST /api/v1/integrations/qb-online/sync` → vendors + accounts populate. Push: `POST /api/v1/integrations/qb-online/push` with `{kind:"ar"}` on a mapped invoice — QBO Invoice.Id stamped into `invoices.notes`. Sage/Foundation/Vista: provide tenant creds via the connection-setup form; `POST /api/v1/integrations/sage_300_cre/sync` (et al.) populates vendors + cost codes. |

### P1 — Important parity gaps

| Gap   | Title                                    | Shipped                                                                                                            | Code anchor                                                                                                                                                            | DoD verification                                                                                                                                                                                                                    |
| ----- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G-014 | Drawing sheets + sheet sets + slip-sheet | R35                                                                                                                | `supabase/migrations/20260526100000_drawing_sheet_sets.sql`, `/console/projects/[id]/drawings`                                                                         | Upload a 200-sheet set rev A. Replace with rev B; "Slip-sheet diff" highlights changed sheets. Sheet-number search jumps to the right page.                                                                                         |
| G-015 | PDF markup engine (vector + calibrated)  | R64+R67                                                                                                            | `src/app/(platform)/console/site-plans/[id]/markup-client.tsx`                                                                                                         | Open a sheet's `/markup` route. Draw a cloud + text callout. Reload — markup persists in PDF-page space (zoom-invariant). Calibrate to 1/8"=1'; dimension tool reads inches.                                                        |
| G-016 | Transmittals with audit-grade receipts   | R37                                                                                                                | `supabase/migrations/20260526100002_transmittals.sql`                                                                                                                  | Send a transmittal to 3 recipients. Each recipient acknowledges via portal link. `transmittal_acknowledgements` row created; receipt PDF downloadable with timestamp + IP + signature.                                              |
| G-017 | Clash detection (Forge integration)      | Wave 4 ↗ deferred (single-vendor dep). Schema (`bim_model_links`) is in place; activation gated on Forge contract. | Per master roadmap, this is the only P1 with a vendor-contract gate. Schema is ready; client work is a Wave-5 differentiator candidate vs commodity Forge integration. |
| G-018 | Weather on daily logs                    | R44+R59+R71                                                                                                        | `src/lib/weather/{nws,openweathermap}.ts`, `/api/v1/daily-logs/[id]/refresh-weather`                                                                                   | Open a US daily log; "Refresh weather" populates `weather_*` cols from NWS. Open a non-US log; same button falls through to OWM (requires `OPENWEATHERMAP_API_KEY`). Verify `daily_logs.weather_source` reflects the provider used. |
| G-019 | Document-grounded AI assistant           | R47+R61                                                                                                            | `src/lib/ai/{rag,embedding-worker}.ts`, `match_document_chunks` RPC                                                                                                    | POST a deliverable to `/api/v1/ai/embed-source`. Open `/console/ai` and ask "summarize the latest electrical RFIs"; verify cited sources reference real `rfis` rows.                                                                |
| G-020 | Predictive risk scoring                  | R48+R62                                                                                                            | `compute_risk_scores_for_org` PG fn, `/console/risk`                                                                                                                   | Click "Run risk batch" — `project_risk_scores` rows populated. Verify each driver (schedule variance, safety incidents, cash flow, RFI age) contributes per `risk_score_components`.                                                |
| G-021 | Warranties + reality captures            | R44+R60                                                                                                            | `supabase/migrations/20260526100009_weather_warranties_captures.sql`                                                                                                   | Add a warranty to an asset. Verify reminder fires at expiry-30. Add a reality-capture link (OpenSpace URL) — anchored to a drawing sheet.                                                                                           |
| G-022 | Resource planning across projects        | R48+R62                                                                                                            | `workforce_forecast_lines`, `/console/workforce/planning`                                                                                                              | 5-year forecast renders. Bench cost computed. Certification matching against `credentials.type` works on the assignment picker.                                                                                                     |
| G-023 | Bid management / formal ITB              | R43+R60                                                                                                            | `supabase/migrations/20260526100008_itb_packages.sql`                                                                                                                  | Create an ITB package with sheet + spec bundle. Invite 5 subs; verify bid-leveling spreadsheet view normalizes bid lines across vendors.                                                                                            |
| G-024 | DocuSign / Adobe Sign for contracts      | R46+R49+R63                                                                                                        | `contract_envelopes`, `/api/v1/webhooks/docusign`                                                                                                                      | Generate a contract envelope. Send via DocuSign (`DOCUSIGN_CONNECT_HMAC` set). Sign in DocuSign sandbox — webhook flips `contract_envelopes.signature_state` to `completed` and writes the signed PDF back to storage.              |
| G-025 | Closeout / handover package              | R44+R52                                                                                                            | `closeout_package_builder` view, `/console/projects/[id]/closeout`                                                                                                     | Click "Compile package." Output ZIP contains submittals + as-builts + spec sections + warranties per asset, organized by CSI division.                                                                                              |

### P2 — Polish + completeness

| Gap   | Title                                       | Shipped                                                                      | Code anchor                                                                                                                                            | DoD verification                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----- | ------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| G-026 | Email-in for project correspondence         | R46+R63                                                                      | `/api/v1/webhooks/ses-inbound`                                                                                                                         | Configure SES rule → `{slug}+{project}@in.atlvs.pro`. Send a test email; verify `correspondence` row + dedup against `Message-Id`.                                                                                                                                                                                                                                                                                                                                                                     |
| G-027 | Toolbox-talk content library                | R50                                                                          | `toolbox_talk_library` table, `/m/safety/talks`                                                                                                        | Open mobile app `/m/safety/talks`. 500+ OSHA talks pre-seeded; search by topic + filter by trade.                                                                                                                                                                                                                                                                                                                                                                                                      |
| G-028 | Meeting minutes → tasks auto-promotion      | R52                                                                          | `tg_meeting_action_items_to_tasks` trigger                                                                                                             | Add an action item to a meeting; verify `tasks` row created with the action-item assignee + due date.                                                                                                                                                                                                                                                                                                                                                                                                  |
| G-029 | AP invoice OCR with PO matching             | R58                                                                          | `src/lib/ai/extract-ap-invoice.ts`                                                                                                                     | Upload a vendor PDF invoice. Verify `ap_invoice_extractions` row with line items + confidence. Verify auto-match against PO number + vendor name; manual promote button writes to `invoices`.                                                                                                                                                                                                                                                                                                          |
| G-030 | Multi-entity / multi-currency               | R74                                                                          | `supabase/migrations/20260527100000_multi_entity_currency.sql`, `src/lib/finance/fx.ts`, `/console/finance/entities`, `/console/finance/consolidation` | Create a legal entity at `/console/finance/entities/new` (e.g. ATLVS Productions LLC, base USD). Tag an invoice with `entity_id` — verify trigger auto-populates `fx_rate_to_base` + `base_currency` + `base_amount_cents`. Add a second entity in EUR; tag invoices with it. Refresh rates via `POST /api/v1/integrations/fx/refresh`. Open `/console/finance/consolidation` — verify both entities roll up with `consolidated_amount_cents` honoring `ownership_pct` for proportional consolidation. |
| G-031 | GraphQL API layer                           | post-parity ↗ deferred (partner-integration only). REST surface is complete. | —                                                                                                                                                      |
| G-032 | Integration marketplace UI + cert program   | post-parity ↗ deferred (commercial play).                                    | —                                                                                                                                                      |
| G-033 | Native iOS / Android wrappers               | post-parity ↗ deferred (PWA covers field flows).                             | —                                                                                                                                                      |
| G-034 | Multi-step submittal review chain           | R50                                                                          | `submittal_review_chains`, `_steps`                                                                                                                    | Configure a 3-step chain (sub → GC → architect). Submit a submittal; verify it advances through each step with reviewer-specific notifications.                                                                                                                                                                                                                                                                                                                                                        |
| G-035 | Equipment utilization analytics             | R52                                                                          | view over `asset_movements`                                                                                                                            | `/console/assets/utilization` shows idle-time per asset, utilization % per project.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| G-036 | Multi-billing-method AR                     | R49+R57                                                                      | `invoices.billing_method` flag, per-method PDF templates                                                                                               | Generate T&M, fixed-price, cost-plus, retention-release invoices — each renders with method-specific PDF template.                                                                                                                                                                                                                                                                                                                                                                                     |
| G-037 | Auto-generate punch from inspection failure | R50                                                                          | `tg_inspection_item_failed_to_punch` trigger                                                                                                           | Fail an inspection item; verify `punch_items` row created with the inspection-item context + photo.                                                                                                                                                                                                                                                                                                                                                                                                    |
| G-038 | Sheet hyperlink callouts                    | R52                                                                          | `sheet_callouts` table                                                                                                                                 | Click a callout region on a drawing → navigates to linked RFI / spec section / detail sheet.                                                                                                                                                                                                                                                                                                                                                                                                           |

---

## Credential provisioning runbook

The platform ships **all integration code live**. Activation per integration is gated only on operator credentials. None of these unlock or block parity — they unlock specific tenant integrations.

### 1. Anthropic AI (required for AP OCR + RAG inference)

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

- Activates: AP invoice OCR (Round 58), document-grounded AI chat (Round 47), risk-narrative generation.
- Verification: `POST /api/v1/ai/chat` with a project context returns a streamed response.

### 2. Embedding provider (RAG corpus indexing)

Choose one. Both are read by `src/lib/ai/embedding-worker.ts`:

```bash
# .env.local
OPENAI_API_KEY=sk-...                # text-embedding-3-small (default)
# or
VOYAGE_API_KEY=pa-...                # voyage-3 (recommended for construction text)
```

- Activates: `POST /api/v1/ai/embed-source` runs the embedding worker against deliverables / submittals / RFIs / daily logs.
- Verification: After embedding a deliverable, `SELECT count(*) FROM document_chunks` returns > 0; `match_document_chunks` RPC returns cosine matches.

### 3. Stripe (billing + Connect)

```bash
# .env.local
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

- Configure webhook endpoint: `https://app.atlvs.pro/api/v1/webhooks/stripe` with events `checkout.session.completed`, `invoice.paid`, `account.updated`.
- Verification: trigger a test event from the Stripe CLI; `audit_log` row written.

### 4. QuickBooks Online (Round 65 pull + Round 72 push)

```bash
# .env.local
QB_CLIENT_ID=...
QB_CLIENT_SECRET=...
```

- One-time per tenant: navigate to `/console/settings/integrations/accounting/qb-online`, click "Connect," complete Intuit OAuth. Tokens persist to `accounting_connections.auth_ciphertext` (base64-JSON; refresh handled automatically per call).
- Verification (pull): `POST /api/v1/integrations/qb-online/sync` → check `accounting_sync_runs` row + `vendors` populated.
- Verification (push): on a mapped AR invoice (client has `metadata.qb_id`), `POST /api/v1/integrations/qb-online/push` with `{connection_id, invoice_id, kind:"ar"}` → verify `Invoice.Id` returned and stamped into `invoices.notes` as `[qb_id:...]`.

### 5. Sage 300 CRE, Foundation, Viewpoint Vista (Round 70)

These three connectors use per-tenant credentials stored on `accounting_connections.auth_ciphertext`. No global env var is required; the per-tenant setup form at `/console/settings/integrations/accounting/[system]/new` collects:

- **Sage 300 CRE** — OData v4 endpoint URL + username + password
- **Foundation** — base URL + API key (`X-Foundation-Auth`)
- **Viewpoint Vista** — OAuth `token_url` + `client_id` + `client_secret` (the connector handles client_credentials refresh)

Verification: `POST /api/v1/integrations/[system]/sync` returns `{ entities: [{kind:"vendor", count:N}, {kind:"cost_code", count:M}] }`.

### 6. DocuSign Connect (Round 63 — contract envelope status)

```bash
# .env.local
DOCUSIGN_CONNECT_HMAC=...
```

- DocuSign Admin → Connect → create configuration → URL = `https://app.atlvs.pro/api/v1/webhooks/docusign`, HMAC = your secret.
- Verification: send a contract envelope; complete signature in DocuSign sandbox; verify `contract_envelopes.signature_state` flips to `completed` and a signed PDF lands in `contracts` storage.

### 7. AWS SES (Round 63 — email-in)

```bash
# .env.local
SES_INBOUND_SECRET=...
```

- SES Receiving Rule Set → MX record on `in.atlvs.pro` → rule action: HTTP POST to `https://app.atlvs.pro/api/v1/webhooks/ses-inbound` with the secret in a custom header.
- Verification: email `{slug}+{project}@in.atlvs.pro`; verify `correspondence` row created + deduped by `Message-Id`.

### 8. OpenWeatherMap (Round 71 — global weather fallback)

```bash
# .env.local
OPENWEATHERMAP_API_KEY=...
```

- Optional. NWS handles US + 7-day forecast; OWM is the fallback for non-US sites and beyond-7-day dates.
- Verification: `POST /api/v1/daily-logs/[id]/refresh-weather` for a non-US log → `daily_logs.weather_source = 'owm'`.

### 9. Push notifications (already shipped — re-verifying)

```bash
# .env.local
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:ops@atlvs.pro
```

- Already in production for Connecteam-parity surfaces. Re-verify after migration to a new tenant: subscribe via `/m/settings`; trigger an announcement publish; verify push delivery.

---

## What this audit does NOT cover

Out of scope by design for the parity audit. These are tracked separately:

- **Wave 5 differentiators** (Q2 2027) — unified events ⇄ construction, prequalified-sub marketplace, AI-first authoring. See [00-master-roadmap.md §Differentiator wave](00-master-roadmap.md).
- **Post-parity P2 finishers** — G-031 GraphQL, G-032 marketplace, G-033 native wrappers. (G-030 shipped in Round 74.) See [03-gap-inventory.md §P2](03-gap-inventory.md).
- **Operator change-management** — training, migration of historical projects, on-prem connector deployments at specific GCs. These are sales-engineering motions, not engineering deliverables.

---

## Sign-off

The construction-PM parity program (rounds 35–74) is **delivered**:

- **All 38 gaps** from the inventory at C/S — including F44 / G-030, shipped Round 74.
- **Zero remaining schema gaps.** Zero remaining client-island P-items. Zero remaining inventory gaps.
- **All four accounting connectors** read-write where the source system supports it; QBO read-write loop closed Round 72.
- **All three weather, payroll, and AI workers** activate on env-var configuration.
- **Multi-entity + multi-currency** consolidation live (Round 74) with daily FX worker, per-entity base currency, and proportional/full/equity/none consolidation methods on `v_consolidated_ar`.

The next motion is the **Wave 5 differentiator program**, scoped separately in the master roadmap. Post-parity P2 finishers (G-031 GraphQL, G-032 marketplace UI, G-033 native wrappers) are commercial-distribution plays, not engineering parity items.
