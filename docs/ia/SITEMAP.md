# SITEMAP — single source of truth

> **GENERATED FILE — do not hand-edit.** Regenerate with
> `node scripts/generate-sitemap.mjs`. Derived from the filesystem
> (`src/app/**/page.tsx`) reconciled against the curated nav IA
> (`src/lib/nav.ts`). Supersedes `docs/ia/02-route-inventory.md` and the
> stale `docs/ia/inventory/sitemap-workflow-inventory.*` snapshots.
>
> Reconciliation strategy + backlog: `docs/ia/SITEMAP_RECONCILIATION.md`.

**Page routes:** 1215 · **API route handlers:** 156 · **Distinct nav hrefs:** 538

## Legend

| Mark | Status | Meaning |
|------|--------|---------|
| ● | `nav` | Exact path is a nav href — directly clickable from a rail/tab/header/footer. |
| ○ | `linked` | Module is in nav; route reached via in-page link or CRUD child (`/new`, `/[id]`, deep sub-modules, or dynamic SEO children). |
| ⚠ | `orphan` | **Nothing** in this module appears anywhere in `nav.ts` — invisible to navigation. |
| · | `exempt` | Intentionally not in nav — redirect / token / locale / contextual entry (see "Exempt routes" below). |

**Every shell is now reconciled against `nav.ts`** — the rails (platform/mobile/portal), the marketing header + footer (`marketingHeaderGroups` / `marketingFooterGroups`), and the `/me` tabs (`personalNavGroups`) all source their links from `nav.ts`, and the components render that data. There is no longer an unmeasured self-navigating shell.

## Reconciliation scorecard

| Shell | Nav source | Routes | ● nav | ○ linked | ⚠ orphan | · exempt |
|-------|------------|-------:|------:|---------:|---------:|---------:|
| ATLVS — Operator Console | platformNav rail | 794 | 251 | 541 | 0 | 2 |
| COMPVSS — Field PWA | mobileTabs / mobileSurfaces | 75 | 57 | 17 | 0 | 1 |
| GVTEWAY — External Portal | portalNav rail | 156 | 129 | 23 | 0 | 4 |
| LEG3ND — Knowledge Shell | legendNav rail | 43 | 21 | 22 | 0 | 0 |
| GVTEWAY — Public / Marketing | marketingHeaderGroups + marketingFooterGroups | 93 | 33 | 51 | 0 | 9 |
| Personal (/me) | personalNavGroups (tabs) | 25 | 19 | 6 | 0 | 0 |
| Auth | marketing header auth links + token flows | 14 | 2 | 0 | 0 | 12 |
| **TOTAL** | | **1215** | **512** | **660** | **0** | **43** |

## ⚠️ Orphan modules (0) — features with zero nav entry

These trees exist on disk and are routable, but nothing in `nav.ts` links to them. They are the primary reconciliation target.

| Shell | Module | Orphaned routes |
|-------|--------|----------------:|

## 🔗 Dangling nav hrefs (0) — links with no page on disk

_None — every nav href resolves to a page._

## 🪫 Unresolved priority refs (0) — COMPVSS

_None — every role/phase priority href is a registered `mobileSurfaces` entry._

## · Exempt routes (43) — intentional non-nav, with reasons

Reached by redirect, emailed/shared token link, locale routing, or contextual entry — never a nav click. Defined in `EXEMPT` in the generator.

| Match | Type | Reason |
|-------|------|--------|
| `/studio/advancing/request` | exact | One Front Door redirect — resolves the active production's advancing intake; reached from the global + menu. |
| `/studio/operations/dispatch` | exact | Dispatch Matrix redirect — promoted to the unified /studio/operations/schedule; keeps old links resolving. |
| `/p/[slug]` | exact | Portal gateway — persona picker / redirect to the viewer's persona home. |
| `/p/select` | exact | Org/slug picker — reached when a portal user has no resolved slug. |
| `/p/[slug]/onboarding` | prefix | Onboarding assignment — reached from the /p/[slug]/tasks list that surfaces it, never a rail item (ADR-0008 Amendment 4: this is where the /m/onboarding/[id] handoff landed). |
| `/p` | exact | GVTEWAY home — the discovery/marketplace, reached via the gvteway.atlvs.pro subdomain root (not a path-prefix nav item). |
| `/` | exact | Home — reached via the logo, not a nav entry. |
| `/es-ES` | prefix | i18n locale root. |
| `/pt-BR` | prefix | i18n locale root. |
| `/api-docs` | prefix | API reference microsite. |
| `/brand-kit` | prefix | Brand-kit microsite. |
| `/demo` | prefix | Demo-booking flow. |
| `/pitch` | prefix | pitch deck presenter surface |
| `/forms` | prefix | Embedded campaign/SEO form pages. |
| `/offer` | prefix | Token-gated offer flow. |
| `/book` | prefix | Token-gated public scheduler booking flow (emailed / packet link). |
| `/proposals` | prefix | Token-gated proposal flow. |
| `/msa` | prefix | Token-gated MSA flow. |
| `/share` | prefix | Token-gated share link. |
| `/sign` | prefix | Token-gated public e-signature flow (emailed signing link). |
| `/accept-invite` | prefix | Token-gated invite acceptance. |
| `/auth` | prefix | Auth resolver / redirect. |
| `/forgot-password` | prefix | Auth recovery flow. |
| `/reset-password` | prefix | Auth recovery flow. |
| `/magic-link` | prefix | Auth passwordless flow. |
| `/mfa` | prefix | Auth MFA challenge. |
| `/sso` | prefix | Auth SSO entry. |
| `/verify-email` | prefix | Auth email verification. |
| `/onboarding` | prefix | Post-signup org onboarding flow. |
| `/home` | exact | Post-auth app launcher — reached via auth redirect, not a nav click. |
| `/m/settings/account` | exact | account lifecycle sub-screen, reached from /m/settings |
| `/social` | prefix | social image asset endpoint |
| `/studio/settings/impersonate` | exact | dev-only impersonation console (isDeveloper-gated, notFound otherwise) |

---

# Full inventory by app

## ATLVS — Operator Console (`/studio`)

794 routes — ● 251 nav · ○ 541 linked · ⚠ 0 orphan

<details><summary><code>access-control</code> · 2 routes</summary>

● `/studio/access-control`
● `/studio/access-control/counts`

</details>

<details><summary><code>accommodation</code> · 6 routes</summary>

● `/studio/accommodation`
○ `/studio/accommodation/blocks`
○ `/studio/accommodation/blocks/[blockId]`
○ `/studio/accommodation/blocks/[blockId]/edit`
○ `/studio/accommodation/blocks/new`
○ `/studio/accommodation/village`

</details>

<details><summary><code>accreditation</code> · 17 routes</summary>

● `/studio/accreditation`
○ `/studio/accreditation/categories`
○ `/studio/accreditation/categories/[categoryId]`
○ `/studio/accreditation/categories/[categoryId]/edit`
○ `/studio/accreditation/categories/new`
○ `/studio/accreditation/changes`
○ `/studio/accreditation/changes/[changeId]`
○ `/studio/accreditation/changes/[changeId]/edit`
○ `/studio/accreditation/changes/new`
○ `/studio/accreditation/policy`
○ `/studio/accreditation/print`
○ `/studio/accreditation/print/sheet`
○ `/studio/accreditation/scans`
○ `/studio/accreditation/vetting`
○ `/studio/accreditation/vetting/[applicationId]`
○ `/studio/accreditation/vetting/[applicationId]/edit`
○ `/studio/accreditation/zones`

</details>

<details><summary><code>action-items</code> · 1 route</summary>

● `/studio/action-items`

</details>

<details><summary><code>advancing</code> · 2 routes</summary>

● `/studio/advancing`
○ `/studio/advancing/deliverables/[deliverableId]`

</details>

<details><summary><code>agency</code> · 8 routes</summary>

○ `/studio/agency`
○ `/studio/agency/commissions`
● `/studio/agency/roster`
○ `/studio/agency/roster/[agencyArtistId]`
● `/studio/agency/tours`
○ `/studio/agency/tours/[tourId]`
○ `/studio/agency/tours/new`
● `/studio/agency/tours/routing`

</details>

<details><summary><code>ai</code> · 10 routes</summary>

○ `/studio/ai`
● `/studio/ai/agents`
○ `/studio/ai/agents/[agentId]`
○ `/studio/ai/agents/new`
● `/studio/ai/automations`
○ `/studio/ai/automations/[automationId]`
○ `/studio/ai/automations/[automationId]/runs`
○ `/studio/ai/automations/[automationId]/runs/[runId]`
○ `/studio/ai/automations/new`
● `/studio/ai/corpus`

</details>

<details><summary><code>annotations</code> · 2 routes</summary>

● `/studio/annotations`
○ `/studio/annotations/[id]`

</details>

<details><summary><code>assets</code> · 10 routes</summary>

● `/studio/assets`
○ `/studio/assets/[id]`
○ `/studio/assets/[id]/edit`
○ `/studio/assets/[id]/qr`
○ `/studio/assets/new`
● `/studio/assets/power`
● `/studio/assets/pull-sheets`
● `/studio/assets/scans`
● `/studio/assets/warranties`
○ `/studio/assets/warranties/new`

</details>

<details><summary><code>assistant</code> · 2 routes</summary>

● `/studio/assistant`
○ `/studio/assistant/[conversationId]`

</details>

<details><summary><code>bim</code> · 5 routes</summary>

● `/studio/bim`
○ `/studio/bim/[id]`
○ `/studio/bim/[id]/edit`
○ `/studio/bim/[id]/view`
○ `/studio/bim/new`

</details>

<details><summary><code>board</code> · 1 route</summary>

● `/studio/board`

</details>

<details><summary><code>bookings</code> · 9 routes</summary>

● `/studio/bookings`
○ `/studio/bookings/calendar`
○ `/studio/bookings/deals`
○ `/studio/bookings/deals/[offerId]`
○ `/studio/bookings/deals/[offerId]/settlement`
○ `/studio/bookings/holds`
○ `/studio/bookings/holds/new`
○ `/studio/bookings/settlements`
○ `/studio/bookings/settlements/[id]`

</details>

<details><summary><code>calendar</code> · 1 route</summary>

● `/studio/calendar`

</details>

<details><summary><code>campaigns</code> · 2 routes</summary>

● `/studio/campaigns`
○ `/studio/campaigns/new`

</details>

<details><summary><code>captures</code> · 2 routes</summary>

● `/studio/captures`
○ `/studio/captures/new`

</details>

<details><summary><code>clients</code> · 8 routes</summary>

● `/studio/clients`
○ `/studio/clients/[clientId]`
○ `/studio/clients/[clientId]/branding`
○ `/studio/clients/[clientId]/edit`
○ `/studio/clients/[clientId]/invoices`
○ `/studio/clients/[clientId]/projects`
○ `/studio/clients/[clientId]/proposals`
○ `/studio/clients/new`

</details>

<details><summary><code>collaborate</code> · 9 routes</summary>

● `/studio/collaborate/docs`
○ `/studio/collaborate/docs/[id]`
○ `/studio/collaborate/docs/new`
● `/studio/collaborate/sheets`
○ `/studio/collaborate/sheets/[id]`
○ `/studio/collaborate/sheets/new`
● `/studio/collaborate/whiteboards`
○ `/studio/collaborate/whiteboards/[id]`
○ `/studio/collaborate/whiteboards/new`

</details>

<details><summary><code>commercial</code> · 9 routes</summary>

○ `/studio/commercial`
● `/studio/commercial/hospitality`
○ `/studio/commercial/hospitality/[packageId]`
○ `/studio/commercial/hospitality/[packageId]/edit`
○ `/studio/commercial/licensing`
● `/studio/commercial/sponsors`
○ `/studio/commercial/sponsors/[sponsorId]`
○ `/studio/commercial/sponsors/[sponsorId]/edit`
○ `/studio/commercial/sponsors/new`

</details>

<details><summary><code>comms</code> · 16 routes</summary>

● `/studio/comms/advances`
○ `/studio/comms/advances/[batchId]`
○ `/studio/comms/advances/new`
● `/studio/comms/announcements`
○ `/studio/comms/announcements/[id]`
○ `/studio/comms/announcements/[id]/edit`
○ `/studio/comms/announcements/new`
● `/studio/comms/channels`
○ `/studio/comms/channels/[id]`
○ `/studio/comms/channels/new`
● `/studio/comms/polls`
○ `/studio/comms/polls/[id]`
○ `/studio/comms/polls/new`
● `/studio/comms/surveys`
○ `/studio/comms/surveys/[id]`
○ `/studio/comms/surveys/new`

</details>

<details><summary><code>compliance</code> · 3 routes</summary>

● `/studio/compliance`
● `/studio/compliance/coc`
● `/studio/compliance/permits`

</details>

<details><summary><code>copilot</code> · 1 route</summary>

● `/studio/copilot`

</details>

<details><summary><code>crm</code> · 1 route</summary>

● `/studio/crm`

</details>

<details><summary><code>dashboards</code> · 3 routes</summary>

● `/studio/dashboards`
○ `/studio/dashboards/[id]`
○ `/studio/dashboards/[id]/edit`

</details>

<details><summary><code>documents</code> · 2 routes</summary>

● `/studio/documents`
○ `/studio/documents/[docType]`

</details>

<details><summary><code>drawings</code> · 4 routes</summary>

● `/studio/drawings`
○ `/studio/drawings/[id]`
○ `/studio/drawings/[id]/edit`
○ `/studio/drawings/new`

</details>

<details><summary><code>email-inbox</code> · 2 routes</summary>

● `/studio/email-inbox`
○ `/studio/email-inbox/[id]`

</details>

<details><summary><code>envelopes</code> · 4 routes</summary>

● `/studio/envelopes`
○ `/studio/envelopes/[id]`
○ `/studio/envelopes/[id]/prepare`
○ `/studio/envelopes/new`

</details>

<details><summary><code>estimates</code> · 4 routes</summary>

● `/studio/estimates`
○ `/studio/estimates/[id]`
○ `/studio/estimates/[id]/edit`
○ `/studio/estimates/new`

</details>

<details><summary><code>events</code> · 4 routes</summary>

● `/studio/events`
○ `/studio/events/[eventId]`
○ `/studio/events/[eventId]/edit`
○ `/studio/events/new`

</details>

<details><summary><code>finance</code> · 67 routes</summary>

○ `/studio/finance`
● `/studio/finance/accounts`
○ `/studio/finance/accounts/new`
● `/studio/finance/ap-ocr`
○ `/studio/finance/ap-ocr/[id]`
● `/studio/finance/auto-invoicing`
● `/studio/finance/budgets`
○ `/studio/finance/budgets/[budgetId]`
○ `/studio/finance/budgets/[budgetId]/edit`
○ `/studio/finance/budgets/import`
○ `/studio/finance/budgets/new`
○ `/studio/finance/budgets/summary`
● `/studio/finance/budgets/variance`
○ `/studio/finance/consolidation`
● `/studio/finance/cost-codes`
○ `/studio/finance/cost-codes/new`
● `/studio/finance/entities`
○ `/studio/finance/entities/[id]`
○ `/studio/finance/entities/[id]/edit`
○ `/studio/finance/entities/new`
● `/studio/finance/expenses`
○ `/studio/finance/expenses/[expenseId]`
○ `/studio/finance/expenses/[expenseId]/edit`
○ `/studio/finance/expenses/new`
● `/studio/finance/forecasts`
○ `/studio/finance/forecasts/new`
● `/studio/finance/invoices`
○ `/studio/finance/invoices/[invoiceId]`
○ `/studio/finance/invoices/[invoiceId]/activity`
○ `/studio/finance/invoices/[invoiceId]/edit`
○ `/studio/finance/invoices/[invoiceId]/line-items`
○ `/studio/finance/invoices/new`
● `/studio/finance/ledger`
○ `/studio/finance/ledger/[id]`
○ `/studio/finance/ledger/new`
● `/studio/finance/lien-waivers`
○ `/studio/finance/lien-waivers/[id]`
○ `/studio/finance/lien-waivers/new`
● `/studio/finance/mileage`
○ `/studio/finance/mileage/[mileageId]`
○ `/studio/finance/mileage/[mileageId]/edit`
○ `/studio/finance/mileage/new`
● `/studio/finance/pay-apps`
○ `/studio/finance/pay-apps/[id]`
○ `/studio/finance/pay-apps/new`
● `/studio/finance/payouts`
● `/studio/finance/payroll`
○ `/studio/finance/payroll/[runId]`
○ `/studio/finance/payroll/new`
● `/studio/finance/periods`
○ `/studio/finance/periods/[periodId]`
○ `/studio/finance/periods/[periodId]/transitions`
○ `/studio/finance/periods/new`
● `/studio/finance/reports`
● `/studio/finance/sub-invoices`
● `/studio/finance/tax`
○ `/studio/finance/tax/calculations`
● `/studio/finance/time`
○ `/studio/finance/time/[entryId]`
○ `/studio/finance/time/[entryId]/edit`
○ `/studio/finance/time/new`
● `/studio/finance/timesheets`
○ `/studio/finance/timesheets/[id]`
● `/studio/finance/timesheets/corrections`
○ `/studio/finance/treasury`
● `/studio/finance/wip`
○ `/studio/finance/wip/new`

</details>

<details><summary><code>forms</code> · 6 routes</summary>

● `/studio/forms`
○ `/studio/forms/[formId]`
○ `/studio/forms/[formId]/edit`
○ `/studio/forms/[formId]/submissions`
○ `/studio/forms/[formId]/submissions/[submissionId]`
○ `/studio/forms/new`

</details>

<details><summary><code>goals</code> · 4 routes</summary>

● `/studio/goals`
○ `/studio/goals/[id]`
○ `/studio/goals/[id]/edit`
○ `/studio/goals/new`

</details>

<details><summary><code>governance</code> · 7 routes</summary>

● `/studio/governance/approvals`
○ `/studio/governance/approvals/[id]`
○ `/studio/governance/approvals/delegations`
○ `/studio/governance/approvals/delegations/new`
○ `/studio/governance/approvals/policies`
○ `/studio/governance/approvals/policies/[policyId]`
○ `/studio/governance/approvals/policies/new`

</details>

<details><summary><code>guides</code> · 1 route</summary>

● `/studio/guides`

</details>

<details><summary><code>help</code> · 3 routes</summary>

● `/studio/help`
● `/studio/help/status`
● `/studio/help/whats-new`

</details>

<details><summary><code>import</code> · 1 route</summary>

● `/studio/import`

</details>

<details><summary><code>inbox</code> · 1 route</summary>

● `/studio/inbox`

</details>

<details><summary><code>insights</code> · 1 route</summary>

● `/studio/insights`

</details>

<details><summary><code>inspections</code> · 6 routes</summary>

● `/studio/inspections`
○ `/studio/inspections/[id]`
○ `/studio/inspections/[id]/edit`
○ `/studio/inspections/new`
○ `/studio/inspections/templates`
○ `/studio/inspections/templates/new`

</details>

<details><summary><code>kits</code> · 2 routes</summary>

● `/studio/kits`
○ `/studio/kits/[kitId]`

</details>

<details><summary><code>knowledge</code> · 4 routes</summary>

● `/studio/knowledge`
○ `/studio/knowledge/[slug]`
○ `/studio/knowledge/[slug]/edit`
○ `/studio/knowledge/new`

</details>

<details><summary><code>leads</code> · 6 routes</summary>

● `/studio/leads`
○ `/studio/leads/[leadId]`
○ `/studio/leads/[leadId]/activity`
○ `/studio/leads/[leadId]/edit`
○ `/studio/leads/[leadId]/proposals`
○ `/studio/leads/new`

</details>

<details><summary><code>legal</code> · 19 routes</summary>

○ `/studio/legal`
● `/studio/legal/contracts`
○ `/studio/legal/contracts/[id]`
○ `/studio/legal/contracts/new`
● `/studio/legal/insurance`
○ `/studio/legal/insurance/[policyId]`
○ `/studio/legal/insurance/[policyId]/edit`
○ `/studio/legal/insurance/new`
● `/studio/legal/ip`
○ `/studio/legal/ip/[markId]`
○ `/studio/legal/ip/[markId]/edit`
○ `/studio/legal/ip/new`
● `/studio/legal/privacy`
● `/studio/legal/privacy/consent`
● `/studio/legal/privacy/datamap`
● `/studio/legal/privacy/dsar`
○ `/studio/legal/privacy/dsar/[requestId]`
○ `/studio/legal/privacy/dsar/[requestId]/edit`
○ `/studio/legal/privacy/dsar/new`

</details>

<details><summary><code>locations</code> · 5 routes</summary>

● `/studio/locations`
○ `/studio/locations/[locationId]`
○ `/studio/locations/[locationId]/edit`
○ `/studio/locations/new`
○ `/studio/locations/picker`

</details>

<details><summary><code>logistics</code> · 11 routes</summary>

○ `/studio/logistics`
● `/studio/logistics/disposition`
● `/studio/logistics/freight`
○ `/studio/logistics/freight/[shipmentId]`
○ `/studio/logistics/freight/[shipmentId]/edit`
● `/studio/logistics/ratecard`
○ `/studio/logistics/ratecard/[itemId]`
○ `/studio/logistics/ratecard/[itemId]/edit`
○ `/studio/logistics/ratecard/new`
● `/studio/logistics/services`
● `/studio/logistics/warehouse`

</details>

<details><summary><code>marketing</code> · 3 routes</summary>

● `/studio/marketing`
○ `/studio/marketing/calendar`
○ `/studio/marketing/onsales`

</details>

<details><summary><code>marketplace</code> · 38 routes</summary>

● `/studio/marketplace`
● `/studio/marketplace/box-office`
○ `/studio/marketplace/box-office/[listId]`
● `/studio/marketplace/box-office/listings`
○ `/studio/marketplace/box-office/listings/[listingId]`
○ `/studio/marketplace/box-office/new`
● `/studio/marketplace/calls`
○ `/studio/marketplace/calls/[callId]`
○ `/studio/marketplace/calls/[callId]/edit`
○ `/studio/marketplace/calls/[callId]/submissions`
○ `/studio/marketplace/calls/[callId]/submissions/[submissionId]`
○ `/studio/marketplace/calls/new`
● `/studio/marketplace/discounts`
○ `/studio/marketplace/discounts/[discountId]`
○ `/studio/marketplace/discounts/new`
○ `/studio/marketplace/discounts/promoters`
○ `/studio/marketplace/discounts/promoters/[promoterId]`
○ `/studio/marketplace/discounts/promoters/new`
● `/studio/marketplace/inquiries`
● `/studio/marketplace/offers`
○ `/studio/marketplace/offers/[offerId]`
○ `/studio/marketplace/offers/new`
● `/studio/marketplace/postings`
○ `/studio/marketplace/postings/[postingId]`
○ `/studio/marketplace/postings/[postingId]/applicants`
○ `/studio/marketplace/postings/[postingId]/applicants/[applicationId]`
○ `/studio/marketplace/postings/[postingId]/edit`
○ `/studio/marketplace/postings/new`
● `/studio/marketplace/reviews`
● `/studio/marketplace/settings`
● `/studio/marketplace/submissions`
● `/studio/marketplace/talent`
○ `/studio/marketplace/talent/[talentId]`
○ `/studio/marketplace/talent/[talentId]/edit`
○ `/studio/marketplace/talent/[talentId]/riders`
○ `/studio/marketplace/talent/[talentId]/riders/[riderId]`
○ `/studio/marketplace/talent/[talentId]/riders/new`
○ `/studio/marketplace/talent/new`

</details>

<details><summary><code>meetings</code> · 8 routes</summary>

● `/studio/meetings`
○ `/studio/meetings/[meetingId]`
○ `/studio/meetings/[meetingId]/edit`
○ `/studio/meetings/[meetingId]/huddle`
○ `/studio/meetings/new`
● `/studio/meetings/notes`
○ `/studio/meetings/notes/[id]`
○ `/studio/meetings/notes/new`

</details>

<details><summary><code>my-work</code> · 1 route</summary>

● `/studio/my-work`

</details>

<details><summary><code>notes</code> · 2 routes</summary>

● `/studio/notes`
○ `/studio/notes/[id]`

</details>

<details><summary><code>operations</code> · 21 routes</summary>

○ `/studio/operations`
● `/studio/operations/daily-log`
○ `/studio/operations/daily-log/[id]`
○ `/studio/operations/daily-log/new`
● `/studio/operations/day-sheets`
○ `/studio/operations/day-sheets/[daySheetId]`
○ `/studio/operations/day-sheets/new`
· `/studio/operations/dispatch`
● `/studio/operations/incidents`
○ `/studio/operations/incidents/[incidentId]`
○ `/studio/operations/incidents/[incidentId]/edit`
○ `/studio/operations/incidents/new`
● `/studio/operations/look-ahead`
● `/studio/operations/maintenance`
○ `/studio/operations/maintenance/[jobId]`
○ `/studio/operations/maintenance/schedules/new`
● `/studio/operations/reservations`
○ `/studio/operations/reservations/[id]`
○ `/studio/operations/reservations/new`
○ `/studio/operations/reservations/tables/new`
● `/studio/operations/schedule`

</details>

<details><summary><code>opportunities</code> · 1 route</summary>

● `/studio/opportunities`

</details>

<details><summary><code>ops</code> · 6 routes</summary>

○ `/studio/ops`
● `/studio/ops/toc`
○ `/studio/ops/toc/changes`
○ `/studio/ops/toc/changes/new`
○ `/studio/ops/toc/problems`
○ `/studio/ops/toc/problems/new`

</details>

<details><summary><code>participants</code> · 13 routes</summary>

○ `/studio/participants`
● `/studio/participants/delegations`
○ `/studio/participants/delegations/[delegationId]`
○ `/studio/participants/delegations/[delegationId]/edit`
○ `/studio/participants/delegations/new`
○ `/studio/participants/entries`
○ `/studio/participants/entries/[entryId]`
○ `/studio/participants/entries/[entryId]/edit`
○ `/studio/participants/entries/new`
● `/studio/participants/visa`
○ `/studio/participants/visa/[caseId]`
○ `/studio/participants/visa/[caseId]/edit`
○ `/studio/participants/visa/new`

</details>

<details><summary><code>people</code> · 26 routes</summary>

○ `/studio/people`
○ `/studio/people/[personId]`
○ `/studio/people/[personId]/assignments`
○ `/studio/people/[personId]/credentials`
○ `/studio/people/[personId]/documents`
○ `/studio/people/[personId]/edit`
○ `/studio/people/[personId]/time`
● `/studio/people/credentials`
○ `/studio/people/credentials/[credentialId]`
○ `/studio/people/credentials/[credentialId]/edit`
○ `/studio/people/credentials/asset-linker`
○ `/studio/people/credentials/new`
● `/studio/people/crew`
○ `/studio/people/crew/[crewId]`
○ `/studio/people/crew/[crewId]/edit`
○ `/studio/people/crew/new`
● `/studio/people/invites`
● `/studio/people/msas`
○ `/studio/people/msas/[id]`
○ `/studio/people/msas/new`
● `/studio/people/offer-letters`
○ `/studio/people/offer-letters/[id]`
○ `/studio/people/offer-letters/[id]/onboarding`
● `/studio/people/roles`
● `/studio/people/teams`
○ `/studio/people/teams/[teamId]`

</details>

<details><summary><code>photos</code> · 2 routes</summary>

● `/studio/photos`
○ `/studio/photos/upload`

</details>

<details><summary><code>pipeline</code> · 2 routes</summary>

● `/studio/pipeline`
○ `/studio/pipeline/[dealId]`

</details>

<details><summary><code>position</code> · 2 routes</summary>

● `/studio/position`
○ `/studio/position/forecast`

</details>

<details><summary><code>procurement</code> · 50 routes</summary>

○ `/studio/procurement`
● `/studio/procurement/catalog`
● `/studio/procurement/compliance`
● `/studio/procurement/itb`
● `/studio/procurement/marketplace`
● `/studio/procurement/network`
● `/studio/procurement/po-change-orders`
○ `/studio/procurement/po-change-orders/[id]`
○ `/studio/procurement/po-change-orders/new`
● `/studio/procurement/prequalification`
○ `/studio/procurement/prequalification/[prequalId]`
○ `/studio/procurement/prequalification/new`
○ `/studio/procurement/prequalification/questionnaires`
○ `/studio/procurement/prequalification/questionnaires/new`
● `/studio/procurement/purchase-orders`
○ `/studio/procurement/purchase-orders/[poId]`
○ `/studio/procurement/purchase-orders/[poId]/checklist`
○ `/studio/procurement/purchase-orders/[poId]/edit`
○ `/studio/procurement/purchase-orders/new`
● `/studio/procurement/receiving`
○ `/studio/procurement/receiving/[id]`
○ `/studio/procurement/receiving/new`
● `/studio/procurement/requisitions`
○ `/studio/procurement/requisitions/[reqId]`
○ `/studio/procurement/requisitions/[reqId]/edit`
○ `/studio/procurement/requisitions/[reqId]/leveling`
○ `/studio/procurement/requisitions/[reqId]/leveling/new`
○ `/studio/procurement/requisitions/new`
● `/studio/procurement/rfqs`
○ `/studio/procurement/rfqs/[rfqId]`
○ `/studio/procurement/rfqs/[rfqId]/publish`
○ `/studio/procurement/rfqs/[rfqId]/responses`
○ `/studio/procurement/rfqs/[rfqId]/responses/[responseId]`
○ `/studio/procurement/rfqs/new`
● `/studio/procurement/scorecard`
○ `/studio/procurement/scorecards`
● `/studio/procurement/sourcing`
● `/studio/procurement/vendors`
○ `/studio/procurement/vendors/[vendorId]`
○ `/studio/procurement/vendors/[vendorId]/edit`
○ `/studio/procurement/vendors/[vendorId]/onboarding`
○ `/studio/procurement/vendors/[vendorId]/pos`
○ `/studio/procurement/vendors/[vendorId]/prequalification`
○ `/studio/procurement/vendors/[vendorId]/prequalification/[prequalId]`
○ `/studio/procurement/vendors/[vendorId]/scorecard`
○ `/studio/procurement/vendors/[vendorId]/submittals`
○ `/studio/procurement/vendors/new`
● `/studio/procurement/wo-broadcasts`
○ `/studio/procurement/wo-broadcasts/[broadcastId]`
○ `/studio/procurement/wo-broadcasts/new`

</details>

<details><summary><code>production</code> · 23 routes</summary>

○ `/studio/production`
○ `/studio/production/av`
● `/studio/production/compounds`
○ `/studio/production/dispatch`
○ `/studio/production/dispatch/[dispatchId]`
● `/studio/production/dispatch/live`
● `/studio/production/equipment`
○ `/studio/production/equipment/utilization`
● `/studio/production/fabrication`
○ `/studio/production/fabrication/[orderId]`
○ `/studio/production/fabrication/[orderId]/edit`
○ `/studio/production/fabrication/new`
● `/studio/production/logistics`
● `/studio/production/rentals`
○ `/studio/production/rentals/[rentalId]`
○ `/studio/production/rentals/[rentalId]/edit`
○ `/studio/production/rentals/availability`
○ `/studio/production/rentals/new`
● `/studio/production/ros`
● `/studio/production/work-orders`
○ `/studio/production/work-orders/[id]`
○ `/studio/production/work-orders/[id]/thread`
○ `/studio/production/work-orders/new`

</details>

<details><summary><code>programs</code> · 22 routes</summary>

● `/studio/programs`
○ `/studio/programs/cases`
○ `/studio/programs/ceremonies`
○ `/studio/programs/ceremonies/[ceremonyId]`
○ `/studio/programs/ceremonies/[ceremonyId]/edit`
○ `/studio/programs/pressconf`
○ `/studio/programs/protocol`
● `/studio/programs/readiness`
○ `/studio/programs/readiness/[exerciseId]`
○ `/studio/programs/readiness/[exerciseId]/edit`
○ `/studio/programs/readiness/new`
● `/studio/programs/reviews`
○ `/studio/programs/reviews/[reviewId]`
○ `/studio/programs/reviews/[reviewId]/edit`
○ `/studio/programs/reviews/new`
● `/studio/programs/risk`
○ `/studio/programs/risk/[riskId]`
○ `/studio/programs/risk/[riskId]/edit`
○ `/studio/programs/risk/new`
○ `/studio/programs/schedule`
○ `/studio/programs/scope`
○ `/studio/programs/sessions`

</details>

<details><summary><code>projects</code> · 35 routes</summary>

● `/studio/projects`
○ `/studio/projects/[projectId]`
○ `/studio/projects/[projectId]/advancing`
○ `/studio/projects/[projectId]/advancing/assignments`
○ `/studio/projects/[projectId]/advancing/assignments/[assignmentId]`
○ `/studio/projects/[projectId]/advancing/assignments/new`
○ `/studio/projects/[projectId]/advancing/packet`
○ `/studio/projects/[projectId]/branding`
○ `/studio/projects/[projectId]/budget`
○ `/studio/projects/[projectId]/crew`
○ `/studio/projects/[projectId]/edit`
○ `/studio/projects/[projectId]/files`
○ `/studio/projects/[projectId]/finance`
○ `/studio/projects/[projectId]/finance/draws`
○ `/studio/projects/[projectId]/guides`
○ `/studio/projects/[projectId]/guides/[persona]`
○ `/studio/projects/[projectId]/guides/[persona]/access`
○ `/studio/projects/[projectId]/members`
○ `/studio/projects/[projectId]/onboarding`
○ `/studio/projects/[projectId]/overview`
○ `/studio/projects/[projectId]/photos`
○ `/studio/projects/[projectId]/portal-preview`
○ `/studio/projects/[projectId]/position/[classCode]/[phase]`
○ `/studio/projects/[projectId]/roadmap`
○ `/studio/projects/[projectId]/schedule`
○ `/studio/projects/[projectId]/sprints`
○ `/studio/projects/[projectId]/sprints/new`
○ `/studio/projects/[projectId]/stage-plots`
○ `/studio/projects/[projectId]/stage-plots/[stagePlotId]`
○ `/studio/projects/[projectId]/stage-plots/[stagePlotId]/edit`
○ `/studio/projects/[projectId]/sustainability`
○ `/studio/projects/[projectId]/tasks`
○ `/studio/projects/[projectId]/timeline`
○ `/studio/projects/[projectId]/tracker`
○ `/studio/projects/new`

</details>

<details><summary><code>proposals</code> · 6 routes</summary>

● `/studio/proposals`
○ `/studio/proposals/[proposalId]`
○ `/studio/proposals/[proposalId]/edit`
○ `/studio/proposals/new`
● `/studio/proposals/templates`
○ `/studio/proposals/templates/[templateId]`

</details>

<details><summary><code>punch</code> · 5 routes</summary>

● `/studio/punch`
○ `/studio/punch/[id]`
○ `/studio/punch/[id]/edit`
○ `/studio/punch/lists`
○ `/studio/punch/new`

</details>

<details><summary><code>reports</code> · 2 routes</summary>

● `/studio/reports`
○ `/studio/reports/[reportId]`

</details>

<details><summary><code>revenue</code> · 3 routes</summary>

● `/studio/revenue/orders`
● `/studio/revenue/payouts`
● `/studio/revenue/transactions`

</details>

<details><summary><code>rfis</code> · 4 routes</summary>

● `/studio/rfis`
○ `/studio/rfis/[id]`
○ `/studio/rfis/[id]/edit`
○ `/studio/rfis/new`

</details>

<details><summary><code>risk</code> · 1 route</summary>

● `/studio/risk`

</details>

<details><summary><code>safety</code> · 39 routes</summary>

● `/studio/safety`
○ `/studio/safety/bcdr`
● `/studio/safety/briefings`
○ `/studio/safety/briefings/[briefingId]`
○ `/studio/safety/briefings/new`
● `/studio/safety/crisis`
○ `/studio/safety/crisis/[alertId]`
○ `/studio/safety/crisis/[alertId]/edit`
○ `/studio/safety/crisis/new`
○ `/studio/safety/cyber-ir`
● `/studio/safety/environmental`
○ `/studio/safety/environmental/[eventId]`
○ `/studio/safety/environmental/[eventId]/edit`
○ `/studio/safety/environmental/new`
● `/studio/safety/guard-tours`
○ `/studio/safety/guard-tours/new`
○ `/studio/safety/incidents`
○ `/studio/safety/incidents/[incidentId]`
● `/studio/safety/lost-found`
● `/studio/safety/major-incident`
○ `/studio/safety/major-incident/[eventId]`
○ `/studio/safety/major-incident/[eventId]/edit`
○ `/studio/safety/major-incident/new`
● `/studio/safety/medical`
○ `/studio/safety/medical/encounters`
○ `/studio/safety/medical/encounters/[encounterId]`
○ `/studio/safety/medical/encounters/[encounterId]/edit`
○ `/studio/safety/medical/encounters/new`
○ `/studio/safety/medical/plan`
● `/studio/safety/osha`
● `/studio/safety/playbooks`
○ `/studio/safety/playbooks/[slug]`
○ `/studio/safety/playbooks/new`
● `/studio/safety/safeguarding`
○ `/studio/safety/safeguarding/[reportId]`
○ `/studio/safety/safeguarding/[reportId]/edit`
○ `/studio/safety/safeguarding/new`
● `/studio/safety/threats`
○ `/studio/safety/threats/new`

</details>

<details><summary><code>sales</code> · 10 routes</summary>

● `/studio/sales`
● `/studio/sales/beos`
○ `/studio/sales/beos/[id]`
○ `/studio/sales/beos/new`
● `/studio/sales/diary`
○ `/studio/sales/diary/[bookingId]`
○ `/studio/sales/diary/[bookingId]/edit`
○ `/studio/sales/diary/new`
○ `/studio/sales/diary/spaces`
○ `/studio/sales/diary/spaces/new`

</details>

<details><summary><code>schedule</code> · 5 routes</summary>

● `/studio/schedule`
● `/studio/schedule/baselines`
○ `/studio/schedule/baselines/[id]`
○ `/studio/schedule/baselines/[id]/gantt`
○ `/studio/schedule/baselines/new`

</details>

<details><summary><code>scheduler</code> · 3 routes</summary>

● `/studio/scheduler`
○ `/studio/scheduler/[eventTypeId]`
○ `/studio/scheduler/new`

</details>

<details><summary><code>services</code> · 4 routes</summary>

● `/studio/services`
● `/studio/services/requests`
○ `/studio/services/requests/[requestId]`
○ `/studio/services/requests/new`

</details>

<details><summary><code>settings</code> · 47 routes</summary>

○ `/studio/settings`
● `/studio/settings/account-managers`
○ `/studio/settings/account-managers/[id]`
○ `/studio/settings/account-managers/new`
● `/studio/settings/advancing`
● `/studio/settings/api`
● `/studio/settings/audit`
● `/studio/settings/billing`
● `/studio/settings/branding`
● `/studio/settings/capabilities`
● `/studio/settings/catalog`
○ `/studio/settings/catalog/[id]`
○ `/studio/settings/catalog/[id]/edit`
○ `/studio/settings/catalog/new`
● `/studio/settings/compliance`
● `/studio/settings/domains`
● `/studio/settings/email-templates`
● `/studio/settings/exports`
● `/studio/settings/governance`
· `/studio/settings/impersonate`
● `/studio/settings/imports`
● `/studio/settings/integrations`
○ `/studio/settings/integrations/[integrationId]`
○ `/studio/settings/integrations/accounting`
○ `/studio/settings/integrations/accounting/[id]`
○ `/studio/settings/integrations/accounting/new`
● `/studio/settings/integrations/marketplace`
○ `/studio/settings/integrations/submissions`
○ `/studio/settings/integrations/submissions/[id]`
● `/studio/settings/integrations/ticketing`
○ `/studio/settings/integrations/ticketing/[connectionId]`
○ `/studio/settings/integrations/ticketing/new`
● `/studio/settings/job-templates`
○ `/studio/settings/job-templates/new`
● `/studio/settings/organization`
○ `/studio/settings/rate-limits`
● `/studio/settings/schema`
○ `/studio/settings/sequences`
○ `/studio/settings/sla-policies`
○ `/studio/settings/sso`
● `/studio/settings/time-clock-zones`
○ `/studio/settings/time-clock-zones/[id]`
○ `/studio/settings/time-clock-zones/new`
● `/studio/settings/usage`
● `/studio/settings/webhooks`
○ `/studio/settings/webhooks/[webhookId]`
○ `/studio/settings/webhooks/new`

</details>

<details><summary><code>site-plans</code> · 6 routes</summary>

● `/studio/site-plans`
○ `/studio/site-plans/[id]`
○ `/studio/site-plans/[id]/edit`
○ `/studio/site-plans/[id]/map`
○ `/studio/site-plans/[id]/markup`
○ `/studio/site-plans/new`

</details>

<details><summary><code>specs</code> · 4 routes</summary>

● `/studio/specs`
○ `/studio/specs/[id]`
○ `/studio/specs/[id]/edit`
○ `/studio/specs/new`

</details>

<details><summary><code>submittals</code> · 4 routes</summary>

● `/studio/submittals`
○ `/studio/submittals/[id]`
○ `/studio/submittals/[id]/edit`
○ `/studio/submittals/new`

</details>

<details><summary><code>subscriptions</code> · 4 routes</summary>

● `/studio/subscriptions`
○ `/studio/subscriptions/[subscriptionId]`
○ `/studio/subscriptions/[subscriptionId]/transitions`
○ `/studio/subscriptions/new`

</details>

<details><summary><code>sustainability</code> · 5 routes</summary>

● `/studio/sustainability`
○ `/studio/sustainability/carbon`
○ `/studio/sustainability/carbon/[metricId]`
○ `/studio/sustainability/carbon/[metricId]/edit`
○ `/studio/sustainability/carbon/new`

</details>

<details><summary><code>takeoffs</code> · 4 routes</summary>

● `/studio/takeoffs`
○ `/studio/takeoffs/[id]`
○ `/studio/takeoffs/[id]/edit`
○ `/studio/takeoffs/new`

</details>

<details><summary><code>tasks</code> · 4 routes</summary>

● `/studio/tasks`
○ `/studio/tasks/[taskId]`
○ `/studio/tasks/[taskId]/edit`
○ `/studio/tasks/new`

</details>

<details><summary><code>templates</code> · 2 routes</summary>

● `/studio/templates`
○ `/studio/templates/[templateId]/new`

</details>

<details><summary><code>transmittals</code> · 3 routes</summary>

● `/studio/transmittals`
○ `/studio/transmittals/[id]`
○ `/studio/transmittals/new`

</details>

<details><summary><code>transport</code> · 11 routes</summary>

● `/studio/transport`
○ `/studio/transport/ad`
○ `/studio/transport/ad/[manifestId]`
○ `/studio/transport/ad/[manifestId]/edit`
○ `/studio/transport/ad/new`
● `/studio/transport/dispatch`
○ `/studio/transport/dispatch/[runId]`
○ `/studio/transport/dispatch/[runId]/edit`
○ `/studio/transport/dispatch/new`
○ `/studio/transport/fleets`
○ `/studio/transport/workforce`

</details>

<details><summary><code>trash</code> · 1 route</summary>

● `/studio/trash`

</details>

<details><summary><code>triage</code> · 1 route</summary>

● `/studio/triage`

</details>

<details><summary><code>venues</code> · 13 routes</summary>

● `/studio/venues`
○ `/studio/venues/[venueId]`
○ `/studio/venues/[venueId]/build`
○ `/studio/venues/[venueId]/certifications`
○ `/studio/venues/[venueId]/closeout`
○ `/studio/venues/[venueId]/design`
○ `/studio/venues/[venueId]/edit`
○ `/studio/venues/[venueId]/handover`
○ `/studio/venues/[venueId]/ros`
○ `/studio/venues/[venueId]/vop`
○ `/studio/venues/[venueId]/zones`
○ `/studio/venues/new`
○ `/studio/venues/training`

</details>

<details><summary><code>warranties</code> · 2 routes</summary>

● `/studio/warranties`
○ `/studio/warranties/new`

</details>

<details><summary><code>workforce</code> · 42 routes</summary>

● `/studio/workforce`
● `/studio/workforce/badges`
○ `/studio/workforce/badges/[badgeId]`
○ `/studio/workforce/badges/new`
○ `/studio/workforce/call-sheets`
○ `/studio/workforce/call-sheets/[memberId]`
○ `/studio/workforce/contractors`
○ `/studio/workforce/contractors/[contractorId]`
○ `/studio/workforce/contractors/[contractorId]/edit`
○ `/studio/workforce/contractors/new`
● `/studio/workforce/deployment`
○ `/studio/workforce/deployment/[deploymentId]`
○ `/studio/workforce/deployment/[deploymentId]/edit`
○ `/studio/workforce/deployment/new`
● `/studio/workforce/forecast`
○ `/studio/workforce/forecast/[id]`
○ `/studio/workforce/housing`
● `/studio/workforce/onboarding`
○ `/studio/workforce/onboarding/[flowId]`
○ `/studio/workforce/onboarding/new`
○ `/studio/workforce/planning`
● `/studio/workforce/recognition`
○ `/studio/workforce/recognition/new`
● `/studio/workforce/rosters`
○ `/studio/workforce/rosters/[rosterId]`
○ `/studio/workforce/rosters/[rosterId]/edit`
○ `/studio/workforce/rosters/new`
○ `/studio/workforce/services`
● `/studio/workforce/shift-swaps`
○ `/studio/workforce/staff`
○ `/studio/workforce/staff/[staffId]`
○ `/studio/workforce/staff/[staffId]/edit`
○ `/studio/workforce/staff/new`
● `/studio/workforce/time-off`
● `/studio/workforce/training`
○ `/studio/workforce/training/[courseId]`
○ `/studio/workforce/training/[courseId]/edit`
○ `/studio/workforce/uniforms`
○ `/studio/workforce/volunteers`
○ `/studio/workforce/volunteers/[volunteerId]`
○ `/studio/workforce/volunteers/[volunteerId]/edit`
○ `/studio/workforce/volunteers/new`

</details>

<details><summary><code>xpms</code> · 9 routes</summary>

● `/studio/xpms`
● `/studio/xpms/atoms`
● `/studio/xpms/classes`
○ `/studio/xpms/classes/[code]`
● `/studio/xpms/codebook`
● `/studio/xpms/phases`
● `/studio/xpms/provenance`
● `/studio/xpms/tiers`
● `/studio/xpms/variance`

</details>

<details><summary><code>·root</code> · 1 route</summary>

● `/studio`

</details>

## COMPVSS — Field PWA (`/m`)

75 routes — ● 57 nav · ○ 17 linked · ⚠ 0 orphan

<details><summary><code>activity</code> · 1 route</summary>

● `/m/activity`

</details>

<details><summary><code>advances</code> · 3 routes</summary>

● `/m/advances`
○ `/m/advances/[assignmentId]`
○ `/m/advances/new`

</details>

<details><summary><code>alerts</code> · 1 route</summary>

● `/m/alerts`

</details>

<details><summary><code>assets</code> · 1 route</summary>

● `/m/assets`

</details>

<details><summary><code>catalog</code> · 1 route</summary>

● `/m/catalog`

</details>

<details><summary><code>check-in</code> · 4 routes</summary>

● `/m/check-in`
○ `/m/check-in/batch`
○ `/m/check-in/manual`
○ `/m/check-in/scan/[slug]`

</details>

<details><summary><code>clock</code> · 1 route</summary>

● `/m/clock`

</details>

<details><summary><code>coc</code> · 1 route</summary>

● `/m/coc`

</details>

<details><summary><code>companies</code> · 1 route</summary>

● `/m/companies`

</details>

<details><summary><code>connections</code> · 1 route</summary>

● `/m/connections`

</details>

<details><summary><code>daily-log</code> · 2 routes</summary>

● `/m/daily-log`
○ `/m/daily-log/new`

</details>

<details><summary><code>directory</code> · 1 route</summary>

● `/m/directory`

</details>

<details><summary><code>docs</code> · 2 routes</summary>

● `/m/docs`
○ `/m/docs/[id]`

</details>

<details><summary><code>documents</code> · 2 routes</summary>

● `/m/documents`
● `/m/documents/new`

</details>

<details><summary><code>door</code> · 1 route</summary>

● `/m/door`

</details>

<details><summary><code>emergency</code> · 1 route</summary>

● `/m/emergency`

</details>

<details><summary><code>engagement</code> · 1 route</summary>

● `/m/engagement`

</details>

<details><summary><code>expenses</code> · 2 routes</summary>

● `/m/expenses`
● `/m/expenses/new`

</details>

<details><summary><code>feed</code> · 1 route</summary>

● `/m/feed`

</details>

<details><summary><code>guide</code> · 1 route</summary>

● `/m/guide`

</details>

<details><summary><code>handover</code> · 2 routes</summary>

● `/m/handover`
○ `/m/handover/new`

</details>

<details><summary><code>inbox</code> · 3 routes</summary>

● `/m/inbox`
○ `/m/inbox/[roomId]`
● `/m/inbox/new`

</details>

<details><summary><code>incident</code> · 2 routes</summary>

● `/m/incident`
○ `/m/incident/new`

</details>

<details><summary><code>incidents</code> · 3 routes</summary>

● `/m/incidents`
○ `/m/incidents/[incidentId]`
○ `/m/incidents/new`

</details>

<details><summary><code>inventory</code> · 2 routes</summary>

● `/m/inventory`
● `/m/inventory/scan`

</details>

<details><summary><code>jobs</code> · 1 route</summary>

● `/m/jobs`

</details>

<details><summary><code>lost-found</code> · 1 route</summary>

● `/m/lost-found`

</details>

<details><summary><code>market</code> · 1 route</summary>

● `/m/market`

</details>

<details><summary><code>mileage</code> · 2 routes</summary>

● `/m/mileage`
● `/m/mileage/new`

</details>

<details><summary><code>more</code> · 1 route</summary>

● `/m/more`

</details>

<details><summary><code>my-work</code> · 1 route</summary>

● `/m/my-work`

</details>

<details><summary><code>notifications</code> · 1 route</summary>

● `/m/notifications`

</details>

<details><summary><code>onboarding</code> · 2 routes</summary>

● `/m/onboarding`
○ `/m/onboarding/[assignmentId]`

</details>

<details><summary><code>pass</code> · 1 route</summary>

● `/m/pass`

</details>

<details><summary><code>profile</code> · 1 route</summary>

● `/m/profile`

</details>

<details><summary><code>punch</code> · 1 route</summary>

● `/m/punch`

</details>

<details><summary><code>referrals</code> · 1 route</summary>

● `/m/referrals`

</details>

<details><summary><code>requests</code> · 1 route</summary>

● `/m/requests`

</details>

<details><summary><code>requisitions</code> · 2 routes</summary>

● `/m/requisitions`
● `/m/requisitions/new`

</details>

<details><summary><code>scan</code> · 1 route</summary>

● `/m/scan`

</details>

<details><summary><code>schedule</code> · 1 route</summary>

● `/m/schedule`

</details>

<details><summary><code>settings</code> · 5 routes</summary>

● `/m/settings`
· `/m/settings/account`
○ `/m/settings/changelog`
● `/m/settings/team`
● `/m/settings/team/invite`

</details>

<details><summary><code>spaces</code> · 2 routes</summary>

● `/m/spaces`
○ `/m/spaces/[id]`

</details>

<details><summary><code>tasks</code> · 3 routes</summary>

● `/m/tasks`
○ `/m/tasks/[taskId]`
● `/m/tasks/new`

</details>

<details><summary><code>time</code> · 1 route</summary>

● `/m/time`

</details>

<details><summary><code>time-off</code> · 2 routes</summary>

● `/m/time-off`
○ `/m/time-off/new`

</details>

<details><summary><code>timesheets</code> · 1 route</summary>

● `/m/timesheets`

</details>

<details><summary><code>·root</code> · 1 route</summary>

● `/m`

</details>

## GVTEWAY — External Portal (`/p/[slug]`)

156 routes — ● 129 nav · ○ 23 linked · ⚠ 0 orphan

<details><summary><code>[slug]</code> · 2 routes</summary>

○ `/p/lists/[slug]`
○ `/p/scenes/[slug]`

</details>

<details><summary><code>advancing</code> · 1 route</summary>

● `/p/[slug]/advancing`

</details>

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

<details><summary><code>crew</code> · 15 routes</summary>

● `/p/[slug]/crew`
● `/p/[slug]/crew/advances`
● `/p/[slug]/crew/call-sheet`
● `/p/[slug]/crew/chat`
● `/p/[slug]/crew/directory`
● `/p/[slug]/crew/docs`
○ `/p/[slug]/crew/docs/new`
● `/p/[slug]/crew/feed`
● `/p/[slug]/crew/learning`
● `/p/[slug]/crew/privacy`
● `/p/[slug]/crew/schedule`
● `/p/[slug]/crew/time`
● `/p/[slug]/crew/time-off`
○ `/p/[slug]/crew/time-off/new`
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

<details><summary><code>e</code> · 1 route</summary>

● `/p/welcome`

</details>

<details><summary><code>er</code> · 1 route</summary>

● `/p/discover`

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

<details><summary><code>ity</code> · 1 route</summary>

● `/p/community`

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

<details><summary><code>onboarding</code> · 1 route</summary>

· `/p/[slug]/onboarding/[assignmentId]`

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

<details><summary><code>settings</code> · 1 route</summary>

● `/p/[slug]/settings/notifications`

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

<details><summary><code>t</code> · 1 route</summary>

● `/p/account`

</details>

<details><summary><code>tasks</code> · 1 route</summary>

● `/p/[slug]/tasks`

</details>

<details><summary><code>vendor</code> · 17 routes</summary>

● `/p/[slug]/vendor`
● `/p/[slug]/vendor/chat`
● `/p/[slug]/vendor/credentials`
● `/p/[slug]/vendor/directory`
● `/p/[slug]/vendor/docs`
○ `/p/[slug]/vendor/docs/new`
● `/p/[slug]/vendor/equipment-pull-list`
● `/p/[slug]/vendor/feed`
● `/p/[slug]/vendor/invoices`
● `/p/[slug]/vendor/privacy`
● `/p/[slug]/vendor/purchase-orders`
● `/p/[slug]/vendor/schedule`
● `/p/[slug]/vendor/submissions`
● `/p/[slug]/vendor/time-off`
○ `/p/[slug]/vendor/time-off/new`
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

<details><summary><code>·root</code> · 7 routes</summary>

· `/p`
· `/p/[slug]`
● `/p/lists`
● `/p/onsite`
● `/p/saved`
● `/p/scenes`
· `/p/select`

</details>

## LEG3ND — Knowledge Shell (`/legend`)

43 routes — ● 21 nav · ○ 22 linked · ⚠ 0 orphan

<details><summary><code>architecture</code> · 1 route</summary>

● `/legend/architecture`

</details>

<details><summary><code>badges</code> · 1 route</summary>

● `/legend/badges`

</details>

<details><summary><code>certifications</code> · 3 routes</summary>

● `/legend/certifications`
○ `/legend/certifications/[holderId]`
○ `/legend/certifications/[holderId]/verify`

</details>

<details><summary><code>community</code> · 3 routes</summary>

● `/legend/community`
○ `/legend/community/[postId]`
● `/legend/community/members`

</details>

<details><summary><code>compliance</code> · 1 route</summary>

● `/legend/compliance`

</details>

<details><summary><code>console</code> · 1 route</summary>

● `/legend/console`

</details>

<details><summary><code>crew</code> · 1 route</summary>

● `/legend/crew`

</details>

<details><summary><code>engine</code> · 7 routes</summary>

● `/legend/engine`
○ `/legend/engine/rules`
○ `/legend/engine/rules/[id]`
○ `/legend/engine/rules/[id]/edit`
○ `/legend/engine/rules/new`
○ `/legend/engine/runs`
○ `/legend/engine/runs/[id]`

</details>

<details><summary><code>for-institutions</code> · 1 route</summary>

● `/legend/for-institutions`

</details>

<details><summary><code>leaderboard</code> · 1 route</summary>

● `/legend/leaderboard`

</details>

<details><summary><code>learn</code> · 4 routes</summary>

● `/legend/learn`
○ `/legend/learn/[course]`
○ `/legend/learn/[course]/lesson/[id]`
○ `/legend/learn/[course]/quiz/[id]`

</details>

<details><summary><code>live</code> · 1 route</summary>

● `/legend/live`

</details>

<details><summary><code>my-learning</code> · 1 route</summary>

● `/legend/my-learning`

</details>

<details><summary><code>path</code> · 1 route</summary>

● `/legend/path`

</details>

<details><summary><code>profile</code> · 1 route</summary>

● `/legend/profile`

</details>

<details><summary><code>progress</code> · 1 route</summary>

● `/legend/progress`

</details>

<details><summary><code>resources</code> · 7 routes</summary>

● `/legend/resources`
○ `/legend/resources/[id]`
○ `/legend/resources/[id]/edit`
○ `/legend/resources/collections`
○ `/legend/resources/collections/[collectionId]`
○ `/legend/resources/collections/new`
○ `/legend/resources/new`

</details>

<details><summary><code>signage</code> · 5 routes</summary>

● `/legend/signage`
○ `/legend/signage/[signId]`
○ `/legend/signage/[signId]/edit`
○ `/legend/signage/[signId]/placements/new`
○ `/legend/signage/new`

</details>

<details><summary><code>store</code> · 1 route</summary>

● `/legend/store`

</details>

<details><summary><code>·root</code> · 1 route</summary>

● `/legend`

</details>

## GVTEWAY — Public / Marketing

93 routes — ● 33 nav · ○ 51 linked · ⚠ 0 orphan

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

<details><summary><code>events</code> · 3 routes</summary>

● `/events`
○ `/events/[slug]`
○ `/events/[slug]/tickets`

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

<details><summary><code>marketplace</code> · 28 routes</summary>

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
○ `/marketplace/work-orders`
○ `/marketplace/work-orders/[id]`

</details>

<details><summary><code>partners</code> · 1 route</summary>

● `/partners`

</details>

<details><summary><code>pitch</code> · 1 route</summary>

· `/pitch`

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

<details><summary><code>solutions</code> · 6 routes</summary>

● `/solutions`
○ `/solutions/[industry]`
● `/solutions/atlvs`
● `/solutions/compvss`
● `/solutions/gvteway`
● `/solutions/legend`

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

14 routes — ● 2 nav · ○ 0 linked · ⚠ 0 orphan

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

<details><summary><code>mfa</code> · 2 routes</summary>

· `/mfa/challenge`
· `/mfa/recovery`

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

## API surface (`/api/v1`) — 156 route handlers


<details><summary><code>/api/v1/accreditation</code> · 1</summary>

- `/api/v1/accreditation/scan`

</details>

<details><summary><code>/api/v1/admin</code> · 2</summary>

- `/api/v1/admin/impersonate`
- `/api/v1/admin/sandbox-user`

</details>

<details><summary><code>/api/v1/advance-batches</code> · 1</summary>

- `/api/v1/advance-batches/[id]`

</details>

<details><summary><code>/api/v1/ai</code> · 6</summary>

- `/api/v1/ai/chat`
- `/api/v1/ai/conversations`
- `/api/v1/ai/conversations/[id]`
- `/api/v1/ai/copilot`
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

<details><summary><code>/api/v1/compliance</code> · 2</summary>

- `/api/v1/compliance`
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

<details><summary><code>/api/v1/handovers</code> · 2</summary>

- `/api/v1/handovers`
- `/api/v1/handovers/[id]`

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

<details><summary><code>/api/v1/inbox</code> · 1</summary>

- `/api/v1/inbox`

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

<details><summary><code>/api/v1/job-templates</code> · 1</summary>

- `/api/v1/job-templates`

</details>

<details><summary><code>/api/v1/locations</code> · 1</summary>

- `/api/v1/locations`

</details>

<details><summary><code>/api/v1/marketplace-listings</code> · 2</summary>

- `/api/v1/marketplace-listings`
- `/api/v1/marketplace-listings/[id]`

</details>

<details><summary><code>/api/v1/me</code> · 9</summary>

- `/api/v1/me`
- `/api/v1/me/api-keys`
- `/api/v1/me/api-keys/[id]`
- `/api/v1/me/delete`
- `/api/v1/me/entitlements`
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

<details><summary><code>/api/v1/pay-periods</code> · 2</summary>

- `/api/v1/pay-periods`
- `/api/v1/pay-periods/[periodId]/compile`

</details>

<details><summary><code>/api/v1/payroll-runs</code> · 3</summary>

- `/api/v1/payroll-runs/[runId]/export`
- `/api/v1/payroll-runs/[runId]/pdf`
- `/api/v1/payroll-runs/[runId]/state-xml`

</details>

<details><summary><code>/api/v1/privacy</code> · 1</summary>

- `/api/v1/privacy/dsar`

</details>

<details><summary><code>/api/v1/procurement</code> · 1</summary>

- `/api/v1/procurement/vendors/[vendorId]/rfp`

</details>

<details><summary><code>/api/v1/projects</code> · 11</summary>

- `/api/v1/projects`
- `/api/v1/projects/[projectId]`
- `/api/v1/projects/[projectId]/advance-book`
- `/api/v1/projects/[projectId]/advance-packets`
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

<details><summary><code>/api/v1/scorecard</code> · 1</summary>

- `/api/v1/scorecard`

</details>

<details><summary><code>/api/v1/setup</code> · 1</summary>

- `/api/v1/setup`

</details>

<details><summary><code>/api/v1/share-links</code> · 2</summary>

- `/api/v1/share-links`
- `/api/v1/share-links/[id]`

</details>

<details><summary><code>/api/v1/shift-notes</code> · 1</summary>

- `/api/v1/shift-notes`

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

<details><summary><code>/api/v1/stripe</code> · 4</summary>

- `/api/v1/stripe/checkout`
- `/api/v1/stripe/connect/onboarding`
- `/api/v1/stripe/credits-checkout`
- `/api/v1/stripe/portal`

</details>

<details><summary><code>/api/v1/sub-invoices</code> · 1</summary>

- `/api/v1/sub-invoices`

</details>

<details><summary><code>/api/v1/tasks</code> · 2</summary>

- `/api/v1/tasks/[taskId]/comments`
- `/api/v1/tasks/[taskId]/events`

</details>

<details><summary><code>/api/v1/telemetry</code> · 1</summary>

- `/api/v1/telemetry/marketing`

</details>

<details><summary><code>/api/v1/time</code> · 4</summary>

- `/api/v1/time/clock`
- `/api/v1/time/corrections`
- `/api/v1/time/corrections/[id]`
- `/api/v1/time/entries/[id]`

</details>

<details><summary><code>/api/v1/timesheets</code> · 2</summary>

- `/api/v1/timesheets/[id]/post`
- `/api/v1/timesheets/[id]/submit`

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

<details><summary><code>/api/v1/work-orders</code> · 3</summary>

- `/api/v1/work-orders`
- `/api/v1/work-orders/[id]`
- `/api/v1/work-orders/[id]/messages`

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
