# SITEMAP — single source of truth

> **GENERATED FILE — do not hand-edit.** Regenerate with
> `node scripts/generate-sitemap.mjs`. Derived from the filesystem
> (`src/app/**/page.tsx`) reconciled against the curated nav IA
> (`src/lib/nav.ts`). Supersedes `docs/ia/02-route-inventory.md` and the
> stale `docs/ia/inventory/sitemap-workflow-inventory.*` snapshots.
>
> Reconciliation strategy + backlog: `docs/ia/SITEMAP_RECONCILIATION.md`.

**Generated:** 2026-06-17 · **Page routes:** 1083 · **API route handlers:** 124 · **Distinct nav hrefs:** 450

## Legend

| Mark | Status | Meaning |
|------|--------|---------|
| ● | `nav` | Exact path is a nav href — directly clickable from a rail/tab/header/footer. |
| ○ | `linked` | Module is in nav; route reached via in-page link or CRUD child (`/new`, `/[id]`, deep sub-modules, dynamic SEO children, or `/m/[role]` re-export). |
| ⚠ | `orphan` | **Nothing** in this module appears anywhere in `nav.ts` — invisible to navigation. |
| · | `exempt` | Intentionally not in nav — redirect / token / locale / contextual entry (see "Exempt routes" below). |

**Every shell is now reconciled against `nav.ts`** — the rails (platform/mobile/portal), the marketing header + footer (`marketingHeaderGroups` / `marketingFooterGroups`), and the `/me` tabs (`personalNavGroups`) all source their links from `nav.ts`, and the components render that data. There is no longer an unmeasured self-navigating shell.

## Reconciliation scorecard

| Shell | Nav source | Routes | ● nav | ○ linked | ⚠ orphan | · exempt |
|-------|------------|-------:|------:|---------:|---------:|---------:|
| ATLVS — Operator Console | platformNav rail | 732 | 188 | 544 | 0 | 0 |
| COMPVSS — Field PWA | mobileTabs / mobileSurfaces / ROLE_TABS | 75 | 44 | 31 | 0 | 0 |
| GVTEWAY — External Portal | portalNav rail | 140 | 120 | 18 | 0 | 2 |
| GVTEWAY — Public / Marketing | marketingHeaderGroups + marketingFooterGroups | 86 | 31 | 47 | 0 | 8 |
| Personal (/me) | personalNavGroups (tabs) | 25 | 19 | 6 | 0 | 0 |
| Auth | marketing header auth links + token flows | 13 | 2 | 0 | 0 | 11 |
| **TOTAL** | | **1083** | **404** | **646** | **0** | **33** |

## ⚠️ Orphan modules (0) — features with zero nav entry

These trees exist on disk and are routable, but nothing in `nav.ts` links to them. They are the primary reconciliation target.

| Shell | Module | Orphaned routes |
|-------|--------|----------------:|

## 🔗 Dangling nav hrefs (0) — links with no page on disk

_None — every nav href resolves to a page._

## 🪫 Unresolved priority refs (0) — COMPVSS

_None — every role/phase priority href is a registered `mobileSurfaces` entry._

## · Exempt routes (33) — intentional non-nav, with reasons

Reached by redirect, emailed/shared token link, locale routing, or contextual entry — never a nav click. Defined in `EXEMPT` in the generator.

| Match | Type | Reason |
|-------|------|--------|
| `/p/[slug]` | exact | Portal gateway — persona picker / redirect to the viewer's persona home. |
| `/p/select` | exact | Org/slug picker — reached when a portal user has no resolved slug. |
| `/` | exact | Home — reached via the logo, not a nav entry. |
| `/es-ES` | prefix | i18n locale root. |
| `/pt-BR` | prefix | i18n locale root. |
| `/api-docs` | prefix | API reference microsite. |
| `/brand-kit` | prefix | Brand-kit microsite. |
| `/demo` | prefix | Demo-booking flow. |
| `/forms` | prefix | Embedded campaign/SEO form pages. |
| `/offer` | prefix | Token-gated offer flow. |
| `/proposals` | prefix | Token-gated proposal flow. |
| `/msa` | prefix | Token-gated MSA flow. |
| `/share` | prefix | Token-gated share link. |
| `/accept-invite` | prefix | Token-gated invite acceptance. |
| `/auth` | prefix | Auth resolver / redirect. |
| `/forgot-password` | prefix | Auth recovery flow. |
| `/reset-password` | prefix | Auth recovery flow. |
| `/magic-link` | prefix | Auth passwordless flow. |
| `/mfa` | prefix | Auth MFA challenge. |
| `/sso` | prefix | Auth SSO entry. |
| `/verify-email` | prefix | Auth email verification. |
| `/onboarding` | prefix | Post-signup org onboarding flow. |

---

# Full inventory by app

## ATLVS — Operator Console (`/console`)

732 routes — ● 188 nav · ○ 544 linked · ⚠ 0 orphan

<details><summary><code>accommodation</code> · 6 routes</summary>

● `/console/accommodation`
○ `/console/accommodation/blocks`
○ `/console/accommodation/blocks/[blockId]`
○ `/console/accommodation/blocks/[blockId]/edit`
○ `/console/accommodation/blocks/new`
○ `/console/accommodation/village`

</details>

<details><summary><code>accreditation</code> · 17 routes</summary>

● `/console/accreditation`
○ `/console/accreditation/categories`
○ `/console/accreditation/categories/[categoryId]`
○ `/console/accreditation/categories/[categoryId]/edit`
○ `/console/accreditation/categories/new`
○ `/console/accreditation/changes`
○ `/console/accreditation/changes/[changeId]`
○ `/console/accreditation/changes/[changeId]/edit`
○ `/console/accreditation/changes/new`
○ `/console/accreditation/policy`
○ `/console/accreditation/print`
○ `/console/accreditation/print/sheet`
○ `/console/accreditation/scans`
○ `/console/accreditation/vetting`
○ `/console/accreditation/vetting/[applicationId]`
○ `/console/accreditation/vetting/[applicationId]/edit`
○ `/console/accreditation/zones`

</details>

<details><summary><code>action-items</code> · 1 route</summary>

● `/console/action-items`

</details>

<details><summary><code>agency</code> · 7 routes</summary>

○ `/console/agency`
○ `/console/agency/commissions`
○ `/console/agency/roster`
○ `/console/agency/roster/[agencyArtistId]`
● `/console/agency/tours`
○ `/console/agency/tours/[tourId]`
○ `/console/agency/tours/new`

</details>

<details><summary><code>ai</code> · 10 routes</summary>

○ `/console/ai`
● `/console/ai/agents`
○ `/console/ai/agents/[agentId]`
○ `/console/ai/agents/new`
● `/console/ai/automations`
○ `/console/ai/automations/[automationId]`
○ `/console/ai/automations/[automationId]/runs`
○ `/console/ai/automations/[automationId]/runs/[runId]`
○ `/console/ai/automations/new`
● `/console/ai/corpus`

</details>

<details><summary><code>annotations</code> · 2 routes</summary>

● `/console/annotations`
○ `/console/annotations/[id]`

</details>

<details><summary><code>assistant</code> · 2 routes</summary>

● `/console/assistant`
○ `/console/assistant/[conversationId]`

</details>

<details><summary><code>bim</code> · 5 routes</summary>

● `/console/bim`
○ `/console/bim/[id]`
○ `/console/bim/[id]/edit`
○ `/console/bim/[id]/view`
○ `/console/bim/new`

</details>

<details><summary><code>bookings</code> · 9 routes</summary>

● `/console/bookings`
○ `/console/bookings/calendar`
○ `/console/bookings/deals`
○ `/console/bookings/deals/[offerId]`
○ `/console/bookings/deals/[offerId]/settlement`
○ `/console/bookings/holds`
○ `/console/bookings/holds/new`
○ `/console/bookings/settlements`
○ `/console/bookings/settlements/[id]`

</details>

<details><summary><code>campaigns</code> · 2 routes</summary>

● `/console/campaigns`
○ `/console/campaigns/new`

</details>

<details><summary><code>captures</code> · 2 routes</summary>

● `/console/captures`
○ `/console/captures/new`

</details>

<details><summary><code>clients</code> · 8 routes</summary>

● `/console/clients`
○ `/console/clients/[clientId]`
○ `/console/clients/[clientId]/branding`
○ `/console/clients/[clientId]/edit`
○ `/console/clients/[clientId]/invoices`
○ `/console/clients/[clientId]/projects`
○ `/console/clients/[clientId]/proposals`
○ `/console/clients/new`

</details>

<details><summary><code>collaborate</code> · 9 routes</summary>

● `/console/collaborate/docs`
○ `/console/collaborate/docs/[id]`
○ `/console/collaborate/docs/new`
● `/console/collaborate/sheets`
○ `/console/collaborate/sheets/[id]`
○ `/console/collaborate/sheets/new`
● `/console/collaborate/whiteboards`
○ `/console/collaborate/whiteboards/[id]`
○ `/console/collaborate/whiteboards/new`

</details>

<details><summary><code>commercial</code> · 9 routes</summary>

○ `/console/commercial`
● `/console/commercial/hospitality`
○ `/console/commercial/hospitality/[packageId]`
○ `/console/commercial/hospitality/[packageId]/edit`
○ `/console/commercial/licensing`
● `/console/commercial/sponsors`
○ `/console/commercial/sponsors/[sponsorId]`
○ `/console/commercial/sponsors/[sponsorId]/edit`
○ `/console/commercial/sponsors/new`

</details>

<details><summary><code>comms</code> · 10 routes</summary>

● `/console/comms/announcements`
○ `/console/comms/announcements/[id]`
○ `/console/comms/announcements/[id]/edit`
○ `/console/comms/announcements/new`
● `/console/comms/polls`
○ `/console/comms/polls/[id]`
○ `/console/comms/polls/new`
● `/console/comms/surveys`
○ `/console/comms/surveys/[id]`
○ `/console/comms/surveys/new`

</details>

<details><summary><code>compliance</code> · 1 route</summary>

● `/console/compliance/coc`

</details>

<details><summary><code>contracts</code> · 4 routes</summary>

● `/console/contracts`
○ `/console/contracts/[contractId]`
○ `/console/contracts/[contractId]/edit`
○ `/console/contracts/new`

</details>

<details><summary><code>dashboards</code> · 3 routes</summary>

● `/console/dashboards`
○ `/console/dashboards/[id]`
○ `/console/dashboards/[id]/edit`

</details>

<details><summary><code>documents</code> · 2 routes</summary>

● `/console/documents`
○ `/console/documents/[docType]`

</details>

<details><summary><code>drawings</code> · 4 routes</summary>

● `/console/drawings`
○ `/console/drawings/[id]`
○ `/console/drawings/[id]/edit`
○ `/console/drawings/new`

</details>

<details><summary><code>email-inbox</code> · 2 routes</summary>

● `/console/email-inbox`
○ `/console/email-inbox/[id]`

</details>

<details><summary><code>envelopes</code> · 3 routes</summary>

● `/console/envelopes`
○ `/console/envelopes/[id]`
○ `/console/envelopes/new`

</details>

<details><summary><code>estimates</code> · 4 routes</summary>

● `/console/estimates`
○ `/console/estimates/[id]`
○ `/console/estimates/[id]/edit`
○ `/console/estimates/new`

</details>

<details><summary><code>events</code> · 4 routes</summary>

● `/console/events`
○ `/console/events/[eventId]`
○ `/console/events/[eventId]/edit`
○ `/console/events/new`

</details>

<details><summary><code>finance</code> · 54 routes</summary>

○ `/console/finance`
● `/console/finance/ap-ocr`
○ `/console/finance/ap-ocr/[id]`
● `/console/finance/budgets`
○ `/console/finance/budgets/[budgetId]`
○ `/console/finance/budgets/[budgetId]/edit`
○ `/console/finance/budgets/import`
○ `/console/finance/budgets/new`
○ `/console/finance/budgets/summary`
○ `/console/finance/consolidation`
○ `/console/finance/cost-codes`
○ `/console/finance/cost-codes/new`
○ `/console/finance/entities`
○ `/console/finance/entities/[id]`
○ `/console/finance/entities/new`
● `/console/finance/expenses`
○ `/console/finance/expenses/[expenseId]`
○ `/console/finance/expenses/[expenseId]/edit`
○ `/console/finance/expenses/new`
● `/console/finance/forecasts`
○ `/console/finance/forecasts/new`
● `/console/finance/invoices`
○ `/console/finance/invoices/[invoiceId]`
○ `/console/finance/invoices/[invoiceId]/activity`
○ `/console/finance/invoices/[invoiceId]/edit`
○ `/console/finance/invoices/[invoiceId]/line-items`
○ `/console/finance/invoices/new`
● `/console/finance/lien-waivers`
○ `/console/finance/lien-waivers/[id]`
○ `/console/finance/lien-waivers/new`
○ `/console/finance/mileage`
○ `/console/finance/mileage/[mileageId]`
○ `/console/finance/mileage/[mileageId]/edit`
○ `/console/finance/mileage/new`
● `/console/finance/pay-apps`
○ `/console/finance/pay-apps/[id]`
○ `/console/finance/pay-apps/new`
● `/console/finance/payouts`
● `/console/finance/payroll`
○ `/console/finance/payroll/new`
● `/console/finance/periods`
○ `/console/finance/periods/[periodId]`
○ `/console/finance/periods/[periodId]/transitions`
○ `/console/finance/periods/new`
● `/console/finance/reports`
● `/console/finance/time`
○ `/console/finance/time/[entryId]`
○ `/console/finance/time/[entryId]/edit`
○ `/console/finance/time/new`
● `/console/finance/timesheets`
○ `/console/finance/timesheets/[id]`
○ `/console/finance/treasury`
● `/console/finance/wip`
○ `/console/finance/wip/new`

</details>

<details><summary><code>forms</code> · 6 routes</summary>

● `/console/forms`
○ `/console/forms/[formId]`
○ `/console/forms/[formId]/edit`
○ `/console/forms/[formId]/submissions`
○ `/console/forms/[formId]/submissions/[submissionId]`
○ `/console/forms/new`

</details>

<details><summary><code>goals</code> · 4 routes</summary>

● `/console/goals`
○ `/console/goals/[id]`
○ `/console/goals/[id]/edit`
○ `/console/goals/new`

</details>

<details><summary><code>guides</code> · 1 route</summary>

● `/console/guides`

</details>

<details><summary><code>import</code> · 1 route</summary>

● `/console/import`

</details>

<details><summary><code>inbox</code> · 1 route</summary>

● `/console/inbox`

</details>

<details><summary><code>insights</code> · 1 route</summary>

● `/console/insights`

</details>

<details><summary><code>inspections</code> · 6 routes</summary>

● `/console/inspections`
○ `/console/inspections/[id]`
○ `/console/inspections/[id]/edit`
○ `/console/inspections/new`
○ `/console/inspections/templates`
○ `/console/inspections/templates/new`

</details>

<details><summary><code>knowledge</code> · 4 routes</summary>

● `/console/knowledge`
○ `/console/knowledge/[slug]`
○ `/console/knowledge/[slug]/edit`
○ `/console/knowledge/new`

</details>

<details><summary><code>leads</code> · 6 routes</summary>

● `/console/leads`
○ `/console/leads/[leadId]`
○ `/console/leads/[leadId]/activity`
○ `/console/leads/[leadId]/edit`
○ `/console/leads/[leadId]/proposals`
○ `/console/leads/new`

</details>

<details><summary><code>legal</code> · 16 routes</summary>

○ `/console/legal`
● `/console/legal/insurance`
○ `/console/legal/insurance/[policyId]`
○ `/console/legal/insurance/[policyId]/edit`
○ `/console/legal/insurance/new`
● `/console/legal/ip`
○ `/console/legal/ip/[markId]`
○ `/console/legal/ip/[markId]/edit`
○ `/console/legal/ip/new`
● `/console/legal/privacy`
● `/console/legal/privacy/consent`
● `/console/legal/privacy/datamap`
● `/console/legal/privacy/dsar`
○ `/console/legal/privacy/dsar/[requestId]`
○ `/console/legal/privacy/dsar/[requestId]/edit`
○ `/console/legal/privacy/dsar/new`

</details>

<details><summary><code>legend</code> · 20 routes</summary>

○ `/console/legend`
● `/console/legend/engine`
○ `/console/legend/engine/rules`
○ `/console/legend/engine/rules/[id]`
○ `/console/legend/engine/rules/[id]/edit`
○ `/console/legend/engine/rules/new`
○ `/console/legend/engine/runs`
○ `/console/legend/engine/runs/[id]`
● `/console/legend/resources`
○ `/console/legend/resources/[id]`
○ `/console/legend/resources/[id]/edit`
○ `/console/legend/resources/collections`
○ `/console/legend/resources/collections/[collectionId]`
○ `/console/legend/resources/collections/new`
○ `/console/legend/resources/new`
● `/console/legend/signage`
○ `/console/legend/signage/[signId]`
○ `/console/legend/signage/[signId]/edit`
○ `/console/legend/signage/[signId]/placements/new`
○ `/console/legend/signage/new`

</details>

<details><summary><code>locations</code> · 5 routes</summary>

● `/console/locations`
○ `/console/locations/[locationId]`
○ `/console/locations/[locationId]/edit`
○ `/console/locations/new`
○ `/console/locations/picker`

</details>

<details><summary><code>logistics</code> · 11 routes</summary>

○ `/console/logistics`
● `/console/logistics/disposition`
● `/console/logistics/freight`
○ `/console/logistics/freight/[shipmentId]`
○ `/console/logistics/freight/[shipmentId]/edit`
● `/console/logistics/ratecard`
○ `/console/logistics/ratecard/[itemId]`
○ `/console/logistics/ratecard/[itemId]/edit`
○ `/console/logistics/ratecard/new`
● `/console/logistics/services`
● `/console/logistics/warehouse`

</details>

<details><summary><code>marketing</code> · 3 routes</summary>

● `/console/marketing`
○ `/console/marketing/calendar`
○ `/console/marketing/onsales`

</details>

<details><summary><code>marketplace</code> · 35 routes</summary>

● `/console/marketplace`
● `/console/marketplace/box-office`
○ `/console/marketplace/box-office/[listId]`
○ `/console/marketplace/box-office/new`
○ `/console/marketplace/calls`
○ `/console/marketplace/calls/[callId]`
○ `/console/marketplace/calls/[callId]/edit`
○ `/console/marketplace/calls/[callId]/submissions`
○ `/console/marketplace/calls/[callId]/submissions/[submissionId]`
○ `/console/marketplace/calls/new`
● `/console/marketplace/discounts`
○ `/console/marketplace/discounts/[discountId]`
○ `/console/marketplace/discounts/new`
○ `/console/marketplace/discounts/promoters`
○ `/console/marketplace/discounts/promoters/[promoterId]`
○ `/console/marketplace/discounts/promoters/new`
● `/console/marketplace/inquiries`
● `/console/marketplace/offers`
○ `/console/marketplace/offers/[offerId]`
○ `/console/marketplace/offers/new`
○ `/console/marketplace/postings`
○ `/console/marketplace/postings/[postingId]`
○ `/console/marketplace/postings/[postingId]/applicants`
○ `/console/marketplace/postings/[postingId]/applicants/[applicationId]`
○ `/console/marketplace/postings/[postingId]/edit`
○ `/console/marketplace/postings/new`
● `/console/marketplace/reviews`
● `/console/marketplace/settings`
● `/console/marketplace/talent`
○ `/console/marketplace/talent/[talentId]`
○ `/console/marketplace/talent/[talentId]/edit`
○ `/console/marketplace/talent/[talentId]/riders`
○ `/console/marketplace/talent/[talentId]/riders/[riderId]`
○ `/console/marketplace/talent/[talentId]/riders/new`
○ `/console/marketplace/talent/new`

</details>

<details><summary><code>meetings</code> · 8 routes</summary>

● `/console/meetings`
○ `/console/meetings/[meetingId]`
○ `/console/meetings/[meetingId]/edit`
○ `/console/meetings/[meetingId]/huddle`
○ `/console/meetings/new`
● `/console/meetings/notes`
○ `/console/meetings/notes/[id]`
○ `/console/meetings/notes/new`

</details>

<details><summary><code>operations</code> · 17 routes</summary>

● `/console/operations`
● `/console/operations/daily-log`
○ `/console/operations/daily-log/[id]`
○ `/console/operations/daily-log/new`
○ `/console/operations/dispatch`
○ `/console/operations/incidents`
○ `/console/operations/incidents/[incidentId]`
○ `/console/operations/incidents/[incidentId]/edit`
○ `/console/operations/incidents/new`
● `/console/operations/look-ahead`
○ `/console/operations/maintenance`
○ `/console/operations/maintenance/[jobId]`
○ `/console/operations/maintenance/schedules/new`
● `/console/operations/reservations`
○ `/console/operations/reservations/[id]`
○ `/console/operations/reservations/new`
○ `/console/operations/reservations/tables/new`

</details>

<details><summary><code>ops</code> · 6 routes</summary>

○ `/console/ops`
● `/console/ops/toc`
○ `/console/ops/toc/changes`
○ `/console/ops/toc/changes/new`
○ `/console/ops/toc/problems`
○ `/console/ops/toc/problems/new`

</details>

<details><summary><code>participants</code> · 13 routes</summary>

○ `/console/participants`
● `/console/participants/delegations`
○ `/console/participants/delegations/[delegationId]`
○ `/console/participants/delegations/[delegationId]/edit`
○ `/console/participants/delegations/new`
○ `/console/participants/entries`
○ `/console/participants/entries/[entryId]`
○ `/console/participants/entries/[entryId]/edit`
○ `/console/participants/entries/new`
● `/console/participants/visa`
○ `/console/participants/visa/[caseId]`
○ `/console/participants/visa/[caseId]/edit`
○ `/console/participants/visa/new`

</details>

<details><summary><code>people</code> · 26 routes</summary>

● `/console/people`
○ `/console/people/[personId]`
○ `/console/people/[personId]/assignments`
○ `/console/people/[personId]/credentials`
○ `/console/people/[personId]/documents`
○ `/console/people/[personId]/edit`
○ `/console/people/[personId]/time`
○ `/console/people/credentials`
○ `/console/people/credentials/[credentialId]`
○ `/console/people/credentials/[credentialId]/edit`
○ `/console/people/credentials/asset-linker`
○ `/console/people/credentials/new`
○ `/console/people/crew`
○ `/console/people/crew/[crewId]`
○ `/console/people/crew/[crewId]/edit`
○ `/console/people/crew/new`
● `/console/people/invites`
● `/console/people/msas`
○ `/console/people/msas/[id]`
○ `/console/people/msas/new`
● `/console/people/offer-letters`
○ `/console/people/offer-letters/[id]`
○ `/console/people/offer-letters/[id]/onboarding`
● `/console/people/roles`
● `/console/people/teams`
○ `/console/people/teams/[teamId]`

</details>

<details><summary><code>photos</code> · 2 routes</summary>

● `/console/photos`
○ `/console/photos/upload`

</details>

<details><summary><code>pipeline</code> · 2 routes</summary>

● `/console/pipeline`
○ `/console/pipeline/[dealId]`

</details>

<details><summary><code>procurement</code> · 42 routes</summary>

○ `/console/procurement`
○ `/console/procurement/catalog`
● `/console/procurement/itb`
○ `/console/procurement/po-change-orders`
○ `/console/procurement/po-change-orders/[id]`
○ `/console/procurement/po-change-orders/new`
● `/console/procurement/prequalification`
○ `/console/procurement/prequalification/new`
○ `/console/procurement/prequalification/questionnaires`
○ `/console/procurement/prequalification/questionnaires/new`
● `/console/procurement/purchase-orders`
○ `/console/procurement/purchase-orders/[poId]`
○ `/console/procurement/purchase-orders/[poId]/checklist`
○ `/console/procurement/purchase-orders/[poId]/edit`
○ `/console/procurement/purchase-orders/new`
● `/console/procurement/requisitions`
○ `/console/procurement/requisitions/[reqId]`
○ `/console/procurement/requisitions/[reqId]/edit`
○ `/console/procurement/requisitions/[reqId]/leveling`
○ `/console/procurement/requisitions/[reqId]/leveling/new`
○ `/console/procurement/requisitions/new`
● `/console/procurement/rfqs`
○ `/console/procurement/rfqs/[rfqId]`
○ `/console/procurement/rfqs/[rfqId]/publish`
○ `/console/procurement/rfqs/[rfqId]/responses`
○ `/console/procurement/rfqs/[rfqId]/responses/[responseId]`
○ `/console/procurement/rfqs/new`
○ `/console/procurement/scorecards`
● `/console/procurement/sourcing`
● `/console/procurement/vendors`
○ `/console/procurement/vendors/[vendorId]`
○ `/console/procurement/vendors/[vendorId]/edit`
○ `/console/procurement/vendors/[vendorId]/onboarding`
○ `/console/procurement/vendors/[vendorId]/pos`
○ `/console/procurement/vendors/[vendorId]/prequalification`
○ `/console/procurement/vendors/[vendorId]/prequalification/[prequalId]`
○ `/console/procurement/vendors/[vendorId]/scorecard`
○ `/console/procurement/vendors/[vendorId]/submittals`
○ `/console/procurement/vendors/new`
○ `/console/procurement/wo-broadcasts`
○ `/console/procurement/wo-broadcasts/[broadcastId]`
○ `/console/procurement/wo-broadcasts/new`

</details>

<details><summary><code>production</code> · 28 routes</summary>

○ `/console/production`
● `/console/production/av`
● `/console/production/compounds`
○ `/console/production/dispatch`
○ `/console/production/dispatch/[dispatchId]`
● `/console/production/dispatch/live`
● `/console/production/equipment`
○ `/console/production/equipment/[equipmentId]`
○ `/console/production/equipment/[equipmentId]/edit`
○ `/console/production/equipment/[equipmentId]/maintenance`
○ `/console/production/equipment/[equipmentId]/qr`
○ `/console/production/equipment/[equipmentId]/rentals`
○ `/console/production/equipment/new`
● `/console/production/equipment/utilization`
● `/console/production/fabrication`
○ `/console/production/fabrication/[orderId]`
○ `/console/production/fabrication/[orderId]/edit`
○ `/console/production/fabrication/new`
● `/console/production/logistics`
● `/console/production/rentals`
○ `/console/production/rentals/[rentalId]`
○ `/console/production/rentals/[rentalId]/edit`
○ `/console/production/rentals/availability`
○ `/console/production/rentals/new`
● `/console/production/ros`
● `/console/production/warehouse`
○ `/console/production/warehouse/inventory`
○ `/console/production/warehouse/locations`

</details>

<details><summary><code>programs</code> · 22 routes</summary>

● `/console/programs`
○ `/console/programs/cases`
○ `/console/programs/ceremonies`
○ `/console/programs/ceremonies/[ceremonyId]`
○ `/console/programs/ceremonies/[ceremonyId]/edit`
○ `/console/programs/pressconf`
○ `/console/programs/protocol`
● `/console/programs/readiness`
○ `/console/programs/readiness/[exerciseId]`
○ `/console/programs/readiness/[exerciseId]/edit`
○ `/console/programs/readiness/new`
● `/console/programs/reviews`
○ `/console/programs/reviews/[reviewId]`
○ `/console/programs/reviews/[reviewId]/edit`
○ `/console/programs/reviews/new`
● `/console/programs/risk`
○ `/console/programs/risk/[riskId]`
○ `/console/programs/risk/[riskId]/edit`
○ `/console/programs/risk/new`
○ `/console/programs/schedule`
○ `/console/programs/scope`
○ `/console/programs/sessions`

</details>

<details><summary><code>projects</code> · 32 routes</summary>

● `/console/projects`
○ `/console/projects/[projectId]`
○ `/console/projects/[projectId]/advancing`
○ `/console/projects/[projectId]/advancing/assignments`
○ `/console/projects/[projectId]/advancing/assignments/[assignmentId]`
○ `/console/projects/[projectId]/advancing/assignments/new`
○ `/console/projects/[projectId]/branding`
○ `/console/projects/[projectId]/budget`
○ `/console/projects/[projectId]/crew`
○ `/console/projects/[projectId]/edit`
○ `/console/projects/[projectId]/files`
○ `/console/projects/[projectId]/finance`
○ `/console/projects/[projectId]/finance/draws`
○ `/console/projects/[projectId]/guides`
○ `/console/projects/[projectId]/guides/[persona]`
○ `/console/projects/[projectId]/guides/[persona]/access`
○ `/console/projects/[projectId]/members`
○ `/console/projects/[projectId]/onboarding`
○ `/console/projects/[projectId]/overview`
○ `/console/projects/[projectId]/photos`
○ `/console/projects/[projectId]/portal-preview`
○ `/console/projects/[projectId]/roadmap`
○ `/console/projects/[projectId]/schedule`
○ `/console/projects/[projectId]/sprints`
○ `/console/projects/[projectId]/sprints/new`
○ `/console/projects/[projectId]/stage-plots`
○ `/console/projects/[projectId]/stage-plots/[stagePlotId]`
○ `/console/projects/[projectId]/stage-plots/[stagePlotId]/edit`
○ `/console/projects/[projectId]/sustainability`
○ `/console/projects/[projectId]/tasks`
○ `/console/projects/[projectId]/tracker`
○ `/console/projects/new`

</details>

<details><summary><code>proposals</code> · 6 routes</summary>

● `/console/proposals`
○ `/console/proposals/[proposalId]`
○ `/console/proposals/[proposalId]/edit`
○ `/console/proposals/new`
● `/console/proposals/templates`
○ `/console/proposals/templates/[templateId]`

</details>

<details><summary><code>punch</code> · 5 routes</summary>

● `/console/punch`
○ `/console/punch/[id]`
○ `/console/punch/[id]/edit`
○ `/console/punch/lists`
○ `/console/punch/new`

</details>

<details><summary><code>reports</code> · 2 routes</summary>

● `/console/reports`
○ `/console/reports/[reportId]`

</details>

<details><summary><code>rfis</code> · 4 routes</summary>

● `/console/rfis`
○ `/console/rfis/[id]`
○ `/console/rfis/[id]/edit`
○ `/console/rfis/new`

</details>

<details><summary><code>risk</code> · 1 route</summary>

● `/console/risk`

</details>

<details><summary><code>safety</code> · 38 routes</summary>

○ `/console/safety`
○ `/console/safety/bcdr`
● `/console/safety/briefings`
○ `/console/safety/briefings/[briefingId]`
○ `/console/safety/briefings/new`
● `/console/safety/crisis`
○ `/console/safety/crisis/[alertId]`
○ `/console/safety/crisis/[alertId]/edit`
○ `/console/safety/crisis/new`
○ `/console/safety/cyber-ir`
○ `/console/safety/environmental`
○ `/console/safety/environmental/[eventId]`
○ `/console/safety/environmental/[eventId]/edit`
○ `/console/safety/environmental/new`
○ `/console/safety/guard-tours`
○ `/console/safety/guard-tours/new`
● `/console/safety/incidents`
○ `/console/safety/incidents/[incidentId]`
○ `/console/safety/major-incident`
○ `/console/safety/major-incident/[eventId]`
○ `/console/safety/major-incident/[eventId]/edit`
○ `/console/safety/major-incident/new`
● `/console/safety/medical`
○ `/console/safety/medical/encounters`
○ `/console/safety/medical/encounters/[encounterId]`
○ `/console/safety/medical/encounters/[encounterId]/edit`
○ `/console/safety/medical/encounters/new`
○ `/console/safety/medical/plan`
● `/console/safety/osha`
● `/console/safety/playbooks`
○ `/console/safety/playbooks/[slug]`
○ `/console/safety/playbooks/new`
● `/console/safety/safeguarding`
○ `/console/safety/safeguarding/[reportId]`
○ `/console/safety/safeguarding/[reportId]/edit`
○ `/console/safety/safeguarding/new`
○ `/console/safety/threats`
○ `/console/safety/threats/new`

</details>

<details><summary><code>sales</code> · 10 routes</summary>

● `/console/sales`
● `/console/sales/beos`
○ `/console/sales/beos/[id]`
○ `/console/sales/beos/new`
● `/console/sales/diary`
○ `/console/sales/diary/[bookingId]`
○ `/console/sales/diary/[bookingId]/edit`
○ `/console/sales/diary/new`
○ `/console/sales/diary/spaces`
○ `/console/sales/diary/spaces/new`

</details>

<details><summary><code>schedule</code> · 5 routes</summary>

● `/console/schedule`
● `/console/schedule/baselines`
○ `/console/schedule/baselines/[id]`
○ `/console/schedule/baselines/[id]/gantt`
○ `/console/schedule/baselines/new`

</details>

<details><summary><code>services</code> · 4 routes</summary>

○ `/console/services`
● `/console/services/requests`
○ `/console/services/requests/[requestId]`
○ `/console/services/requests/new`

</details>

<details><summary><code>settings</code> · 41 routes</summary>

○ `/console/settings`
● `/console/settings/account-managers`
○ `/console/settings/account-managers/[id]`
○ `/console/settings/account-managers/new`
● `/console/settings/api`
● `/console/settings/audit`
● `/console/settings/billing`
● `/console/settings/branding`
● `/console/settings/catalog`
○ `/console/settings/catalog/[id]`
○ `/console/settings/catalog/[id]/edit`
○ `/console/settings/catalog/new`
● `/console/settings/compliance`
● `/console/settings/domains`
● `/console/settings/email-templates`
● `/console/settings/exports`
● `/console/settings/governance`
● `/console/settings/imports`
● `/console/settings/integrations`
○ `/console/settings/integrations/[integrationId]`
○ `/console/settings/integrations/accounting`
○ `/console/settings/integrations/accounting/[id]`
○ `/console/settings/integrations/accounting/new`
● `/console/settings/integrations/marketplace`
○ `/console/settings/integrations/submissions`
○ `/console/settings/integrations/submissions/[id]`
● `/console/settings/integrations/ticketing`
○ `/console/settings/integrations/ticketing/[connectionId]`
○ `/console/settings/integrations/ticketing/new`
● `/console/settings/organization`
○ `/console/settings/rate-limits`
○ `/console/settings/sequences`
○ `/console/settings/sla-policies`
○ `/console/settings/sso`
● `/console/settings/time-clock-zones`
○ `/console/settings/time-clock-zones/[id]`
○ `/console/settings/time-clock-zones/new`
● `/console/settings/usage`
● `/console/settings/webhooks`
○ `/console/settings/webhooks/[webhookId]`
○ `/console/settings/webhooks/new`

</details>

<details><summary><code>site-plans</code> · 5 routes</summary>

● `/console/site-plans`
○ `/console/site-plans/[id]`
○ `/console/site-plans/[id]/edit`
○ `/console/site-plans/[id]/markup`
○ `/console/site-plans/new`

</details>

<details><summary><code>specs</code> · 4 routes</summary>

● `/console/specs`
○ `/console/specs/[id]`
○ `/console/specs/[id]/edit`
○ `/console/specs/new`

</details>

<details><summary><code>submittals</code> · 4 routes</summary>

● `/console/submittals`
○ `/console/submittals/[id]`
○ `/console/submittals/[id]/edit`
○ `/console/submittals/new`

</details>

<details><summary><code>subscriptions</code> · 4 routes</summary>

● `/console/subscriptions`
○ `/console/subscriptions/[subscriptionId]`
○ `/console/subscriptions/[subscriptionId]/transitions`
○ `/console/subscriptions/new`

</details>

<details><summary><code>sustainability</code> · 5 routes</summary>

● `/console/sustainability`
○ `/console/sustainability/carbon`
○ `/console/sustainability/carbon/[metricId]`
○ `/console/sustainability/carbon/[metricId]/edit`
○ `/console/sustainability/carbon/new`

</details>

<details><summary><code>takeoffs</code> · 4 routes</summary>

● `/console/takeoffs`
○ `/console/takeoffs/[id]`
○ `/console/takeoffs/[id]/edit`
○ `/console/takeoffs/new`

</details>

<details><summary><code>tasks</code> · 4 routes</summary>

● `/console/tasks`
○ `/console/tasks/[taskId]`
○ `/console/tasks/[taskId]/edit`
○ `/console/tasks/new`

</details>

<details><summary><code>templates</code> · 2 routes</summary>

● `/console/templates`
○ `/console/templates/[templateId]/new`

</details>

<details><summary><code>transmittals</code> · 3 routes</summary>

● `/console/transmittals`
○ `/console/transmittals/[id]`
○ `/console/transmittals/new`

</details>

<details><summary><code>transport</code> · 11 routes</summary>

● `/console/transport`
○ `/console/transport/ad`
○ `/console/transport/ad/[manifestId]`
○ `/console/transport/ad/[manifestId]/edit`
○ `/console/transport/ad/new`
● `/console/transport/dispatch`
○ `/console/transport/dispatch/[runId]`
○ `/console/transport/dispatch/[runId]/edit`
○ `/console/transport/dispatch/new`
○ `/console/transport/fleets`
○ `/console/transport/workforce`

</details>

<details><summary><code>trash</code> · 1 route</summary>

● `/console/trash`

</details>

<details><summary><code>venues</code> · 13 routes</summary>

● `/console/venues`
○ `/console/venues/[venueId]`
○ `/console/venues/[venueId]/build`
○ `/console/venues/[venueId]/certifications`
○ `/console/venues/[venueId]/closeout`
○ `/console/venues/[venueId]/design`
○ `/console/venues/[venueId]/edit`
○ `/console/venues/[venueId]/handover`
○ `/console/venues/[venueId]/ros`
○ `/console/venues/[venueId]/vop`
○ `/console/venues/[venueId]/zones`
○ `/console/venues/new`
○ `/console/venues/training`

</details>

<details><summary><code>warranties</code> · 2 routes</summary>

● `/console/warranties`
○ `/console/warranties/new`

</details>

<details><summary><code>workforce</code> · 46 routes</summary>

● `/console/workforce`
● `/console/workforce/badges`
○ `/console/workforce/badges/[badgeId]`
○ `/console/workforce/badges/new`
○ `/console/workforce/call-sheets`
○ `/console/workforce/call-sheets/[memberId]`
○ `/console/workforce/contractors`
○ `/console/workforce/contractors/[contractorId]`
○ `/console/workforce/contractors/[contractorId]/edit`
○ `/console/workforce/contractors/new`
● `/console/workforce/courses`
○ `/console/workforce/courses/[courseId]`
○ `/console/workforce/courses/[courseId]/edit`
○ `/console/workforce/courses/new`
○ `/console/workforce/deployment`
○ `/console/workforce/deployment/[deploymentId]`
○ `/console/workforce/deployment/[deploymentId]/edit`
○ `/console/workforce/deployment/new`
● `/console/workforce/forecast`
○ `/console/workforce/forecast/[id]`
○ `/console/workforce/housing`
● `/console/workforce/onboarding`
○ `/console/workforce/onboarding/[flowId]`
○ `/console/workforce/onboarding/new`
○ `/console/workforce/planning`
● `/console/workforce/recognition`
○ `/console/workforce/recognition/new`
● `/console/workforce/rosters`
○ `/console/workforce/rosters/[rosterId]`
○ `/console/workforce/rosters/[rosterId]/edit`
○ `/console/workforce/rosters/new`
○ `/console/workforce/services`
● `/console/workforce/shift-swaps`
○ `/console/workforce/staff`
○ `/console/workforce/staff/[staffId]`
○ `/console/workforce/staff/[staffId]/edit`
○ `/console/workforce/staff/new`
● `/console/workforce/time-off`
● `/console/workforce/training`
○ `/console/workforce/training/[courseId]`
○ `/console/workforce/training/[courseId]/edit`
○ `/console/workforce/uniforms`
○ `/console/workforce/volunteers`
○ `/console/workforce/volunteers/[volunteerId]`
○ `/console/workforce/volunteers/[volunteerId]/edit`
○ `/console/workforce/volunteers/new`

</details>

<details><summary><code>xpms</code> · 9 routes</summary>

● `/console/xpms`
● `/console/xpms/atoms`
● `/console/xpms/classes`
○ `/console/xpms/classes/[code]`
● `/console/xpms/codebook`
● `/console/xpms/phases`
● `/console/xpms/provenance`
● `/console/xpms/tiers`
● `/console/xpms/variance`

</details>

<details><summary><code>·root</code> · 1 route</summary>

● `/console`

</details>

## COMPVSS — Field PWA (`/m`)

75 routes — ● 44 nav · ○ 31 linked · ⚠ 0 orphan

<details><summary><code>[role]</code> · 11 routes</summary>

○ `/m/[role]`
○ `/m/[role]/alerts`
○ `/m/[role]/directory`
○ `/m/[role]/docs`
○ `/m/[role]/feed`
○ `/m/[role]/inbox`
○ `/m/[role]/kudos`
○ `/m/[role]/learning`
○ `/m/[role]/settings`
○ `/m/[role]/shift`
○ `/m/[role]/time-off`

</details>

<details><summary><code>ad</code> · 1 route</summary>

● `/m/ad`

</details>

<details><summary><code>advances</code> · 1 route</summary>

● `/m/advances`

</details>

<details><summary><code>alerts</code> · 1 route</summary>

● `/m/alerts`

</details>

<details><summary><code>check-in</code> · 3 routes</summary>

● `/m/check-in`
○ `/m/check-in/manual`
○ `/m/check-in/scan/[slug]`

</details>

<details><summary><code>checkin</code> · 1 route</summary>

● `/m/checkin`

</details>

<details><summary><code>clock</code> · 1 route</summary>

● `/m/clock`

</details>

<details><summary><code>coc</code> · 1 route</summary>

● `/m/coc`

</details>

<details><summary><code>crew</code> · 2 routes</summary>

● `/m/crew`
○ `/m/crew/clock`

</details>

<details><summary><code>daily-log</code> · 1 route</summary>

● `/m/daily-log`

</details>

<details><summary><code>directory</code> · 1 route</summary>

● `/m/directory`

</details>

<details><summary><code>docs</code> · 2 routes</summary>

● `/m/docs`
○ `/m/docs/new`

</details>

<details><summary><code>driver</code> · 2 routes</summary>

● `/m/driver`
○ `/m/driver/run/[runId]`

</details>

<details><summary><code>feed</code> · 1 route</summary>

● `/m/feed`

</details>

<details><summary><code>gate</code> · 2 routes</summary>

● `/m/gate`
○ `/m/gate/scan`

</details>

<details><summary><code>gigs</code> · 1 route</summary>

● `/m/gigs`

</details>

<details><summary><code>guard</code> · 1 route</summary>

● `/m/guard`

</details>

<details><summary><code>guide</code> · 1 route</summary>

● `/m/guide`

</details>

<details><summary><code>handover</code> · 1 route</summary>

● `/m/handover`

</details>

<details><summary><code>inbox</code> · 2 routes</summary>

● `/m/inbox`
○ `/m/inbox/[roomId]`

</details>

<details><summary><code>incident</code> · 2 routes</summary>

● `/m/incident`
○ `/m/incident/new`

</details>

<details><summary><code>incidents</code> · 2 routes</summary>

● `/m/incidents`
○ `/m/incidents/new`

</details>

<details><summary><code>inventory</code> · 1 route</summary>

● `/m/inventory/scan`

</details>

<details><summary><code>kudos</code> · 1 route</summary>

● `/m/kudos`

</details>

<details><summary><code>learning</code> · 2 routes</summary>

● `/m/learning`
○ `/m/learning/[courseId]`

</details>

<details><summary><code>medic</code> · 2 routes</summary>

● `/m/medic`
● `/m/medic/new`

</details>

<details><summary><code>notifications</code> · 1 route</summary>

● `/m/notifications`

</details>

<details><summary><code>onboarding</code> · 2 routes</summary>

● `/m/onboarding`
○ `/m/onboarding/[assignmentId]`

</details>

<details><summary><code>polls</code> · 1 route</summary>

● `/m/polls`

</details>

<details><summary><code>punch</code> · 1 route</summary>

● `/m/punch`

</details>

<details><summary><code>requests</code> · 3 routes</summary>

● `/m/requests`
○ `/m/requests/[requestId]`
○ `/m/requests/new`

</details>

<details><summary><code>ros</code> · 2 routes</summary>

● `/m/ros`
○ `/m/ros/[showId]`

</details>

<details><summary><code>safeguarding</code> · 1 route</summary>

● `/m/safeguarding`

</details>

<details><summary><code>schedule</code> · 1 route</summary>

● `/m/schedule`

</details>

<details><summary><code>settings</code> · 3 routes</summary>

● `/m/settings`
○ `/m/settings/notifications`
○ `/m/settings/role`

</details>

<details><summary><code>shift</code> · 2 routes</summary>

● `/m/shift`
○ `/m/shift/swap`

</details>

<details><summary><code>surveys</code> · 2 routes</summary>

● `/m/surveys`
○ `/m/surveys/[surveyId]`

</details>

<details><summary><code>tasks</code> · 2 routes</summary>

● `/m/tasks`
○ `/m/tasks/[taskId]`

</details>

<details><summary><code>time-off</code> · 2 routes</summary>

● `/m/time-off`
○ `/m/time-off/new`

</details>

<details><summary><code>tracker</code> · 1 route</summary>

● `/m/tracker`

</details>

<details><summary><code>wallet</code> · 1 route</summary>

● `/m/wallet`

</details>

<details><summary><code>wayfind</code> · 1 route</summary>

● `/m/wayfind`

</details>

<details><summary><code>wms</code> · 1 route</summary>

● `/m/wms`

</details>

<details><summary><code>·root</code> · 1 route</summary>

● `/m`

</details>

## GVTEWAY — External Portal (`/p/[slug]`)

140 routes — ● 120 nav · ○ 18 linked · ⚠ 0 orphan

<details><summary><code>announcements</code> · 1 route</summary>

● `/p/[slug]/announcements`

</details>

<details><summary><code>apply</code> · 2 routes</summary>

● `/p/[slug]/apply`
○ `/p/[slug]/apply/changes`

</details>

<details><summary><code>artist</code> · 7 routes</summary>

● `/p/[slug]/artist`
● `/p/[slug]/artist/advancing`
● `/p/[slug]/artist/catering`
● `/p/[slug]/artist/privacy`
● `/p/[slug]/artist/schedule`
● `/p/[slug]/artist/travel`
● `/p/[slug]/artist/venue`

</details>

<details><summary><code>athlete</code> · 6 routes</summary>

● `/p/[slug]/athlete`
● `/p/[slug]/athlete/privacy`
● `/p/[slug]/athlete/requests`
● `/p/[slug]/athlete/safeguarding`
● `/p/[slug]/athlete/training`
● `/p/[slug]/athlete/visa`

</details>

<details><summary><code>client</code> · 19 routes</summary>

● `/p/[slug]/client`
● `/p/[slug]/client/deliverables`
● `/p/[slug]/client/files`
● `/p/[slug]/client/invoices`
○ `/p/[slug]/client/messages`
● `/p/[slug]/client/privacy`
● `/p/[slug]/client/proposals`
○ `/p/[slug]/client/proposals/[proposalId]`
○ `/p/[slug]/client/proposals/[proposalId]/activity`
○ `/p/[slug]/client/proposals/[proposalId]/approvals`
○ `/p/[slug]/client/proposals/[proposalId]/approvals/[approvalId]`
○ `/p/[slug]/client/proposals/[proposalId]/change-orders`
○ `/p/[slug]/client/proposals/[proposalId]/change-orders/[coId]`
○ `/p/[slug]/client/proposals/[proposalId]/change-orders/new`
○ `/p/[slug]/client/proposals/[proposalId]/files`
○ `/p/[slug]/client/proposals/[proposalId]/lifecycle`
○ `/p/[slug]/client/proposals/[proposalId]/revisions`
○ `/p/[slug]/client/proposals/[proposalId]/revisions/[revisionId]`
○ `/p/[slug]/client/proposals/[proposalId]/revisions/new`

</details>

<details><summary><code>crew</code> · 14 routes</summary>

● `/p/[slug]/crew`
○ `/p/[slug]/crew/advances`
● `/p/[slug]/crew/call-sheet`
● `/p/[slug]/crew/chat`
● `/p/[slug]/crew/directory`
● `/p/[slug]/crew/docs`
● `/p/[slug]/crew/feed`
● `/p/[slug]/crew/kudos`
● `/p/[slug]/crew/learning`
● `/p/[slug]/crew/privacy`
● `/p/[slug]/crew/schedule`
● `/p/[slug]/crew/time`
● `/p/[slug]/crew/time-off`
● `/p/[slug]/crew/timesheets`

</details>

<details><summary><code>delegation</code> · 10 routes</summary>

● `/p/[slug]/delegation`
● `/p/[slug]/delegation/accommodation`
● `/p/[slug]/delegation/bookings`
● `/p/[slug]/delegation/cases`
● `/p/[slug]/delegation/entries`
● `/p/[slug]/delegation/meetings`
● `/p/[slug]/delegation/privacy`
● `/p/[slug]/delegation/ratecard`
● `/p/[slug]/delegation/transport`
● `/p/[slug]/delegation/visa`

</details>

<details><summary><code>guest</code> · 5 routes</summary>

● `/p/[slug]/guest`
● `/p/[slug]/guest/logistics`
● `/p/[slug]/guest/privacy`
● `/p/[slug]/guest/schedule`
● `/p/[slug]/guest/tickets`

</details>

<details><summary><code>guide</code> · 2 routes</summary>

● `/p/[slug]/guide`
○ `/p/[slug]/guide/unlock`

</details>

<details><summary><code>hospitality</code> · 4 routes</summary>

● `/p/[slug]/hospitality`
● `/p/[slug]/hospitality/guests`
● `/p/[slug]/hospitality/itinerary`
● `/p/[slug]/hospitality/privacy`

</details>

<details><summary><code>inbox</code> · 1 route</summary>

● `/p/[slug]/inbox`

</details>

<details><summary><code>media</code> · 7 routes</summary>

● `/p/[slug]/media`
● `/p/[slug]/media/accommodation`
● `/p/[slug]/media/info`
● `/p/[slug]/media/pressconf`
● `/p/[slug]/media/privacy`
● `/p/[slug]/media/services`
● `/p/[slug]/media/transport`

</details>

<details><summary><code>messages</code> · 2 routes</summary>

● `/p/[slug]/messages`
○ `/p/[slug]/messages/[roomId]`

</details>

<details><summary><code>producer</code> · 9 routes</summary>

● `/p/[slug]/producer`
● `/p/[slug]/producer/approvals`
● `/p/[slug]/producer/pnl`
● `/p/[slug]/producer/portfolio`
● `/p/[slug]/producer/privacy`
● `/p/[slug]/producer/readiness`
● `/p/[slug]/producer/reviews`
● `/p/[slug]/producer/risk`
● `/p/[slug]/producer/tracker`

</details>

<details><summary><code>promoter</code> · 7 routes</summary>

● `/p/[slug]/promoter`
● `/p/[slug]/promoter/approvals`
● `/p/[slug]/promoter/co-pro`
● `/p/[slug]/promoter/marketing`
● `/p/[slug]/promoter/privacy`
● `/p/[slug]/promoter/settlements`
● `/p/[slug]/promoter/tour-pnl`

</details>

<details><summary><code>schedule</code> · 1 route</summary>

● `/p/[slug]/schedule`

</details>

<details><summary><code>sponsor</code> · 6 routes</summary>

● `/p/[slug]/sponsor`
● `/p/[slug]/sponsor/activations`
● `/p/[slug]/sponsor/assets`
● `/p/[slug]/sponsor/entitlements`
● `/p/[slug]/sponsor/privacy`
● `/p/[slug]/sponsor/reporting`

</details>

<details><summary><code>stakeholder</code> · 7 routes</summary>

● `/p/[slug]/stakeholder`
● `/p/[slug]/stakeholder/audit`
● `/p/[slug]/stakeholder/governance`
● `/p/[slug]/stakeholder/pnl`
● `/p/[slug]/stakeholder/portfolio`
● `/p/[slug]/stakeholder/privacy`
● `/p/[slug]/stakeholder/sustainability`

</details>

<details><summary><code>tasks</code> · 1 route</summary>

● `/p/[slug]/tasks`

</details>

<details><summary><code>vendor</code> · 16 routes</summary>

● `/p/[slug]/vendor`
● `/p/[slug]/vendor/chat`
● `/p/[slug]/vendor/credentials`
● `/p/[slug]/vendor/directory`
● `/p/[slug]/vendor/docs`
● `/p/[slug]/vendor/equipment-pull-list`
● `/p/[slug]/vendor/feed`
● `/p/[slug]/vendor/invoices`
● `/p/[slug]/vendor/kudos`
● `/p/[slug]/vendor/privacy`
● `/p/[slug]/vendor/purchase-orders`
● `/p/[slug]/vendor/schedule`
● `/p/[slug]/vendor/submissions`
● `/p/[slug]/vendor/time-off`
● `/p/[slug]/vendor/training`
○ `/p/[slug]/vendor/training/[course]`

</details>

<details><summary><code>vip</code> · 5 routes</summary>

● `/p/[slug]/vip`
● `/p/[slug]/vip/accommodation`
● `/p/[slug]/vip/itinerary`
● `/p/[slug]/vip/privacy`
● `/p/[slug]/vip/transport`

</details>

<details><summary><code>volunteer</code> · 6 routes</summary>

● `/p/[slug]/volunteer`
● `/p/[slug]/volunteer/application`
● `/p/[slug]/volunteer/privacy`
● `/p/[slug]/volunteer/schedule`
● `/p/[slug]/volunteer/training`
● `/p/[slug]/volunteer/uniform`

</details>

<details><summary><code>·root</code> · 2 routes</summary>

· `/p/[slug]`
· `/p/select`

</details>

## GVTEWAY — Public / Marketing

86 routes — ● 31 nav · ○ 47 linked · ⚠ 0 orphan

<details><summary><code>about</code> · 1 route</summary>

● `/about`

</details>

<details><summary><code>ai</code> · 2 routes</summary>

● `/ai`
○ `/ai/[slug]`

</details>

<details><summary><code>alternatives</code> · 2 routes</summary>

● `/alternatives`
○ `/alternatives/[competitor]`

</details>

<details><summary><code>blog</code> · 2 routes</summary>

● `/blog`
○ `/blog/[slug]`

</details>

<details><summary><code>brand-kit</code> · 3 routes</summary>

· `/brand-kit`
· `/brand-kit/foundations`
· `/brand-kit/logo-kit`

</details>

<details><summary><code>careers</code> · 1 route</summary>

● `/careers`

</details>

<details><summary><code>changelog</code> · 1 route</summary>

● `/changelog`

</details>

<details><summary><code>community</code> · 2 routes</summary>

● `/community`
○ `/community/[slug]`

</details>

<details><summary><code>compare</code> · 2 routes</summary>

○ `/compare`
○ `/compare/[competitor]`

</details>

<details><summary><code>contact</code> · 1 route</summary>

● `/contact`

</details>

<details><summary><code>customers</code> · 2 routes</summary>

● `/customers`
○ `/customers/[slug]`

</details>

<details><summary><code>demo</code> · 2 routes</summary>

· `/demo`
· `/demo/[persona]`

</details>

<details><summary><code>docs</code> · 1 route</summary>

● `/docs`

</details>

<details><summary><code>es-ES</code> · 1 route</summary>

· `/es-ES`

</details>

<details><summary><code>features</code> · 3 routes</summary>

● `/features`
○ `/features/[module]`
○ `/features/[module]/[industry]`

</details>

<details><summary><code>glossary</code> · 2 routes</summary>

● `/glossary`
○ `/glossary/[slug]`

</details>

<details><summary><code>guides</code> · 2 routes</summary>

● `/guides`
○ `/guides/[slug]`

</details>

<details><summary><code>help</code> · 1 route</summary>

● `/help`

</details>

<details><summary><code>integrations</code> · 6 routes</summary>

● `/integrations`
○ `/integrations/[slug]`
○ `/integrations/partners`
○ `/integrations/partners/[slug]`
○ `/integrations/submit`
○ `/integrations/submit/thanks`

</details>

<details><summary><code>legal</code> · 4 routes</summary>

● `/legal/dpa`
● `/legal/privacy`
● `/legal/sla`
● `/legal/terms`

</details>

<details><summary><code>marketplace</code> · 26 routes</summary>

● `/marketplace`
○ `/marketplace/agencies`
○ `/marketplace/agencies/[handle]`
○ `/marketplace/agencies/[handle]/inquire`
○ `/marketplace/calendar`
○ `/marketplace/calls`
○ `/marketplace/calls/[slug]`
○ `/marketplace/calls/[slug]/submit`
○ `/marketplace/crew`
○ `/marketplace/crew/[handle]`
○ `/marketplace/crew/[handle]/inquire`
○ `/marketplace/gigs`
○ `/marketplace/gigs/[slug]`
○ `/marketplace/gigs/[slug]/apply`
○ `/marketplace/rfqs`
○ `/marketplace/rfqs/[slug]`
○ `/marketplace/rfqs/[slug]/inquire`
○ `/marketplace/store`
○ `/marketplace/store/[slug]`
○ `/marketplace/store/cart`
○ `/marketplace/talent`
○ `/marketplace/talent/[handle]`
○ `/marketplace/talent/[handle]/inquire`
○ `/marketplace/vendors`
○ `/marketplace/vendors/[handle]`
○ `/marketplace/vendors/[handle]/inquire`

</details>

<details><summary><code>partners</code> · 1 route</summary>

● `/partners`

</details>

<details><summary><code>press</code> · 1 route</summary>

● `/press`

</details>

<details><summary><code>pricing</code> · 1 route</summary>

● `/pricing`

</details>

<details><summary><code>pt-BR</code> · 1 route</summary>

· `/pt-BR`

</details>

<details><summary><code>roadmap</code> · 1 route</summary>

● `/roadmap`

</details>

<details><summary><code>solutions</code> · 5 routes</summary>

● `/solutions`
○ `/solutions/[industry]`
● `/solutions/atlvs`
● `/solutions/compvss`
● `/solutions/gvteway`

</details>

<details><summary><code>status</code> · 1 route</summary>

● `/status`

</details>

<details><summary><code>teams</code> · 2 routes</summary>

○ `/teams`
○ `/teams/[role]`

</details>

<details><summary><code>templates</code> · 2 routes</summary>

● `/templates`
○ `/templates/[slug]`

</details>

<details><summary><code>tools</code> · 3 routes</summary>

● `/tools`
○ `/tools/capacity-calculator`
○ `/tools/per-diem-calculator`

</details>

<details><summary><code>·root</code> · 1 route</summary>

· `/`

</details>

## Personal (`/me`)

25 routes — ● 19 nav · ○ 6 linked · ⚠ 0 orphan

<details><summary><code>applications</code> · 2 routes</summary>

● `/me/applications`
○ `/me/applications/[applicationId]`

</details>

<details><summary><code>availability</code> · 1 route</summary>

● `/me/availability`

</details>

<details><summary><code>crew</code> · 1 route</summary>

● `/me/crew`

</details>

<details><summary><code>inquiries</code> · 1 route</summary>

● `/me/inquiries`

</details>

<details><summary><code>notifications</code> · 3 routes</summary>

● `/me/notifications`
● `/me/notifications/inbox`
○ `/me/notifications/push`

</details>

<details><summary><code>offers</code> · 1 route</summary>

● `/me/offers`

</details>

<details><summary><code>organizations</code> · 1 route</summary>

● `/me/organizations`

</details>

<details><summary><code>preferences</code> · 1 route</summary>

● `/me/preferences`

</details>

<details><summary><code>privacy</code> · 1 route</summary>

● `/me/privacy`

</details>

<details><summary><code>profile</code> · 1 route</summary>

● `/me/profile`

</details>

<details><summary><code>reviews</code> · 2 routes</summary>

● `/me/reviews`
○ `/me/reviews/new`

</details>

<details><summary><code>saved-searches</code> · 1 route</summary>

● `/me/saved-searches`

</details>

<details><summary><code>security</code> · 2 routes</summary>

● `/me/security`
○ `/me/security/two-factor`

</details>

<details><summary><code>settings</code> · 2 routes</summary>

● `/me/settings`
○ `/me/settings/appearance`

</details>

<details><summary><code>submissions</code> · 2 routes</summary>

● `/me/submissions`
○ `/me/submissions/[submissionId]`

</details>

<details><summary><code>talent</code> · 1 route</summary>

● `/me/talent`

</details>

<details><summary><code>tickets</code> · 1 route</summary>

● `/me/tickets`

</details>

<details><summary><code>·root</code> · 1 route</summary>

● `/me`

</details>

## Auth

13 routes — ● 2 nav · ○ 0 linked · ⚠ 0 orphan

<details><summary><code>accept-invite</code> · 1 route</summary>

· `/accept-invite/[token]`

</details>

<details><summary><code>forgot-password</code> · 1 route</summary>

· `/forgot-password`

</details>

<details><summary><code>login</code> · 1 route</summary>

● `/login`

</details>

<details><summary><code>magic-link</code> · 2 routes</summary>

· `/magic-link`
· `/magic-link/[token]`

</details>

<details><summary><code>mfa</code> · 1 route</summary>

· `/mfa/challenge`

</details>

<details><summary><code>onboarding</code> · 1 route</summary>

· `/onboarding/org`

</details>

<details><summary><code>reset-password</code> · 2 routes</summary>

· `/reset-password`
· `/reset-password/[token]`

</details>

<details><summary><code>signup</code> · 1 route</summary>

● `/signup`

</details>

<details><summary><code>sso</code> · 1 route</summary>

· `/sso/[provider]`

</details>

<details><summary><code>verify-email</code> · 2 routes</summary>

· `/verify-email`
· `/verify-email/[token]`

</details>

---

## API surface (`/api/v1`) — 124 route handlers


<details><summary><code>/api/v1/accreditation</code> · 1</summary>

- `/api/v1/accreditation/scan`

</details>

<details><summary><code>/api/v1/ai</code> · 5</summary>

- `/api/v1/ai/chat`
- `/api/v1/ai/conversations`
- `/api/v1/ai/conversations/[id]`
- `/api/v1/ai/embed-source`
- `/api/v1/ai/propose`

</details>

<details><summary><code>/api/v1/auth</code> · 4</summary>

- `/api/v1/auth/oauth`
- `/api/v1/auth/webauthn/credentials`
- `/api/v1/auth/webauthn/register/options`
- `/api/v1/auth/webauthn/register/verify`

</details>

<details><summary><code>/api/v1/automations</code> · 1</summary>

- `/api/v1/automations/[automationId]/webhook`

</details>

<details><summary><code>/api/v1/bim</code> · 1</summary>

- `/api/v1/bim/[modelId]/download`

</details>

<details><summary><code>/api/v1/brand-kit</code> · 1</summary>

- `/api/v1/brand-kit`

</details>

<details><summary><code>/api/v1/branding</code> · 1</summary>

- `/api/v1/branding/upload`

</details>

<details><summary><code>/api/v1/compliance</code> · 1</summary>

- `/api/v1/compliance/audit-export`

</details>

<details><summary><code>/api/v1/credentials</code> · 1</summary>

- `/api/v1/credentials/extract`

</details>

<details><summary><code>/api/v1/crisis</code> · 1</summary>

- `/api/v1/crisis/alerts`

</details>

<details><summary><code>/api/v1/daily-logs</code> · 1</summary>

- `/api/v1/daily-logs/[id]/refresh-weather`

</details>

<details><summary><code>/api/v1/deliverable-templates</code> · 1</summary>

- `/api/v1/deliverable-templates`

</details>

<details><summary><code>/api/v1/deliverables</code> · 4</summary>

- `/api/v1/deliverables/[id]/download`
- `/api/v1/deliverables/[id]/pdf`
- `/api/v1/deliverables/[id]/transition`
- `/api/v1/deliverables/[id]/version-diff`

</details>

<details><summary><code>/api/v1/documents</code> · 2</summary>

- `/api/v1/documents`
- `/api/v1/documents/[docType]`

</details>

<details><summary><code>/api/v1/drawings</code> · 2</summary>

- `/api/v1/drawings/[siteplanId]/markups`
- `/api/v1/drawings/markups/[id]`

</details>

<details><summary><code>/api/v1/email-templates</code> · 2</summary>

- `/api/v1/email-templates`
- `/api/v1/email-templates/[id]`

</details>

<details><summary><code>/api/v1/equipment</code> · 1</summary>

- `/api/v1/equipment/scan`

</details>

<details><summary><code>/api/v1/exports</code> · 3</summary>

- `/api/v1/exports`
- `/api/v1/exports/[id]/download`
- `/api/v1/exports/osha`

</details>

<details><summary><code>/api/v1/graphql</code> · 1</summary>

- `/api/v1/graphql`

</details>

<details><summary><code>/api/v1/guides</code> · 3</summary>

- `/api/v1/guides/[guideId]/pdf`
- `/api/v1/guides/comments`
- `/api/v1/guides/unlock`

</details>

<details><summary><code>/api/v1/health</code> · 3</summary>

- `/api/v1/health`
- `/api/v1/health/liveness`
- `/api/v1/health/readiness`

</details>

<details><summary><code>/api/v1/import</code> · 3</summary>

- `/api/v1/import/crew-members`
- `/api/v1/import/tasks`
- `/api/v1/import/vendors`

</details>

<details><summary><code>/api/v1/incidents</code> · 2</summary>

- `/api/v1/incidents`
- `/api/v1/incidents/photo-upload`

</details>

<details><summary><code>/api/v1/integrations</code> · 10</summary>

- `/api/v1/integrations/[system]/sync`
- `/api/v1/integrations/fx/refresh`
- `/api/v1/integrations/qb-online/callback`
- `/api/v1/integrations/qb-online/oauth-start`
- `/api/v1/integrations/qb-online/push`
- `/api/v1/integrations/qb-online/sync`
- `/api/v1/integrations/slack/callback`
- `/api/v1/integrations/slack/events`
- `/api/v1/integrations/slack/install`
- `/api/v1/integrations/slack/uninstall`

</details>

<details><summary><code>/api/v1/internal</code> · 2</summary>

- `/api/v1/internal/automations/dispatch`
- `/api/v1/internal/automations/schedule`

</details>

<details><summary><code>/api/v1/invoices</code> · 1</summary>

- `/api/v1/invoices/[invoiceId]/pdf`

</details>

<details><summary><code>/api/v1/locations</code> · 1</summary>

- `/api/v1/locations`

</details>

<details><summary><code>/api/v1/me</code> · 8</summary>

- `/api/v1/me`
- `/api/v1/me/api-keys`
- `/api/v1/me/api-keys/[id]`
- `/api/v1/me/delete`
- `/api/v1/me/export`
- `/api/v1/me/preferences`
- `/api/v1/me/restore`
- `/api/v1/me/workspaces`

</details>

<details><summary><code>/api/v1/metrics</code> · 2</summary>

- `/api/v1/metrics`
- `/api/v1/metrics/[metricId]`

</details>

<details><summary><code>/api/v1/notifications</code> · 2</summary>

- `/api/v1/notifications`
- `/api/v1/notifications/actions`

</details>

<details><summary><code>/api/v1/openapi.json</code> · 1</summary>

- `/api/v1/openapi.json`

</details>

<details><summary><code>/api/v1/pay-apps</code> · 1</summary>

- `/api/v1/pay-apps/[payAppId]/pdf`

</details>

<details><summary><code>/api/v1/payroll-runs</code> · 2</summary>

- `/api/v1/payroll-runs/[runId]/pdf`
- `/api/v1/payroll-runs/[runId]/state-xml`

</details>

<details><summary><code>/api/v1/privacy</code> · 1</summary>

- `/api/v1/privacy/dsar`

</details>

<details><summary><code>/api/v1/procurement</code> · 1</summary>

- `/api/v1/procurement/vendors/[vendorId]/rfp`

</details>

<details><summary><code>/api/v1/projects</code> · 10</summary>

- `/api/v1/projects`
- `/api/v1/projects/[projectId]`
- `/api/v1/projects/[projectId]/advance-book`
- `/api/v1/projects/[projectId]/archive`
- `/api/v1/projects/[projectId]/call-sheet`
- `/api/v1/projects/[projectId]/expense-report`
- `/api/v1/projects/[projectId]/signage-grid`
- `/api/v1/projects/[projectId]/sponsor-deck`
- `/api/v1/projects/[projectId]/task-report`
- `/api/v1/projects/[projectId]/wristbands`

</details>

<details><summary><code>/api/v1/push</code> · 2</summary>

- `/api/v1/push/subscriptions`
- `/api/v1/push/test`

</details>

<details><summary><code>/api/v1/rentals</code> · 1</summary>

- `/api/v1/rentals/[rentalId]/pull-sheet`

</details>

<details><summary><code>/api/v1/reports</code> · 3</summary>

- `/api/v1/reports`
- `/api/v1/reports/[reportId]`
- `/api/v1/reports/[reportId]/snapshot`

</details>

<details><summary><code>/api/v1/risks</code> · 1</summary>

- `/api/v1/risks`

</details>

<details><summary><code>/api/v1/scan</code> · 1</summary>

- `/api/v1/scan`

</details>

<details><summary><code>/api/v1/schedule.ics</code> · 1</summary>

- `/api/v1/schedule.ics`

</details>

<details><summary><code>/api/v1/share-links</code> · 2</summary>

- `/api/v1/share-links`
- `/api/v1/share-links/[id]`

</details>

<details><summary><code>/api/v1/shifts</code> · 1</summary>

- `/api/v1/shifts/checkin`

</details>

<details><summary><code>/api/v1/site-plans</code> · 1</summary>

- `/api/v1/site-plans/[id]/pdf`

</details>

<details><summary><code>/api/v1/stage-plots</code> · 2</summary>

- `/api/v1/stage-plots`
- `/api/v1/stage-plots/[id]`

</details>

<details><summary><code>/api/v1/stripe</code> · 3</summary>

- `/api/v1/stripe/checkout`
- `/api/v1/stripe/connect/onboarding`
- `/api/v1/stripe/portal`

</details>

<details><summary><code>/api/v1/telemetry</code> · 1</summary>

- `/api/v1/telemetry/marketing`

</details>

<details><summary><code>/api/v1/users</code> · 1</summary>

- `/api/v1/users/[userId]/calendar.ics`

</details>

<details><summary><code>/api/v1/v2</code> · 4</summary>

- `/api/scim/v2/Groups`
- `/api/scim/v2/ServiceProviderConfig`
- `/api/scim/v2/Users`
- `/api/scim/v2/Users/[id]`

</details>

<details><summary><code>/api/v1/webhooks</code> · 5</summary>

- `/api/v1/webhooks/docusign`
- `/api/v1/webhooks/endpoints`
- `/api/v1/webhooks/endpoints/[id]`
- `/api/v1/webhooks/ses-inbound`
- `/api/v1/webhooks/stripe`

</details>

<details><summary><code>/api/v1/wip</code> · 1</summary>

- `/api/v1/wip/snapshot-pdf`

</details>

<details><summary><code>/api/v1/zapier</code> · 7</summary>

- `/api/v1/zapier/actions/create-project`
- `/api/v1/zapier/actions/create-task`
- `/api/v1/zapier/auth/test`
- `/api/v1/zapier/triggers/assignment-scans`
- `/api/v1/zapier/triggers/deliverables`
- `/api/v1/zapier/triggers/invoices`
- `/api/v1/zapier/triggers/projects`

</details>
