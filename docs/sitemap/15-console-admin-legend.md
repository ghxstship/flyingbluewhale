# ATLVS Console — Admin, AI & LEG3ND

Page inventory for the admin, AI, knowledge, and LEG3ND segments of the `(platform)` console. Every `page.tsx` under the in-scope `/console` segments is listed; dynamic children (`[id]`, `/new`, `/edit`) are collapsed under their parent route where the detail/CRUD behavior naturally belongs to the same resource. CRUD is sourced from the colocated `"use server"` `actions.ts` exports and the page's own forms/tables/buttons.

## Settings

- `/console/settings` — Settings hub; renders a card per `settingsNav` destination (the SSOT) grouped by section, with per-href descriptions. **CRUD/interactive:** read-only index (navigation links only).
- `/console/settings/organization` — Org profile: name, tier, member/invite/project counts. **CRUD/interactive:** rename org (`updateOrgName`, admin-gated); links to members/invites.
- `/console/settings/branding` — White-label appearance (logo, accent/secondary colors, favicon, hero/OG images) applied across shells + PDF exports. **CRUD/interactive:** branding form (`updateBrandingAction`).
- `/console/settings/domains` — Custom domains for portals (CNAME/TXT verification, auto-TLS). **CRUD/interactive:** add domain (`addDomainAction`), verify (`verifyDomainAction`), delete (`deleteDomainAction`).
- `/console/settings/email-templates` — Transactional email template catalog (slug/subject/active). **CRUD/interactive:** edit templates via `EmailTemplatesPanel` (client island).
- `/console/settings/sso` — SAML/OIDC SSO providers; email-domain login redirect. **CRUD/interactive:** DataTable; upsert (`upsertSsoProvider`), toggle enable (`toggleSsoProvider`), delete via DeleteForm (`deleteSsoProvider`).
- `/console/settings/account-managers` (+ `/new`, `/[id]`) — Pair portal contacts with org-side account managers per persona × project; drives portal `/messages`. **CRUD/interactive:** DataTable list; create (`createAssignment`), toggle active (`toggleActive`), delete (`deleteAssignment`).
- `/console/settings/governance` — Governance committees + policies (cadence, charter, review dates). **CRUD/interactive:** create committee (`createCommittee`), create policy (`createPolicy`) via forms; tables read-only.
- `/console/settings/time-clock-zones` (+ `/new`, `/[id]`) — Geofenced punch-in zones for the COMPVSS field app. **CRUD/interactive:** DataTable; create (`createZoneAction`), archive (`archiveZone`), reactivate (`reactivateZone`).
- `/console/settings/catalog` (+ `/new`, `/[id]`, `/[id]/edit`) — Master catalog of reusable SKUs (credential/catering/radio/tool/equipment/uniform/travel/lodging/vehicle). **CRUD/interactive:** table + gallery view switcher; create (`createCatalogItem`), update (`updateCatalogItem`), toggle active (`toggleActive`), soft-delete (`deleteItem`).
- `/console/settings/sequences` — Auto-number sequences (invoice/PO/proposal/RFQ/etc. formats) with live preview + scope hints. **CRUD/interactive:** DataTable; upsert format (`upsertSequence`), reset counter (`resetSequence`).
- `/console/settings/sla-policies` — Service SLA policies per severity (P1–P4 response/resolution targets). **CRUD/interactive:** DataTable; upsert (`upsertSlaPolicy`), toggle (`toggleSlaPolicy`), delete (`deleteSlaPolicy`).
- `/console/settings/governance` — see above.
- `/console/settings/api` — API key management + endpoint reference docs. **CRUD/interactive:** create key (`createApiKeyAction`, via `CreateApiKeyForm`), revoke (`revokeApiKeyAction`); endpoint docs read-only.
- `/console/settings/webhooks` (+ `/new`, `/[webhookId]`) — Outgoing webhook endpoints with subscribable event list, delivery health. **CRUD/interactive:** list with status chips; new-endpoint form + per-endpoint detail (event subscription, delivery status).
- `/console/settings/rate-limits` — Per-bucket rate-limit overrides (ai/scan/webhook/auth). **CRUD/interactive:** DataTable; upsert (`upsertRateLimitOverride`), delete (`deleteRateLimitOverride`).
- `/console/settings/billing` — Subscription tiers (access/core/professional/enterprise), payment methods, invoices. **CRUD/interactive:** open Stripe customer portal (`OpenPortalButton`); tier cards read-only.
- `/console/settings/usage` — AI + API usage metrics (requests, tokens) over trailing 14 days, manager-gated. **CRUD/interactive:** read-only (MetricCards + sparklines).
- `/console/settings/imports` — Import Centre (crew roster, vendors, project tasks) + recent run history. **CRUD/interactive:** upload/import via `ImportForm`; run table read-only.
- `/console/settings/exports` — Export Centre; pull tables as CSV/JSON/XLSX/ZIP, poll in-flight runs, re-download completed. **CRUD/interactive:** create/poll/download exports via `ExportCenter` (client island).
- `/console/settings/compliance` — Workspace compliance settings (retention, encryption-at-rest, DPA, residency) + platform control summary. **CRUD/interactive:** settings form (`saveComplianceSettings`); platform-controls panel read-only.
- `/console/settings/audit` — Audit log viewer, cursor-paginated (100/page). **CRUD/interactive:** read-only viewer; export via `/api/v1/compliance/audit-export` download link.
- `/console/settings/integrations` — Connector catalog (Stripe/Slack/Google/ClickUp/etc.) with env-detected status. **CRUD/interactive:** install (`installConnector`), uninstall (`uninstallConnector`).
- `/console/settings/integrations/marketplace` — Discoverable integrations grid (known + coming-soon). **CRUD/interactive:** install state surfaced; connect buttons route to install flow.
- `/console/settings/integrations/accounting` — Accounting connection status (connected/expired/revoked) + last sync. **CRUD/interactive:** connect/manage buttons; status read-only.
- `/console/settings/integrations/ticketing` (+ `/new`, `/[connectionId]`) — External ticketing-provider sync connections. **CRUD/interactive:** create connection (`createTicketingConnectionAction`), deactivate (`deactivateTicketingConnectionAction`), record sales snapshot (`recordSalesSnapshotAction`).
- `/console/settings/integrations/submissions` (+ `/[id]`) — Partner integration submissions with certification-tier workflow (submitted→reviewing→verified→certified/rejected). **CRUD/interactive:** DataTable; transition tier (`transitionTier`).

## LEG3ND (legend)

- `/console/legend` — LEG3ND hub; tile grid for The Standard, Courses, Certifications, Resources, Catalog, Signage, Compliance Engine, Safety. **CRUD/interactive:** read-only index (tile navigation).
- `/console/legend/signage` (+ `/new`, `/[signId]`, `/[signId]/edit`, `/[signId]/placements/new`) — ISO 7010 / DOT-AIGA signage library + sign detail with placements. **CRUD/interactive:** create sign (`createSignAction`), update (`updateSignAction`), delete via DeleteForm (`deleteSign`), add placement (`createPlacementAction`); detail shows placements DataTable.
- `/console/legend/resources` (+ `/new`, `/[id]`, `/[id]/edit`) — Resources hub (links/files by kind, tags, state). **CRUD/interactive:** DataTable; create (`createResourceAction`), update (`updateResourceAction`), set state (`setResourceStateAction`), delete (`deleteResourceAction`).
- `/console/legend/resources/collections` (+ `/new`, `/[collectionId]`) — Resource collections grouping. **CRUD/interactive:** DataTable; create (`createCollectionAction`), update (`updateCollectionAction`), delete (`deleteCollectionAction`).
- `/console/legend/engine` — XMCE compliance-engine overview. **CRUD/interactive:** read-only landing (EmptyState/links into rules + runs).
- `/console/legend/engine/rules` (+ `/new`, `/[id]`, `/[id]/edit`) — Compliance rules (code/severity/category/state). **CRUD/interactive:** DataTable; create (`createRuleAction`), update (`updateRuleAction`), delete (`deleteRuleAction`).
- `/console/legend/engine/runs` (+ `/[id]`) — Compliance run history + per-run findings detail. **CRUD/interactive:** DataTable list; run the engine (`runEngineAction`), set finding state (`setFindingStateAction`) on detail.

## Legal

- `/console/legal` — Legal hub; section cards (IP, Privacy, DSAR, Consent, Data Map, Insurance). **CRUD/interactive:** read-only index.
- `/console/legal/ip` (+ `/new`, `/[markId]`, `/[markId]/edit`) — Trademark register. **CRUD/interactive:** DataTable; create (`createTrademark`), update (`updateTrademark`), delete (`deleteTrademark`).
- `/console/legal/insurance` (+ `/new`, `/[policyId]`, `/[policyId]/edit`) — Insurance policy register. **CRUD/interactive:** DataTable; create (`createPolicy`), update (`updatePolicy`), delete (`deletePolicy`).
- `/console/legal/privacy` — Privacy section landing. **CRUD/interactive:** read-only (links into datamap/consent/dsar).
- `/console/legal/privacy/datamap` — Data-processing register; live row counts per org table. **CRUD/interactive:** read-only.
- `/console/legal/privacy/consent` — Consent records (purpose, etc.). **CRUD/interactive:** read-only DataTable.
- `/console/legal/privacy/dsar` (+ `/new`, `/[requestId]`, `/[requestId]/edit`) — Data-subject access requests. **CRUD/interactive:** DataTable; create (`createDsar`), update (`updateDsarRequest`), delete (`deleteDsarRequest`).

## XPMS

- `/console/xpms` — XPMS hub (atomic production catalog overview). **CRUD/interactive:** read-only index.
- `/console/xpms/atoms` — Atom catalog (atomic production-system records). **CRUD/interactive:** read-only DataTable.
- `/console/xpms/variance` — Variance ledger (planned vs. actual delta + reason codes). **CRUD/interactive:** read-only DataTable.
- `/console/xpms/classes` (+ `/[code]`) — XTC Protocol classes; class detail. **CRUD/interactive:** read-only (card grid + detail).
- `/console/xpms/tiers` — Six Tiers of Experience composition + atom-share charts. **CRUD/interactive:** read-only (reference + charts).
- `/console/xpms/provenance` — Provenance graph (atom relationship edges). **CRUD/interactive:** read-only DataTable.
- `/console/xpms/phases` — Eight Production Phases (8PP) temporal-spine reference. **CRUD/interactive:** read-only (card grid).
- `/console/xpms/codebook` — XTC Protocol codebook (line codes). **CRUD/interactive:** read-only DataTable.

## Collaborate

- `/console/collaborate/sheets` (+ `/new`, `/[id]`) — Collaborative spreadsheets (columns + rows). **CRUD/interactive:** DataTable list + `SheetGrid` editor; create (`createSheetAction`), save grid (`saveSheetAction`), set state (`setSheetStateAction`), delete (`deleteSheetAction`).
- `/console/collaborate/docs` (+ `/new`, `/[id]`) — Collaborative rich-text documents. **CRUD/interactive:** DataTable list + `DocEditorIsland` editor; create (`createDoc`), save (`saveDoc`), delete (`deleteDoc`).
- `/console/collaborate/whiteboards` (+ `/new`, `/[id]`) — tldraw whiteboard canvases (plots, seating, signal flow, run-of-show). **CRUD/interactive:** DataTable list + `WhiteboardCanvas` editor; create (`createWhiteboardAction`), save snapshot (`saveWhiteboardSnapshotAction`), set state (`setWhiteboardStateAction`), delete (`deleteWhiteboardAction`).

## AI

- `/console/ai` — AI hub; section cards (Automations, RAG Corpus, Field Agents). **CRUD/interactive:** read-only index.
- `/console/ai/corpus` — RAG corpus index health (docs/chunks by source type). **CRUD/interactive:** reindex deliverables/submittals/RFIs on demand (`reindexCorpus`, via `ReindexButton`).
- `/console/ai/agents` (+ `/new`, `/[agentId]`) — Field agents roster. **CRUD/interactive:** create (`createAgentAction`), toggle (`toggleAgentAction`), delete via DeleteForm (`deleteAgentAction`).
- `/console/ai/automations` (+ `/new`, `/[automationId]`, `/[automationId]/runs`, `/[automationId]/runs/[runId]`) — Automation rules (domain-event/scheduled/webhook triggers) + run history. **CRUD/interactive:** create (`createAutomationAction`); on detail: save steps (`saveStepsAction`), save trigger (`saveTriggerAction`), generate webhook secret (`generateWebhookSecretAction`), toggle (`toggleAutomationAction`), record manual run (`recordManualRunAction`); runs list + run detail read-only.

## Assistant

- `/console/assistant` (+ `/[conversationId]`) — AI assistant conversation list + threaded chat. **CRUD/interactive:** conversation DataTable; live chat via `ChatComposer` (streams to AI chat API), project-scoped.

## Knowledge

- `/console/knowledge` (+ `/new`, `/[slug]`, `/[slug]/edit`) — Knowledge base articles with body preview. **CRUD/interactive:** list; create (`createKnowledgeArticleAction`, via FormShell), update (`updateKnowledgeArticle`), delete (`deleteKnowledgeArticle`); article view read-only.

## Dashboards

- `/console/dashboards` (+ `/[id]`, `/[id]/edit`) — Custom dashboards (KPI / Markdown / Chart / Saved-View widgets). **CRUD/interactive:** create (`createDashboardAction`); editor: save layout (`saveLayoutAction`), add widget (`addWidgetAction`), remove widget (`removeWidgetAction`), update meta (`updateMetaAction`); view route renders resolved widget data (read-only).

## Documents

- `/console/documents` — Documents hub; the 27 v6 templates grouped by owning app, rendered via the shared DocEngine (token-driven, print-ready, `data-path` merge contract). **CRUD/interactive:** read-only index (template navigation).
- `/console/documents/[docType]` — Per-document preview/print route; renders a template, optionally binding a live org-scoped record via `?recordId=<uuid>` (`resolveDocData` / `supportsRecordBinding`); brand-aware (`resolveDocBrand`); print/PDF via `@media print`. **CRUD/interactive:** preview + browser print/PDF; record-binding via query param (no inline writes).

## Insights

- `/console/insights` — Booking Pool; anonymized monthly aggregates by genre. **CRUD/interactive:** read-only DataTable.

## Inbox

- `/console/inbox` — ATLVS-side messages; the operator counterpart to `/m/inbox` over the same `chat_rooms` surface (RLS-scoped to the caller's rooms). **CRUD/interactive:** read-only room list (links into threads); messaging happens in the linked thread surfaces.

## Trash

- `/console/trash` — Soft-delete recycle bin across trash-eligible tables; manager+-gated. **CRUD/interactive:** type switcher + `TrashTable`; restore deleted records (manager+, server-gated).

## Compliance

- `/console/compliance/coc` — Chain of Custody; audit-log-derived custody events + MetricCards. **CRUD/interactive:** read-only; links to the COMPVSS `/coc` field surface.

## Envelopes

- `/console/envelopes` — E-Sign envelopes across providers (DocuSign/Adobe Sign/HelloSign/PandaDoc/manual) targeting proposals/offer letters/MSAs/contracts, with signer-count rollups + envelope state. **CRUD/interactive:** DataTable + MetricCards; read-only list (signing/sending handled by provider/target flows).
