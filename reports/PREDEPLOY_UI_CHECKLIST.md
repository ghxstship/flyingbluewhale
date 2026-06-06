# ATLVS — Master Pre-Deployment UI Checklist

**Generated:** 2026-06-06 · **Project:** flyingbluewhale (`xrovijzjbyssajhtwvas`) · **Total UI pages:** 967

Every `page.tsx` in `src/app` is enumerated below with its URL route and validation status. This is the living pre-deployment gate — we keep filling it until every page is validated in writing.

**Coverage layers:** (1) render — this checklist, **962/967 pages → HTTP 200** as the authed owner. (2) interactive/functional — the Playwright suite, **515 functional+interactive tests passing**, see [E2E_PLAYWRIGHT_COVERAGE.md](E2E_PLAYWRIGHT_COVERAGE.md) (incl. `console-core-flows` 7/7). (3) `/m` write paths — compvss smoke (92/92 + 28/28).

## Methodology / legend

- **✅ 200** — authenticated HTTP sweep (`scripts/ui-http-sweep.mjs`, as org owner `casa.wynwood@atlvs.pro`) returned HTTP 200: the page renders server-side without 404/500/redirect.
- **🖱 interactive** — driven in the real browser this session (clicks/forms/state transitions), see `BROWSER_E2E_CASA_WYNWOOD.md`.
- **✅ smoke** — `/m` pages validated by `scripts/compvss-smoke.mjs` (92/92 unique-title renders) + `compvss-actions-smoke.mjs` (28/28 RLS mutations).
- **↪︎ 3xx** — redirect (usually auth/persona gating or a canonical redirect); expected for many gated routes.
- **❌ 404/5xx** — needs attention. **⚠︎ err** — request error/timeout.
- **(param=\_)** — dynamic route swept with a placeholder param (no seeded instance); status reflects the placeholder, re-verify with a real id.

## Summary

| Shell                       |   Pages | Static | Dynamic | Notes |
| --------------------------- | ------: | -----: | ------: | ----- |
| Auth                        |      13 |      8 |       5 |       |
| Marketing (public, unauth)  |      75 |     52 |      23 |       |
| Personal (/me)              |      23 |     21 |       2 |       |
| Platform console (/console) |     633 |    375 |     258 |       |
| GVTEWAY portal (/p)         |     123 |      0 |     123 |       |
| COMPVSS mobile (/m)         |      74 |     54 |      20 |       |
| Root / misc                 |      26 |     11 |      15 |       |
| **Total**                   | **967** |        |         |       |

**Sweep progress:** 967/967 routes swept · status breakdown {"200":962,"404":5}

## Verdict

**962/967 pages return HTTP 200** as the authenticated org owner. The 5 non-200 below are all **expected** (dynamic routes needing a specific valid token/id that has no seeded instance) — none is a page defect. **No real render/RLS failure exists across the 967-page UI surface.**

### Non-200 triage (all expected)

| Route                   | Tested                             | Status | Why (not a bug)                                            |
| ----------------------- | ---------------------------------- | ------ | ---------------------------------------------------------- |
| `/m/driver/run/[runId]` | `/m/driver/run/_`                  | 404    | needs a real dispatch run id; placeholder `_` → 404        |
| `/forms/[slug]`         | `/forms/casa-wynwood-la-corriente` | 404    | public form-by-slug; project slug isn't a form slug → 404  |
| `/msa/[token]/print`    | `/msa/_/print`                     | 404    | public MSA print needs a valid signing token → 404 on `_`  |
| `/offer/[token]/print`  | `/offer/_/print`                   | 404    | public offer-letter print needs a valid token → 404 on `_` |
| `/proposals/[token]`    | `/proposals/_`                     | 404    | public proposal share needs a valid token → 404 on `_`     |

## Auth — 13 pages

| Route                     | Purpose          | Validation              |
| ------------------------- | ---------------- | ----------------------- |
| `/accept-invite/[token]`  | Detail (dynamic) | ✅ 200 · (param=\_)     |
| `/forgot-password`        | Forgot Password  | ✅ 200                  |
| `/login`                  | Login            | ✅ 200 · 🖱 interactive |
| `/magic-link`             | Magic Link       | ✅ 200                  |
| `/magic-link/[token]`     | Detail (dynamic) | ✅ 200 · (param=\_)     |
| `/mfa/challenge`          | Challenge        | ✅ 200                  |
| `/onboarding/org`         | Org              | ✅ 200                  |
| `/reset-password`         | Reset Password   | ✅ 200                  |
| `/reset-password/[token]` | Detail (dynamic) | ✅ 200 · (param=\_)     |
| `/signup`                 | Signup           | ✅ 200                  |
| `/sso/[provider]`         | Detail (dynamic) | ✅ 200 · (param=\_)     |
| `/verify-email`           | Verify Email     | ✅ 200                  |
| `/verify-email/[token]`   | Detail (dynamic) | ✅ 200 · (param=\_)     |

## Marketing (public, unauth) — 75 pages

| Route                            | Purpose             | Validation              |
| -------------------------------- | ------------------- | ----------------------- |
| `/`                              | Home                | ✅ 200                  |
| `/about`                         | About               | ✅ 200                  |
| `/ai`                            | Ai                  | ✅ 200                  |
| `/ai/[slug]`                     | Detail (dynamic)    | ✅ 200                  |
| `/alternatives`                  | Alternatives        | ✅ 200                  |
| `/alternatives/[competitor]`     | Detail (dynamic)    | ✅ 200 · (param=\_)     |
| `/blog`                          | Blog                | ✅ 200                  |
| `/blog/[slug]`                   | Detail (dynamic)    | ✅ 200                  |
| `/brand-kit`                     | Brand Kit           | ✅ 200                  |
| `/brand-kit/logo-kit`            | Logo Kit            | ✅ 200                  |
| `/careers`                       | Careers             | ✅ 200                  |
| `/changelog`                     | Changelog           | ✅ 200                  |
| `/community`                     | Community           | ✅ 200                  |
| `/community/[slug]`              | Detail (dynamic)    | ✅ 200                  |
| `/compare`                       | Compare             | ✅ 200                  |
| `/compare/[competitor]`          | Detail (dynamic)    | ✅ 200 · (param=\_)     |
| `/contact`                       | Contact             | ✅ 200                  |
| `/customers`                     | Customers           | ✅ 200                  |
| `/customers/[slug]`              | Detail (dynamic)    | ✅ 200                  |
| `/demo`                          | Demo                | ✅ 200                  |
| `/demo/[persona]`                | Detail (dynamic)    | ✅ 200                  |
| `/docs`                          | Docs                | ✅ 200                  |
| `/es-ES`                         | Es ES               | ✅ 200                  |
| `/features`                      | Features            | ✅ 200                  |
| `/features/[module]`             | Detail (dynamic)    | ✅ 200 · (param=\_)     |
| `/features/[module]/[industry]`  | Detail (dynamic)    | ✅ 200 · (param=\_)     |
| `/glossary`                      | Glossary            | ✅ 200                  |
| `/glossary/[slug]`               | Detail (dynamic)    | ✅ 200                  |
| `/guides`                        | Guides              | ✅ 200                  |
| `/guides/[slug]`                 | Detail (dynamic)    | ✅ 200                  |
| `/help`                          | Help                | ✅ 200                  |
| `/integrations`                  | Integrations        | ✅ 200                  |
| `/integrations/[slug]`           | Detail (dynamic)    | ✅ 200                  |
| `/integrations/partners`         | Partners            | ✅ 200                  |
| `/integrations/partners/[slug]`  | Detail (dynamic)    | ✅ 200                  |
| `/integrations/submit`           | Submit              | ✅ 200                  |
| `/integrations/submit/thanks`    | Thanks              | ✅ 200                  |
| `/legal/dpa`                     | Dpa                 | ✅ 200                  |
| `/legal/privacy`                 | Privacy             | ✅ 200                  |
| `/legal/sla`                     | Sla                 | ✅ 200                  |
| `/legal/terms`                   | Terms               | ✅ 200                  |
| `/marketplace`                   | Marketplace         | ✅ 200 · 🖱 interactive |
| `/marketplace/agencies`          | Agencies            | ✅ 200                  |
| `/marketplace/agencies/[handle]` | Detail (dynamic)    | ✅ 200 · (param=\_)     |
| `/marketplace/calendar`          | Calendar            | ✅ 200                  |
| `/marketplace/calls`             | Calls               | ✅ 200                  |
| `/marketplace/calls/[slug]`      | Detail (dynamic)    | ✅ 200                  |
| `/marketplace/crew`              | Crew                | ✅ 200                  |
| `/marketplace/crew/[handle]`     | Detail (dynamic)    | ✅ 200 · (param=\_)     |
| `/marketplace/gigs`              | Gigs                | ✅ 200                  |
| `/marketplace/gigs/[slug]`       | Detail (dynamic)    | ✅ 200                  |
| `/marketplace/rfqs`              | Rfqs                | ✅ 200                  |
| `/marketplace/rfqs/[slug]`       | Detail (dynamic)    | ✅ 200                  |
| `/marketplace/talent`            | Talent              | ✅ 200 · 🖱 interactive |
| `/marketplace/talent/[handle]`   | Detail (dynamic)    | ✅ 200 · (param=\_)     |
| `/marketplace/vendors`           | Vendors             | ✅ 200                  |
| `/marketplace/vendors/[handle]`  | Detail (dynamic)    | ✅ 200 · (param=\_)     |
| `/partners`                      | Partners            | ✅ 200                  |
| `/press`                         | Press               | ✅ 200                  |
| `/pricing`                       | Pricing             | ✅ 200                  |
| `/pt-BR`                         | Pt BR               | ✅ 200                  |
| `/roadmap`                       | Roadmap             | ✅ 200                  |
| `/solutions`                     | Solutions           | ✅ 200                  |
| `/solutions/[industry]`          | Detail (dynamic)    | ✅ 200 · (param=\_)     |
| `/solutions/atlvs`               | Atlvs               | ✅ 200                  |
| `/solutions/compvss`             | Compvss             | ✅ 200                  |
| `/solutions/gvteway`             | Gvteway             | ✅ 200                  |
| `/status`                        | Status              | ✅ 200                  |
| `/teams`                         | Teams               | ✅ 200                  |
| `/teams/[role]`                  | Detail (dynamic)    | ✅ 200 · (param=\_)     |
| `/templates`                     | Templates           | ✅ 200                  |
| `/templates/[slug]`              | Detail (dynamic)    | ✅ 200                  |
| `/tools`                         | Tools               | ✅ 200                  |
| `/tools/capacity-calculator`     | Capacity Calculator | ✅ 200                  |
| `/tools/per-diem-calculator`     | Per Diem Calculator | ✅ 200                  |

## Personal (/me) — 23 pages

| Route                              | Purpose          | Validation          |
| ---------------------------------- | ---------------- | ------------------- |
| `/me`                              | Me               | ✅ 200              |
| `/me/applications`                 | Applications     | ✅ 200              |
| `/me/applications/[applicationId]` | Detail (dynamic) | ✅ 200 · (param=\_) |
| `/me/availability`                 | Availability     | ✅ 200              |
| `/me/crew`                         | Crew             | ✅ 200              |
| `/me/notifications`                | Notifications    | ✅ 200              |
| `/me/notifications/inbox`          | Inbox            | ✅ 200              |
| `/me/notifications/push`           | Push             | ✅ 200              |
| `/me/offers`                       | Offers           | ✅ 200              |
| `/me/organizations`                | Organizations    | ✅ 200              |
| `/me/preferences`                  | Preferences      | ✅ 200              |
| `/me/privacy`                      | Privacy          | ✅ 200              |
| `/me/profile`                      | Profile          | ✅ 200              |
| `/me/reviews`                      | Reviews          | ✅ 200              |
| `/me/saved-searches`               | Saved Searches   | ✅ 200              |
| `/me/security`                     | Security         | ✅ 200              |
| `/me/security/two-factor`          | Two Factor       | ✅ 200              |
| `/me/settings`                     | Settings         | ✅ 200              |
| `/me/settings/appearance`          | Appearance       | ✅ 200              |
| `/me/submissions`                  | Submissions      | ✅ 200              |
| `/me/submissions/[submissionId]`   | Detail (dynamic) | ✅ 200 · (param=\_) |
| `/me/talent`                       | Talent           | ✅ 200              |
| `/me/tickets`                      | Tickets          | ✅ 200              |

## Platform console (/console) — 633 pages

| Route                                                                  | Purpose          | Validation                           |
| ---------------------------------------------------------------------- | ---------------- | ------------------------------------ |
| `/console`                                                             | Console          | ✅ 200 · 🖱 interactive              |
| `/console/accommodation`                                               | Accommodation    | ✅ 200                               |
| `/console/accommodation/blocks`                                        | Blocks           | ✅ 200                               |
| `/console/accommodation/blocks/[blockId]`                              | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/accommodation/blocks/[blockId]/edit`                         | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/accommodation/blocks/new`                                    | Create form      | ✅ 200                               |
| `/console/accommodation/village`                                       | Village          | ✅ 200                               |
| `/console/accreditation`                                               | Accreditation    | ✅ 200                               |
| `/console/accreditation/categories`                                    | Categories       | ✅ 200                               |
| `/console/accreditation/categories/[categoryId]`                       | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/accreditation/categories/[categoryId]/edit`                  | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/accreditation/categories/new`                                | Create form      | ✅ 200                               |
| `/console/accreditation/changes`                                       | Changes          | ✅ 200                               |
| `/console/accreditation/changes/[changeId]`                            | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/accreditation/changes/[changeId]/edit`                       | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/accreditation/changes/new`                                   | Create form      | ✅ 200                               |
| `/console/accreditation/policy`                                        | Policy           | ✅ 200                               |
| `/console/accreditation/print`                                         | Print            | ✅ 200                               |
| `/console/accreditation/print/sheet`                                   | Sheet            | ✅ 200                               |
| `/console/accreditation/scans`                                         | Scans            | ✅ 200                               |
| `/console/accreditation/vetting`                                       | Vetting          | ✅ 200                               |
| `/console/accreditation/vetting/[applicationId]`                       | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/accreditation/vetting/[applicationId]/edit`                  | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/accreditation/zones`                                         | Zones            | ✅ 200                               |
| `/console/action-items`                                                | Action Items     | ✅ 200                               |
| `/console/agency`                                                      | Agency           | ✅ 200                               |
| `/console/agency/commissions`                                          | Commissions      | ✅ 200                               |
| `/console/agency/roster`                                               | Roster           | ✅ 200                               |
| `/console/agency/roster/[agencyArtistId]`                              | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/agency/tours`                                                | Tours            | ✅ 200                               |
| `/console/agency/tours/[tourId]`                                       | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/agency/tours/new`                                            | Create form      | ✅ 200                               |
| `/console/ai`                                                          | Ai               | ✅ 200                               |
| `/console/ai/automations`                                              | Automations      | ✅ 200                               |
| `/console/ai/automations/[automationId]`                               | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/ai/automations/[automationId]/runs`                          | Runs             | ✅ 200 · (param=\_)                  |
| `/console/ai/automations/[automationId]/runs/[runId]`                  | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/ai/automations/new`                                          | Create form      | ✅ 200                               |
| `/console/annotations`                                                 | Annotations      | ✅ 200                               |
| `/console/annotations/[id]`                                            | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/assistant`                                                   | Assistant        | ✅ 200                               |
| `/console/bim`                                                         | Bim              | ✅ 200                               |
| `/console/bim/[id]`                                                    | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/bim/[id]/view`                                               | View             | ✅ 200 · (param=\_)                  |
| `/console/bim/new`                                                     | Create form      | ✅ 200                               |
| `/console/bookings`                                                    | Bookings         | ✅ 200                               |
| `/console/bookings/calendar`                                           | Calendar         | ✅ 200                               |
| `/console/bookings/deals`                                              | Deals            | ✅ 200                               |
| `/console/bookings/deals/[offerId]`                                    | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/bookings/deals/[offerId]/settlement`                         | Settlement       | ✅ 200 · (param=\_)                  |
| `/console/bookings/holds`                                              | Holds            | ✅ 200                               |
| `/console/bookings/holds/new`                                          | Create form      | ✅ 200                               |
| `/console/bookings/settlements`                                        | Settlements      | ✅ 200                               |
| `/console/bookings/settlements/[id]`                                   | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/campaigns`                                                   | Campaigns        | ✅ 200                               |
| `/console/campaigns/new`                                               | Create form      | ✅ 200                               |
| `/console/captures`                                                    | Captures         | ✅ 200                               |
| `/console/captures/new`                                                | Create form      | ✅ 200                               |
| `/console/clients`                                                     | Clients          | ✅ 200                               |
| `/console/clients/[clientId]`                                          | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/clients/[clientId]/edit`                                     | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/clients/[clientId]/invoices`                                 | Invoices         | ✅ 200 · (param=\_)                  |
| `/console/clients/[clientId]/projects`                                 | Projects         | ✅ 200 · (param=\_)                  |
| `/console/clients/[clientId]/proposals`                                | Proposals        | ✅ 200 · (param=\_)                  |
| `/console/clients/new`                                                 | Create form      | ✅ 200                               |
| `/console/commercial`                                                  | Commercial       | ✅ 200                               |
| `/console/commercial/hospitality`                                      | Hospitality      | ✅ 200                               |
| `/console/commercial/hospitality/[packageId]`                          | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/commercial/hospitality/[packageId]/edit`                     | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/commercial/licensing`                                        | Licensing        | ✅ 200                               |
| `/console/commercial/sponsors`                                         | Sponsors         | ✅ 200                               |
| `/console/commercial/sponsors/[sponsorId]`                             | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/commercial/sponsors/[sponsorId]/edit`                        | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/commercial/sponsors/new`                                     | Create form      | ✅ 200                               |
| `/console/comms/announcements`                                         | Announcements    | ✅ 200                               |
| `/console/comms/announcements/[id]`                                    | Detail (dynamic) | ✅ 200 · 🖱 interactive · (param=\_) |
| `/console/comms/announcements/[id]/edit`                               | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/comms/announcements/new`                                     | Create form      | ✅ 200 · 🖱 interactive              |
| `/console/comms/polls`                                                 | Polls            | ✅ 200 · 🖱 interactive              |
| `/console/comms/polls/[id]`                                            | Detail (dynamic) | ✅ 200 · 🖱 interactive · (param=\_) |
| `/console/comms/polls/new`                                             | Create form      | ✅ 200 · 🖱 interactive              |
| `/console/comms/surveys`                                               | Surveys          | ✅ 200                               |
| `/console/comms/surveys/[id]`                                          | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/comms/surveys/new`                                           | Create form      | ✅ 200                               |
| `/console/compliance/coc`                                              | Coc              | ✅ 200                               |
| `/console/contracts`                                                   | Contracts        | ✅ 200                               |
| `/console/dashboards`                                                  | Dashboards       | ✅ 200                               |
| `/console/dashboards/[id]`                                             | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/dashboards/[id]/edit`                                        | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/drawings`                                                    | Drawings         | ✅ 200                               |
| `/console/drawings/[id]`                                               | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/drawings/new`                                                | Create form      | ✅ 200                               |
| `/console/email-inbox`                                                 | Email Inbox      | ✅ 200                               |
| `/console/envelopes`                                                   | Envelopes        | ✅ 200                               |
| `/console/estimates`                                                   | Estimates        | ✅ 200                               |
| `/console/estimates/new`                                               | Create form      | ✅ 200                               |
| `/console/events`                                                      | Events           | ✅ 200                               |
| `/console/events/[eventId]`                                            | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/events/[eventId]/edit`                                       | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/events/new`                                                  | Create form      | ✅ 200                               |
| `/console/finance`                                                     | Finance          | ✅ 200                               |
| `/console/finance/ap-ocr`                                              | Ap Ocr           | ✅ 200                               |
| `/console/finance/budgets`                                             | Budgets          | ✅ 200 · 🖱 interactive              |
| `/console/finance/budgets/[budgetId]`                                  | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/finance/budgets/[budgetId]/edit`                             | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/finance/budgets/import`                                      | Import           | ✅ 200                               |
| `/console/finance/budgets/new`                                         | Create form      | ✅ 200 · 🖱 interactive              |
| `/console/finance/budgets/summary`                                     | Summary          | ✅ 200                               |
| `/console/finance/consolidation`                                       | Consolidation    | ✅ 200                               |
| `/console/finance/cost-codes`                                          | Cost Codes       | ✅ 200                               |
| `/console/finance/cost-codes/new`                                      | Create form      | ✅ 200                               |
| `/console/finance/entities`                                            | Entities         | ✅ 200                               |
| `/console/finance/entities/[id]`                                       | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/finance/entities/new`                                        | Create form      | ✅ 200                               |
| `/console/finance/expenses`                                            | Expenses         | ✅ 200                               |
| `/console/finance/expenses/[expenseId]`                                | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/finance/expenses/[expenseId]/edit`                           | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/finance/expenses/new`                                        | Create form      | ✅ 200                               |
| `/console/finance/forecasts`                                           | Forecasts        | ✅ 200                               |
| `/console/finance/forecasts/new`                                       | Create form      | ✅ 200                               |
| `/console/finance/invoices`                                            | Invoices         | ✅ 200 · 🖱 interactive              |
| `/console/finance/invoices/[invoiceId]`                                | Detail (dynamic) | ✅ 200 · 🖱 interactive · (param=\_) |
| `/console/finance/invoices/[invoiceId]/activity`                       | Activity         | ✅ 200 · (param=\_)                  |
| `/console/finance/invoices/[invoiceId]/edit`                           | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/finance/invoices/[invoiceId]/line-items`                     | Line Items       | ✅ 200 · (param=\_)                  |
| `/console/finance/invoices/new`                                        | Create form      | ✅ 200 · 🖱 interactive              |
| `/console/finance/lien-waivers`                                        | Lien Waivers     | ✅ 200                               |
| `/console/finance/lien-waivers/[id]`                                   | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/finance/lien-waivers/new`                                    | Create form      | ✅ 200                               |
| `/console/finance/mileage`                                             | Mileage          | ✅ 200                               |
| `/console/finance/mileage/[mileageId]`                                 | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/finance/mileage/[mileageId]/edit`                            | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/finance/mileage/new`                                         | Create form      | ✅ 200                               |
| `/console/finance/pay-apps`                                            | Pay Apps         | ✅ 200                               |
| `/console/finance/pay-apps/[id]`                                       | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/finance/pay-apps/new`                                        | Create form      | ✅ 200                               |
| `/console/finance/payouts`                                             | Payouts          | ✅ 200                               |
| `/console/finance/payroll`                                             | Payroll          | ✅ 200                               |
| `/console/finance/payroll/new`                                         | Create form      | ✅ 200                               |
| `/console/finance/periods`                                             | Periods          | ✅ 200                               |
| `/console/finance/periods/[periodId]`                                  | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/finance/periods/[periodId]/transitions`                      | Transitions      | ✅ 200 · (param=\_)                  |
| `/console/finance/periods/new`                                         | Create form      | ✅ 200                               |
| `/console/finance/reports`                                             | Reports          | ✅ 200                               |
| `/console/finance/time`                                                | Time             | ✅ 200                               |
| `/console/finance/time/[entryId]`                                      | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/finance/time/[entryId]/edit`                                 | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/finance/time/new`                                            | Create form      | ✅ 200                               |
| `/console/finance/treasury`                                            | Treasury         | ✅ 200                               |
| `/console/finance/wip`                                                 | Wip              | ✅ 200                               |
| `/console/forms`                                                       | Forms            | ✅ 200                               |
| `/console/forms/[formId]`                                              | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/forms/[formId]/edit`                                         | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/forms/new`                                                   | Create form      | ✅ 200                               |
| `/console/guides`                                                      | Guides           | ✅ 200 · 🖱 interactive              |
| `/console/import`                                                      | Import           | ✅ 200                               |
| `/console/inbox`                                                       | Inbox            | ✅ 200                               |
| `/console/insights`                                                    | Insights         | ✅ 200                               |
| `/console/inspections`                                                 | Inspections      | ✅ 200                               |
| `/console/inspections/[id]`                                            | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/inspections/[id]/edit`                                       | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/inspections/new`                                             | Create form      | ✅ 200                               |
| `/console/inspections/templates`                                       | Templates        | ✅ 200                               |
| `/console/inspections/templates/new`                                   | Create form      | ✅ 200                               |
| `/console/knowledge`                                                   | Knowledge        | ✅ 200                               |
| `/console/knowledge/[slug]`                                            | Detail (dynamic) | ✅ 200                               |
| `/console/knowledge/[slug]/edit`                                       | Edit form        | ✅ 200                               |
| `/console/knowledge/new`                                               | Create form      | ✅ 200                               |
| `/console/leads`                                                       | Leads            | ✅ 200                               |
| `/console/leads/[leadId]`                                              | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/leads/[leadId]/activity`                                     | Activity         | ✅ 200 · (param=\_)                  |
| `/console/leads/[leadId]/edit`                                         | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/leads/[leadId]/proposals`                                    | Proposals        | ✅ 200 · (param=\_)                  |
| `/console/leads/new`                                                   | Create form      | ✅ 200                               |
| `/console/legal`                                                       | Legal            | ✅ 200                               |
| `/console/legal/insurance`                                             | Insurance        | ✅ 200                               |
| `/console/legal/insurance/[policyId]`                                  | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/legal/insurance/[policyId]/edit`                             | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/legal/insurance/new`                                         | Create form      | ✅ 200                               |
| `/console/legal/ip`                                                    | Ip               | ✅ 200                               |
| `/console/legal/ip/[markId]`                                           | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/legal/ip/[markId]/edit`                                      | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/legal/ip/new`                                                | Create form      | ✅ 200                               |
| `/console/legal/privacy`                                               | Privacy          | ✅ 200                               |
| `/console/legal/privacy/consent`                                       | Consent          | ✅ 200                               |
| `/console/legal/privacy/datamap`                                       | Datamap          | ✅ 200                               |
| `/console/legal/privacy/dsar`                                          | Dsar             | ✅ 200                               |
| `/console/legal/privacy/dsar/[requestId]`                              | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/legal/privacy/dsar/[requestId]/edit`                         | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/legal/privacy/dsar/new`                                      | Create form      | ✅ 200                               |
| `/console/locations`                                                   | Locations        | ✅ 200                               |
| `/console/locations/[locationId]`                                      | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/locations/[locationId]/edit`                                 | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/locations/new`                                               | Create form      | ✅ 200                               |
| `/console/locations/picker`                                            | Picker           | ✅ 200                               |
| `/console/logistics`                                                   | Logistics        | ✅ 200                               |
| `/console/logistics/disposition`                                       | Disposition      | ✅ 200                               |
| `/console/logistics/freight`                                           | Freight          | ✅ 200                               |
| `/console/logistics/freight/[shipmentId]`                              | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/logistics/freight/[shipmentId]/edit`                         | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/logistics/ratecard`                                          | Ratecard         | ✅ 200                               |
| `/console/logistics/ratecard/[itemId]`                                 | Detail (dynamic) | ✅ 200                               |
| `/console/logistics/ratecard/[itemId]/edit`                            | Edit form        | ✅ 200                               |
| `/console/logistics/ratecard/new`                                      | Create form      | ✅ 200                               |
| `/console/logistics/services`                                          | Services         | ✅ 200                               |
| `/console/logistics/warehouse`                                         | Warehouse        | ✅ 200                               |
| `/console/marketing`                                                   | Marketing        | ✅ 200                               |
| `/console/marketing/calendar`                                          | Calendar         | ✅ 200                               |
| `/console/marketing/onsales`                                           | Onsales          | ✅ 200                               |
| `/console/marketplace`                                                 | Marketplace      | ✅ 200                               |
| `/console/marketplace/calls`                                           | Calls            | ✅ 200                               |
| `/console/marketplace/calls/[callId]`                                  | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/marketplace/calls/[callId]/edit`                             | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/marketplace/calls/[callId]/submissions`                      | Submissions      | ✅ 200 · (param=\_)                  |
| `/console/marketplace/calls/[callId]/submissions/[submissionId]`       | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/marketplace/calls/new`                                       | Create form      | ✅ 200                               |
| `/console/marketplace/offers`                                          | Offers           | ✅ 200                               |
| `/console/marketplace/offers/[offerId]`                                | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/marketplace/offers/new`                                      | Create form      | ✅ 200                               |
| `/console/marketplace/postings`                                        | Postings         | ✅ 200                               |
| `/console/marketplace/postings/[postingId]`                            | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/marketplace/postings/[postingId]/applicants`                 | Applicants       | ✅ 200 · (param=\_)                  |
| `/console/marketplace/postings/[postingId]/applicants/[applicationId]` | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/marketplace/postings/[postingId]/edit`                       | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/marketplace/postings/new`                                    | Create form      | ✅ 200                               |
| `/console/marketplace/reviews`                                         | Reviews          | ✅ 200                               |
| `/console/marketplace/settings`                                        | Settings         | ✅ 200                               |
| `/console/marketplace/talent`                                          | Talent           | ✅ 200                               |
| `/console/marketplace/talent/[talentId]`                               | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/marketplace/talent/[talentId]/edit`                          | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/marketplace/talent/[talentId]/riders`                        | Riders           | ✅ 200 · (param=\_)                  |
| `/console/marketplace/talent/[talentId]/riders/[riderId]`              | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/marketplace/talent/[talentId]/riders/new`                    | Create form      | ✅ 200 · (param=\_)                  |
| `/console/marketplace/talent/new`                                      | Create form      | ✅ 200                               |
| `/console/meetings`                                                    | Meetings         | ✅ 200                               |
| `/console/meetings/[meetingId]`                                        | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/meetings/[meetingId]/edit`                                   | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/meetings/new`                                                | Create form      | ✅ 200                               |
| `/console/operations`                                                  | Operations       | ✅ 200                               |
| `/console/operations/daily-log`                                        | Daily Log        | ✅ 200                               |
| `/console/operations/daily-log/[id]`                                   | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/operations/daily-log/new`                                    | Create form      | ✅ 200                               |
| `/console/operations/dispatch`                                         | Dispatch         | ✅ 200                               |
| `/console/operations/incidents`                                        | Incidents        | ✅ 200                               |
| `/console/operations/incidents/[incidentId]`                           | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/operations/incidents/[incidentId]/edit`                      | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/operations/incidents/new`                                    | Create form      | ✅ 200                               |
| `/console/operations/look-ahead`                                       | Look Ahead       | ✅ 200                               |
| `/console/operations/maintenance`                                      | Maintenance      | ✅ 200                               |
| `/console/operations/maintenance/[jobId]`                              | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/operations/maintenance/schedules/new`                        | Create form      | ✅ 200                               |
| `/console/ops`                                                         | Ops              | ✅ 200                               |
| `/console/ops/toc`                                                     | Toc              | ✅ 200                               |
| `/console/ops/toc/changes`                                             | Changes          | ✅ 200                               |
| `/console/ops/toc/changes/new`                                         | Create form      | ✅ 200                               |
| `/console/ops/toc/problems`                                            | Problems         | ✅ 200                               |
| `/console/ops/toc/problems/new`                                        | Create form      | ✅ 200                               |
| `/console/participants`                                                | Participants     | ✅ 200                               |
| `/console/participants/delegations`                                    | Delegations      | ✅ 200                               |
| `/console/participants/delegations/[delegationId]`                     | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/participants/delegations/[delegationId]/edit`                | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/participants/delegations/new`                                | Create form      | ✅ 200                               |
| `/console/participants/entries`                                        | Entries          | ✅ 200                               |
| `/console/participants/entries/[entryId]`                              | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/participants/entries/[entryId]/edit`                         | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/participants/entries/new`                                    | Create form      | ✅ 200                               |
| `/console/participants/visa`                                           | Visa             | ✅ 200                               |
| `/console/participants/visa/[caseId]`                                  | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/participants/visa/[caseId]/edit`                             | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/participants/visa/new`                                       | Create form      | ✅ 200                               |
| `/console/people`                                                      | People           | ✅ 200 · 🖱 interactive              |
| `/console/people/[personId]`                                           | Detail (dynamic) | ✅ 200                               |
| `/console/people/[personId]/assignments`                               | Assignments      | ✅ 200                               |
| `/console/people/[personId]/credentials`                               | Credentials      | ✅ 200                               |
| `/console/people/[personId]/documents`                                 | Documents        | ✅ 200                               |
| `/console/people/[personId]/edit`                                      | Edit form        | ✅ 200                               |
| `/console/people/[personId]/time`                                      | Time             | ✅ 200                               |
| `/console/people/credentials`                                          | Credentials      | ✅ 200                               |
| `/console/people/credentials/[credentialId]`                           | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/people/credentials/[credentialId]/edit`                      | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/people/credentials/asset-linker`                             | Asset Linker     | ✅ 200                               |
| `/console/people/credentials/new`                                      | Create form      | ✅ 200                               |
| `/console/people/crew`                                                 | Crew             | ✅ 200                               |
| `/console/people/crew/[crewId]`                                        | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/people/crew/[crewId]/edit`                                   | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/people/crew/new`                                             | Create form      | ✅ 200                               |
| `/console/people/invites`                                              | Invites          | ✅ 200                               |
| `/console/people/msas`                                                 | Msas             | ✅ 200                               |
| `/console/people/msas/[id]`                                            | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/people/msas/new`                                             | Create form      | ✅ 200                               |
| `/console/people/offer-letters`                                        | Offer Letters    | ✅ 200                               |
| `/console/people/offer-letters/[id]`                                   | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/people/offer-letters/[id]/onboarding`                        | Onboarding       | ✅ 200 · (param=\_)                  |
| `/console/people/roles`                                                | Roles            | ✅ 200                               |
| `/console/people/teams`                                                | Teams            | ✅ 200                               |
| `/console/people/teams/[teamId]`                                       | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/photos`                                                      | Photos           | ✅ 200                               |
| `/console/photos/upload`                                               | Upload           | ✅ 200                               |
| `/console/pipeline`                                                    | Pipeline         | ✅ 200                               |
| `/console/pipeline/[dealId]`                                           | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/procurement`                                                 | Procurement      | ✅ 200                               |
| `/console/procurement/catalog`                                         | Catalog          | ✅ 200                               |
| `/console/procurement/itb`                                             | Itb              | ✅ 200                               |
| `/console/procurement/po-change-orders`                                | Po Change Orders | ✅ 200                               |
| `/console/procurement/po-change-orders/[id]`                           | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/procurement/po-change-orders/new`                            | Create form      | ✅ 200                               |
| `/console/procurement/prequalification`                                | Prequalification | ✅ 200                               |
| `/console/procurement/prequalification/new`                            | Create form      | ✅ 200                               |
| `/console/procurement/prequalification/questionnaires`                 | Questionnaires   | ✅ 200                               |
| `/console/procurement/prequalification/questionnaires/new`             | Create form      | ✅ 200                               |
| `/console/procurement/purchase-orders`                                 | Purchase Orders  | ✅ 200 · 🖱 interactive              |
| `/console/procurement/purchase-orders/[poId]`                          | Detail (dynamic) | ✅ 200 · 🖱 interactive              |
| `/console/procurement/purchase-orders/[poId]/checklist`                | Checklist        | ✅ 200                               |
| `/console/procurement/purchase-orders/[poId]/edit`                     | Edit form        | ✅ 200                               |
| `/console/procurement/purchase-orders/new`                             | Create form      | ✅ 200 · 🖱 interactive              |
| `/console/procurement/requisitions`                                    | Requisitions     | ✅ 200 · 🖱 interactive              |
| `/console/procurement/requisitions/[reqId]`                            | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/procurement/requisitions/[reqId]/edit`                       | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/procurement/requisitions/[reqId]/leveling`                   | Leveling         | ✅ 200 · (param=\_)                  |
| `/console/procurement/requisitions/[reqId]/leveling/new`               | Create form      | ✅ 200 · (param=\_)                  |
| `/console/procurement/requisitions/new`                                | Create form      | ✅ 200 · 🖱 interactive              |
| `/console/procurement/rfqs`                                            | Rfqs             | ✅ 200                               |
| `/console/procurement/rfqs/[rfqId]`                                    | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/procurement/rfqs/[rfqId]/publish`                            | Publish          | ✅ 200 · (param=\_)                  |
| `/console/procurement/rfqs/[rfqId]/responses`                          | Responses        | ✅ 200 · (param=\_)                  |
| `/console/procurement/rfqs/[rfqId]/responses/[responseId]`             | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/procurement/rfqs/new`                                        | Create form      | ✅ 200                               |
| `/console/procurement/scorecards`                                      | Scorecards       | ✅ 200                               |
| `/console/procurement/sourcing`                                        | Sourcing         | ✅ 200                               |
| `/console/procurement/vendors`                                         | Vendors          | ✅ 200 · 🖱 interactive              |
| `/console/procurement/vendors/[vendorId]`                              | Detail (dynamic) | ✅ 200                               |
| `/console/procurement/vendors/[vendorId]/edit`                         | Edit form        | ✅ 200                               |
| `/console/procurement/vendors/[vendorId]/pos`                          | Pos              | ✅ 200                               |
| `/console/procurement/vendors/[vendorId]/prequalification`             | Prequalification | ✅ 200                               |
| `/console/procurement/vendors/[vendorId]/prequalification/[prequalId]` | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/procurement/vendors/[vendorId]/scorecard`                    | Scorecard        | ✅ 200                               |
| `/console/procurement/vendors/[vendorId]/submittals`                   | Submittals       | ✅ 200                               |
| `/console/procurement/vendors/new`                                     | Create form      | ✅ 200 · 🖱 interactive              |
| `/console/procurement/wo-broadcasts`                                   | Wo Broadcasts    | ✅ 200                               |
| `/console/procurement/wo-broadcasts/[broadcastId]`                     | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/procurement/wo-broadcasts/new`                               | Create form      | ✅ 200                               |
| `/console/production`                                                  | Production       | ✅ 200                               |
| `/console/production/av`                                               | Av               | ✅ 200                               |
| `/console/production/compounds`                                        | Compounds        | ✅ 200                               |
| `/console/production/dispatch`                                         | Dispatch         | ✅ 200                               |
| `/console/production/dispatch/[dispatchId]`                            | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/production/dispatch/live`                                    | Live             | ✅ 200                               |
| `/console/production/equipment`                                        | Equipment        | ✅ 200 · 🖱 interactive              |
| `/console/production/equipment/[equipmentId]`                          | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/production/equipment/[equipmentId]/edit`                     | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/production/equipment/[equipmentId]/maintenance`              | Maintenance      | ✅ 200 · (param=\_)                  |
| `/console/production/equipment/[equipmentId]/qr`                       | Qr               | ✅ 200 · (param=\_)                  |
| `/console/production/equipment/[equipmentId]/rentals`                  | Rentals          | ✅ 200 · (param=\_)                  |
| `/console/production/equipment/new`                                    | Create form      | ✅ 200                               |
| `/console/production/equipment/utilization`                            | Utilization      | ✅ 200                               |
| `/console/production/fabrication`                                      | Fabrication      | ✅ 200                               |
| `/console/production/fabrication/[orderId]`                            | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/production/fabrication/[orderId]/edit`                       | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/production/fabrication/new`                                  | Create form      | ✅ 200                               |
| `/console/production/logistics`                                        | Logistics        | ✅ 200                               |
| `/console/production/rentals`                                          | Rentals          | ✅ 200                               |
| `/console/production/rentals/[rentalId]`                               | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/production/rentals/[rentalId]/edit`                          | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/production/rentals/availability`                             | Availability     | ✅ 200                               |
| `/console/production/rentals/new`                                      | Create form      | ✅ 200                               |
| `/console/production/ros`                                              | Ros              | ✅ 200                               |
| `/console/production/warehouse`                                        | Warehouse        | ✅ 200                               |
| `/console/production/warehouse/inventory`                              | Inventory        | ✅ 200                               |
| `/console/production/warehouse/locations`                              | Locations        | ✅ 200                               |
| `/console/programs`                                                    | Programs         | ✅ 200                               |
| `/console/programs/cases`                                              | Cases            | ✅ 200                               |
| `/console/programs/ceremonies`                                         | Ceremonies       | ✅ 200                               |
| `/console/programs/ceremonies/[ceremonyId]`                            | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/programs/ceremonies/[ceremonyId]/edit`                       | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/programs/pressconf`                                          | Pressconf        | ✅ 200                               |
| `/console/programs/protocol`                                           | Protocol         | ✅ 200                               |
| `/console/programs/readiness`                                          | Readiness        | ✅ 200                               |
| `/console/programs/readiness/[exerciseId]`                             | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/programs/readiness/[exerciseId]/edit`                        | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/programs/readiness/new`                                      | Create form      | ✅ 200                               |
| `/console/programs/reviews`                                            | Reviews          | ✅ 200                               |
| `/console/programs/reviews/[reviewId]`                                 | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/programs/reviews/[reviewId]/edit`                            | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/programs/reviews/new`                                        | Create form      | ✅ 200                               |
| `/console/programs/risk`                                               | Risk             | ✅ 200                               |
| `/console/programs/risk/[riskId]`                                      | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/programs/risk/[riskId]/edit`                                 | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/programs/risk/new`                                           | Create form      | ✅ 200                               |
| `/console/programs/schedule`                                           | Schedule         | ✅ 200                               |
| `/console/programs/scope`                                              | Scope            | ✅ 200                               |
| `/console/programs/sessions`                                           | Sessions         | ✅ 200                               |
| `/console/projects`                                                    | Projects         | ✅ 200 · 🖱 interactive              |
| `/console/projects/[projectId]`                                        | Detail (dynamic) | ✅ 200 · 🖱 interactive              |
| `/console/projects/[projectId]/advancing`                              | Advancing        | ✅ 200                               |
| `/console/projects/[projectId]/advancing/assignments`                  | Assignments      | ✅ 200                               |
| `/console/projects/[projectId]/advancing/assignments/[assignmentId]`   | Detail (dynamic) | ✅ 200                               |
| `/console/projects/[projectId]/advancing/assignments/new`              | Create form      | ✅ 200                               |
| `/console/projects/[projectId]/branding`                               | Branding         | ✅ 200                               |
| `/console/projects/[projectId]/budget`                                 | Budget           | ✅ 200 · 🖱 interactive              |
| `/console/projects/[projectId]/crew`                                   | Crew             | ✅ 200                               |
| `/console/projects/[projectId]/edit`                                   | Edit form        | ✅ 200                               |
| `/console/projects/[projectId]/files`                                  | Files            | ✅ 200                               |
| `/console/projects/[projectId]/finance`                                | Finance          | ✅ 200                               |
| `/console/projects/[projectId]/finance/draws`                          | Draws            | ✅ 200                               |
| `/console/projects/[projectId]/guides`                                 | Guides           | ✅ 200 · 🖱 interactive              |
| `/console/projects/[projectId]/guides/[persona]`                       | Detail (dynamic) | ✅ 200 · 🖱 interactive              |
| `/console/projects/[projectId]/guides/[persona]/access`                | Access           | ✅ 200                               |
| `/console/projects/[projectId]/members`                                | Members          | ✅ 200                               |
| `/console/projects/[projectId]/onboarding`                             | Onboarding       | ✅ 200                               |
| `/console/projects/[projectId]/overview`                               | Overview         | ✅ 200                               |
| `/console/projects/[projectId]/photos`                                 | Photos           | ✅ 200                               |
| `/console/projects/[projectId]/portal-preview`                         | Portal Preview   | ✅ 200                               |
| `/console/projects/[projectId]/roadmap`                                | Roadmap          | ✅ 200                               |
| `/console/projects/[projectId]/schedule`                               | Schedule         | ✅ 200                               |
| `/console/projects/[projectId]/stage-plots`                            | Stage Plots      | ✅ 200                               |
| `/console/projects/[projectId]/stage-plots/[stagePlotId]`              | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/projects/[projectId]/stage-plots/[stagePlotId]/edit`         | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/projects/[projectId]/sustainability`                         | Sustainability   | ✅ 200                               |
| `/console/projects/[projectId]/tasks`                                  | Tasks            | ✅ 200                               |
| `/console/projects/[projectId]/tracker`                                | Tracker          | ✅ 200                               |
| `/console/projects/new`                                                | Create form      | ✅ 200 · 🖱 interactive              |
| `/console/proposals`                                                   | Proposals        | ✅ 200 · 🖱 interactive              |
| `/console/proposals/[proposalId]`                                      | Detail (dynamic) | ✅ 200 · 🖱 interactive              |
| `/console/proposals/[proposalId]/edit`                                 | Edit form        | ✅ 200                               |
| `/console/proposals/new`                                               | Create form      | ✅ 200 · 🖱 interactive              |
| `/console/proposals/templates`                                         | Templates        | ✅ 200                               |
| `/console/proposals/templates/[templateId]`                            | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/punch`                                                       | Punch            | ✅ 200                               |
| `/console/punch/[id]`                                                  | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/punch/[id]/edit`                                             | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/punch/lists`                                                 | Lists            | ✅ 200                               |
| `/console/punch/new`                                                   | Create form      | ✅ 200                               |
| `/console/rfis`                                                        | Rfis             | ✅ 200                               |
| `/console/rfis/[id]`                                                   | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/rfis/[id]/edit`                                              | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/rfis/new`                                                    | Create form      | ✅ 200                               |
| `/console/risk`                                                        | Risk             | ✅ 200                               |
| `/console/safety`                                                      | Safety           | ✅ 200                               |
| `/console/safety/bcdr`                                                 | Bcdr             | ✅ 200                               |
| `/console/safety/briefings`                                            | Briefings        | ✅ 200                               |
| `/console/safety/briefings/[briefingId]`                               | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/safety/briefings/new`                                        | Create form      | ✅ 200                               |
| `/console/safety/crisis`                                               | Crisis           | ✅ 200                               |
| `/console/safety/crisis/[alertId]`                                     | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/safety/crisis/[alertId]/edit`                                | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/safety/crisis/new`                                           | Create form      | ✅ 200                               |
| `/console/safety/cyber-ir`                                             | Cyber Ir         | ✅ 200                               |
| `/console/safety/environmental`                                        | Environmental    | ✅ 200                               |
| `/console/safety/environmental/[eventId]`                              | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/safety/environmental/[eventId]/edit`                         | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/safety/environmental/new`                                    | Create form      | ✅ 200                               |
| `/console/safety/guard-tours`                                          | Guard Tours      | ✅ 200                               |
| `/console/safety/guard-tours/new`                                      | Create form      | ✅ 200                               |
| `/console/safety/incidents`                                            | Incidents        | ✅ 200                               |
| `/console/safety/major-incident`                                       | Major Incident   | ✅ 200                               |
| `/console/safety/major-incident/[eventId]`                             | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/safety/major-incident/[eventId]/edit`                        | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/safety/major-incident/new`                                   | Create form      | ✅ 200                               |
| `/console/safety/medical`                                              | Medical          | ✅ 200                               |
| `/console/safety/medical/encounters`                                   | Encounters       | ✅ 200                               |
| `/console/safety/medical/encounters/[encounterId]`                     | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/safety/medical/encounters/[encounterId]/edit`                | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/safety/medical/encounters/new`                               | Create form      | ✅ 200                               |
| `/console/safety/medical/plan`                                         | Plan             | ✅ 200                               |
| `/console/safety/osha`                                                 | Osha             | ✅ 200                               |
| `/console/safety/playbooks`                                            | Playbooks        | ✅ 200                               |
| `/console/safety/playbooks/[slug]`                                     | Detail (dynamic) | ✅ 200                               |
| `/console/safety/playbooks/new`                                        | Create form      | ✅ 200                               |
| `/console/safety/safeguarding`                                         | Safeguarding     | ✅ 200                               |
| `/console/safety/safeguarding/[reportId]`                              | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/safety/safeguarding/[reportId]/edit`                         | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/safety/safeguarding/new`                                     | Create form      | ✅ 200                               |
| `/console/safety/threats`                                              | Threats          | ✅ 200                               |
| `/console/safety/threats/new`                                          | Create form      | ✅ 200                               |
| `/console/sales`                                                       | Sales            | ✅ 200                               |
| `/console/schedule`                                                    | Schedule         | ✅ 200                               |
| `/console/schedule/baselines`                                          | Baselines        | ✅ 200                               |
| `/console/schedule/baselines/[id]`                                     | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/schedule/baselines/[id]/gantt`                               | Gantt            | ✅ 200 · (param=\_)                  |
| `/console/schedule/baselines/new`                                      | Create form      | ✅ 200                               |
| `/console/services`                                                    | Services         | ✅ 200                               |
| `/console/services/requests`                                           | Requests         | ✅ 200                               |
| `/console/services/requests/[requestId]`                               | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/services/requests/new`                                       | Create form      | ✅ 200                               |
| `/console/settings`                                                    | Settings         | ✅ 200                               |
| `/console/settings/account-managers`                                   | Account Managers | ✅ 200 · 🖱 interactive              |
| `/console/settings/account-managers/[id]`                              | Detail (dynamic) | ✅ 200 · 🖱 interactive · (param=\_) |
| `/console/settings/account-managers/new`                               | Create form      | ✅ 200 · 🖱 interactive              |
| `/console/settings/api`                                                | Api              | ✅ 200                               |
| `/console/settings/audit`                                              | Audit            | ✅ 200                               |
| `/console/settings/billing`                                            | Billing          | ✅ 200                               |
| `/console/settings/branding`                                           | Branding         | ✅ 200                               |
| `/console/settings/catalog`                                            | Catalog          | ✅ 200 · 🖱 interactive              |
| `/console/settings/catalog/[id]`                                       | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/settings/catalog/[id]/edit`                                  | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/settings/catalog/new`                                        | Create form      | ✅ 200                               |
| `/console/settings/compliance`                                         | Compliance       | ✅ 200                               |
| `/console/settings/domains`                                            | Domains          | ✅ 200                               |
| `/console/settings/email-templates`                                    | Email Templates  | ✅ 200                               |
| `/console/settings/exports`                                            | Exports          | ✅ 200                               |
| `/console/settings/governance`                                         | Governance       | ✅ 200                               |
| `/console/settings/imports`                                            | Imports          | ✅ 200                               |
| `/console/settings/integrations`                                       | Integrations     | ✅ 200                               |
| `/console/settings/integrations/[integrationId]`                       | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/settings/integrations/accounting`                            | Accounting       | ✅ 200                               |
| `/console/settings/integrations/marketplace`                           | Marketplace      | ✅ 200                               |
| `/console/settings/integrations/submissions`                           | Submissions      | ✅ 200                               |
| `/console/settings/integrations/submissions/[id]`                      | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/settings/integrations/ticketing`                             | Ticketing        | ✅ 200                               |
| `/console/settings/integrations/ticketing/[connectionId]`              | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/settings/integrations/ticketing/new`                         | Create form      | ✅ 200                               |
| `/console/settings/organization`                                       | Organization     | ✅ 200                               |
| `/console/settings/rate-limits`                                        | Rate Limits      | ✅ 200                               |
| `/console/settings/sequences`                                          | Sequences        | ✅ 200                               |
| `/console/settings/sla-policies`                                       | Sla Policies     | ✅ 200                               |
| `/console/settings/sso`                                                | Sso              | ✅ 200                               |
| `/console/settings/time-clock-zones`                                   | Time Clock Zones | ✅ 200                               |
| `/console/settings/time-clock-zones/[id]`                              | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/settings/time-clock-zones/new`                               | Create form      | ✅ 200                               |
| `/console/settings/webhooks`                                           | Webhooks         | ✅ 200                               |
| `/console/settings/webhooks/[webhookId]`                               | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/settings/webhooks/new`                                       | Create form      | ✅ 200                               |
| `/console/site-plans`                                                  | Site Plans       | ✅ 200                               |
| `/console/site-plans/[id]`                                             | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/site-plans/[id]/edit`                                        | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/site-plans/[id]/markup`                                      | Markup           | ✅ 200 · (param=\_)                  |
| `/console/site-plans/new`                                              | Create form      | ✅ 200                               |
| `/console/specs`                                                       | Specs            | ✅ 200                               |
| `/console/specs/[id]`                                                  | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/specs/new`                                                   | Create form      | ✅ 200                               |
| `/console/submittals`                                                  | Submittals       | ✅ 200                               |
| `/console/submittals/[id]`                                             | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/submittals/[id]/edit`                                        | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/submittals/new`                                              | Create form      | ✅ 200                               |
| `/console/subscriptions`                                               | Subscriptions    | ✅ 200                               |
| `/console/subscriptions/[subscriptionId]`                              | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/subscriptions/[subscriptionId]/transitions`                  | Transitions      | ✅ 200 · (param=\_)                  |
| `/console/subscriptions/new`                                           | Create form      | ✅ 200                               |
| `/console/sustainability`                                              | Sustainability   | ✅ 200                               |
| `/console/sustainability/carbon`                                       | Carbon           | ✅ 200                               |
| `/console/sustainability/carbon/[metricId]`                            | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/sustainability/carbon/[metricId]/edit`                       | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/sustainability/carbon/new`                                   | Create form      | ✅ 200                               |
| `/console/takeoffs`                                                    | Takeoffs         | ✅ 200                               |
| `/console/takeoffs/new`                                                | Create form      | ✅ 200                               |
| `/console/tasks`                                                       | Tasks            | ✅ 200 · 🖱 interactive              |
| `/console/tasks/[taskId]`                                              | Detail (dynamic) | ✅ 200                               |
| `/console/tasks/[taskId]/edit`                                         | Edit form        | ✅ 200                               |
| `/console/tasks/new`                                                   | Create form      | ✅ 200 · 🖱 interactive              |
| `/console/templates`                                                   | Templates        | ✅ 200                               |
| `/console/templates/[templateId]/new`                                  | Create form      | ✅ 200 · (param=\_)                  |
| `/console/transmittals`                                                | Transmittals     | ✅ 200                               |
| `/console/transmittals/[id]`                                           | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/transmittals/new`                                            | Create form      | ✅ 200                               |
| `/console/transport`                                                   | Transport        | ✅ 200                               |
| `/console/transport/ad`                                                | Ad               | ✅ 200                               |
| `/console/transport/ad/[manifestId]`                                   | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/transport/ad/[manifestId]/edit`                              | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/transport/ad/new`                                            | Create form      | ✅ 200                               |
| `/console/transport/dispatch`                                          | Dispatch         | ✅ 200                               |
| `/console/transport/dispatch/[runId]`                                  | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/transport/dispatch/[runId]/edit`                             | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/transport/dispatch/new`                                      | Create form      | ✅ 200                               |
| `/console/transport/fleets`                                            | Fleets           | ✅ 200                               |
| `/console/transport/workforce`                                         | Workforce        | ✅ 200                               |
| `/console/venues`                                                      | Venues           | ✅ 200                               |
| `/console/venues/[venueId]`                                            | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/venues/[venueId]/build`                                      | Build            | ✅ 200 · (param=\_)                  |
| `/console/venues/[venueId]/certifications`                             | Certifications   | ✅ 200 · (param=\_)                  |
| `/console/venues/[venueId]/closeout`                                   | Closeout         | ✅ 200 · (param=\_)                  |
| `/console/venues/[venueId]/design`                                     | Design           | ✅ 200 · (param=\_)                  |
| `/console/venues/[venueId]/edit`                                       | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/venues/[venueId]/handover`                                   | Handover         | ✅ 200 · (param=\_)                  |
| `/console/venues/[venueId]/ros`                                        | Ros              | ✅ 200 · (param=\_)                  |
| `/console/venues/[venueId]/vop`                                        | Vop              | ✅ 200 · (param=\_)                  |
| `/console/venues/[venueId]/zones`                                      | Zones            | ✅ 200 · (param=\_)                  |
| `/console/venues/new`                                                  | Create form      | ✅ 200                               |
| `/console/venues/training`                                             | Training         | ✅ 200                               |
| `/console/warranties`                                                  | Warranties       | ✅ 200                               |
| `/console/warranties/new`                                              | Create form      | ✅ 200                               |
| `/console/workforce`                                                   | Workforce        | ✅ 200                               |
| `/console/workforce/badges`                                            | Badges           | ✅ 200                               |
| `/console/workforce/badges/[badgeId]`                                  | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/workforce/badges/new`                                        | Create form      | ✅ 200                               |
| `/console/workforce/call-sheets`                                       | Call Sheets      | ✅ 200                               |
| `/console/workforce/call-sheets/[memberId]`                            | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/workforce/contractors`                                       | Contractors      | ✅ 200                               |
| `/console/workforce/contractors/[contractorId]`                        | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/workforce/contractors/[contractorId]/edit`                   | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/workforce/contractors/new`                                   | Create form      | ✅ 200                               |
| `/console/workforce/courses`                                           | Courses          | ✅ 200                               |
| `/console/workforce/courses/[courseId]`                                | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/workforce/courses/new`                                       | Create form      | ✅ 200                               |
| `/console/workforce/deployment`                                        | Deployment       | ✅ 200                               |
| `/console/workforce/deployment/[deploymentId]`                         | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/workforce/deployment/[deploymentId]/edit`                    | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/workforce/deployment/new`                                    | Create form      | ✅ 200                               |
| `/console/workforce/forecast`                                          | Forecast         | ✅ 200                               |
| `/console/workforce/housing`                                           | Housing          | ✅ 200                               |
| `/console/workforce/onboarding`                                        | Onboarding       | ✅ 200                               |
| `/console/workforce/onboarding/[flowId]`                               | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/workforce/onboarding/new`                                    | Create form      | ✅ 200                               |
| `/console/workforce/planning`                                          | Planning         | ✅ 200                               |
| `/console/workforce/recognition`                                       | Recognition      | ✅ 200                               |
| `/console/workforce/recognition/new`                                   | Create form      | ✅ 200                               |
| `/console/workforce/rosters`                                           | Rosters          | ✅ 200                               |
| `/console/workforce/rosters/[rosterId]`                                | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/workforce/rosters/[rosterId]/edit`                           | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/workforce/rosters/new`                                       | Create form      | ✅ 200                               |
| `/console/workforce/services`                                          | Services         | ✅ 200                               |
| `/console/workforce/shift-swaps`                                       | Shift Swaps      | ✅ 200                               |
| `/console/workforce/staff`                                             | Staff            | ✅ 200                               |
| `/console/workforce/staff/[staffId]`                                   | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/workforce/staff/[staffId]/edit`                              | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/workforce/staff/new`                                         | Create form      | ✅ 200                               |
| `/console/workforce/time-off`                                          | Time Off         | ✅ 200                               |
| `/console/workforce/training`                                          | Training         | ✅ 200                               |
| `/console/workforce/training/[courseId]`                               | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/workforce/training/[courseId]/edit`                          | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/workforce/uniforms`                                          | Uniforms         | ✅ 200                               |
| `/console/workforce/volunteers`                                        | Volunteers       | ✅ 200                               |
| `/console/workforce/volunteers/[volunteerId]`                          | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/workforce/volunteers/[volunteerId]/edit`                     | Edit form        | ✅ 200 · (param=\_)                  |
| `/console/workforce/volunteers/new`                                    | Create form      | ✅ 200                               |
| `/console/xpms`                                                        | Xpms             | ✅ 200                               |
| `/console/xpms/atoms`                                                  | Atoms            | ✅ 200                               |
| `/console/xpms/classes`                                                | Classes          | ✅ 200                               |
| `/console/xpms/classes/[code]`                                         | Detail (dynamic) | ✅ 200 · (param=\_)                  |
| `/console/xpms/codebook`                                               | Codebook         | ✅ 200                               |
| `/console/xpms/phases`                                                 | Phases           | ✅ 200                               |
| `/console/xpms/provenance`                                             | Provenance       | ✅ 200                               |
| `/console/xpms/tiers`                                                  | Tiers            | ✅ 200                               |
| `/console/xpms/variance`                                               | Variance         | ✅ 200                               |

## GVTEWAY portal (/p) — 123 pages

| Route                                                            | Purpose             | Validation              |
| ---------------------------------------------------------------- | ------------------- | ----------------------- |
| `/p/[slug]`                                                      | Detail (dynamic)    | ✅ 200                  |
| `/p/[slug]/announcements`                                        | Announcements       | ✅ 200                  |
| `/p/[slug]/apply`                                                | Apply               | ✅ 200                  |
| `/p/[slug]/apply/changes`                                        | Changes             | ✅ 200                  |
| `/p/[slug]/artist`                                               | Artist              | ✅ 200 · 🖱 interactive |
| `/p/[slug]/artist/advancing`                                     | Advancing           | ✅ 200 · 🖱 interactive |
| `/p/[slug]/artist/catering`                                      | Catering            | ✅ 200                  |
| `/p/[slug]/artist/privacy`                                       | Privacy             | ✅ 200                  |
| `/p/[slug]/artist/schedule`                                      | Schedule            | ✅ 200                  |
| `/p/[slug]/artist/travel`                                        | Travel              | ✅ 200                  |
| `/p/[slug]/artist/venue`                                         | Venue               | ✅ 200                  |
| `/p/[slug]/athlete`                                              | Athlete             | ✅ 200                  |
| `/p/[slug]/athlete/privacy`                                      | Privacy             | ✅ 200                  |
| `/p/[slug]/athlete/requests`                                     | Requests            | ✅ 200                  |
| `/p/[slug]/athlete/safeguarding`                                 | Safeguarding        | ✅ 200                  |
| `/p/[slug]/athlete/training`                                     | Training            | ✅ 200                  |
| `/p/[slug]/athlete/visa`                                         | Visa                | ✅ 200                  |
| `/p/[slug]/client`                                               | Client              | ✅ 200                  |
| `/p/[slug]/client/deliverables`                                  | Deliverables        | ✅ 200                  |
| `/p/[slug]/client/files`                                         | Files               | ✅ 200                  |
| `/p/[slug]/client/invoices`                                      | Invoices            | ✅ 200                  |
| `/p/[slug]/client/messages`                                      | Messages            | ✅ 200                  |
| `/p/[slug]/client/privacy`                                       | Privacy             | ✅ 200                  |
| `/p/[slug]/client/proposals`                                     | Proposals           | ✅ 200                  |
| `/p/[slug]/client/proposals/[proposalId]`                        | Detail (dynamic)    | ✅ 200                  |
| `/p/[slug]/client/proposals/[proposalId]/activity`               | Activity            | ✅ 200                  |
| `/p/[slug]/client/proposals/[proposalId]/approvals`              | Approvals           | ✅ 200                  |
| `/p/[slug]/client/proposals/[proposalId]/approvals/[approvalId]` | Detail (dynamic)    | ✅ 200 · (param=\_)     |
| `/p/[slug]/client/proposals/[proposalId]/change-orders`          | Change Orders       | ✅ 200                  |
| `/p/[slug]/client/proposals/[proposalId]/change-orders/[coId]`   | Detail (dynamic)    | ✅ 200 · (param=\_)     |
| `/p/[slug]/client/proposals/[proposalId]/change-orders/new`      | Create form         | ✅ 200                  |
| `/p/[slug]/client/proposals/[proposalId]/files`                  | Files               | ✅ 200                  |
| `/p/[slug]/client/proposals/[proposalId]/lifecycle`              | Lifecycle           | ✅ 200                  |
| `/p/[slug]/client/proposals/[proposalId]/revisions`              | Revisions           | ✅ 200                  |
| `/p/[slug]/client/proposals/[proposalId]/revisions/[revisionId]` | Detail (dynamic)    | ✅ 200 · (param=\_)     |
| `/p/[slug]/client/proposals/[proposalId]/revisions/new`          | Create form         | ✅ 200                  |
| `/p/[slug]/crew`                                                 | Crew                | ✅ 200                  |
| `/p/[slug]/crew/advances`                                        | Advances            | ✅ 200                  |
| `/p/[slug]/crew/call-sheet`                                      | Call Sheet          | ✅ 200                  |
| `/p/[slug]/crew/chat`                                            | Chat                | ✅ 200                  |
| `/p/[slug]/crew/directory`                                       | Directory           | ✅ 200                  |
| `/p/[slug]/crew/docs`                                            | Docs                | ✅ 200                  |
| `/p/[slug]/crew/feed`                                            | Feed                | ✅ 200                  |
| `/p/[slug]/crew/kudos`                                           | Kudos               | ✅ 200                  |
| `/p/[slug]/crew/learning`                                        | Learning            | ✅ 200                  |
| `/p/[slug]/crew/privacy`                                         | Privacy             | ✅ 200                  |
| `/p/[slug]/crew/schedule`                                        | Schedule            | ✅ 200                  |
| `/p/[slug]/crew/time`                                            | Time                | ✅ 200                  |
| `/p/[slug]/crew/time-off`                                        | Time Off            | ✅ 200                  |
| `/p/[slug]/delegation`                                           | Delegation          | ✅ 200                  |
| `/p/[slug]/delegation/accommodation`                             | Accommodation       | ✅ 200                  |
| `/p/[slug]/delegation/bookings`                                  | Bookings            | ✅ 200                  |
| `/p/[slug]/delegation/cases`                                     | Cases               | ✅ 200                  |
| `/p/[slug]/delegation/entries`                                   | Entries             | ✅ 200                  |
| `/p/[slug]/delegation/meetings`                                  | Meetings            | ✅ 200                  |
| `/p/[slug]/delegation/privacy`                                   | Privacy             | ✅ 200                  |
| `/p/[slug]/delegation/ratecard`                                  | Ratecard            | ✅ 200                  |
| `/p/[slug]/delegation/transport`                                 | Transport           | ✅ 200                  |
| `/p/[slug]/delegation/visa`                                      | Visa                | ✅ 200                  |
| `/p/[slug]/guest`                                                | Guest               | ✅ 200                  |
| `/p/[slug]/guest/logistics`                                      | Logistics           | ✅ 200                  |
| `/p/[slug]/guest/privacy`                                        | Privacy             | ✅ 200                  |
| `/p/[slug]/guest/schedule`                                       | Schedule            | ✅ 200                  |
| `/p/[slug]/guest/tickets`                                        | Tickets             | ✅ 200                  |
| `/p/[slug]/guide`                                                | Guide               | ✅ 200 · 🖱 interactive |
| `/p/[slug]/guide/unlock`                                         | Unlock              | ✅ 200                  |
| `/p/[slug]/hospitality`                                          | Hospitality         | ✅ 200                  |
| `/p/[slug]/hospitality/guests`                                   | Guests              | ✅ 200                  |
| `/p/[slug]/hospitality/itinerary`                                | Itinerary           | ✅ 200                  |
| `/p/[slug]/inbox`                                                | Inbox               | ✅ 200                  |
| `/p/[slug]/media`                                                | Media               | ✅ 200                  |
| `/p/[slug]/media/accommodation`                                  | Accommodation       | ✅ 200                  |
| `/p/[slug]/media/info`                                           | Info                | ✅ 200                  |
| `/p/[slug]/media/pressconf`                                      | Pressconf           | ✅ 200                  |
| `/p/[slug]/media/services`                                       | Services            | ✅ 200                  |
| `/p/[slug]/media/transport`                                      | Transport           | ✅ 200                  |
| `/p/[slug]/messages`                                             | Messages            | ✅ 200                  |
| `/p/[slug]/overview`                                             | Overview            | ✅ 200 · 🖱 interactive |
| `/p/[slug]/producer`                                             | Producer            | ✅ 200                  |
| `/p/[slug]/producer/approvals`                                   | Approvals           | ✅ 200                  |
| `/p/[slug]/producer/pnl`                                         | Pnl                 | ✅ 200                  |
| `/p/[slug]/producer/portfolio`                                   | Portfolio           | ✅ 200                  |
| `/p/[slug]/producer/risk`                                        | Risk                | ✅ 200                  |
| `/p/[slug]/producer/tracker`                                     | Tracker             | ✅ 200                  |
| `/p/[slug]/promoter`                                             | Promoter            | ✅ 200                  |
| `/p/[slug]/promoter/approvals`                                   | Approvals           | ✅ 200                  |
| `/p/[slug]/promoter/co-pro`                                      | Co Pro              | ✅ 200                  |
| `/p/[slug]/promoter/marketing`                                   | Marketing           | ✅ 200                  |
| `/p/[slug]/promoter/settlements`                                 | Settlements         | ✅ 200                  |
| `/p/[slug]/promoter/tour-pnl`                                    | Tour Pnl            | ✅ 200                  |
| `/p/[slug]/sponsor`                                              | Sponsor             | ✅ 200                  |
| `/p/[slug]/sponsor/activations`                                  | Activations         | ✅ 200                  |
| `/p/[slug]/sponsor/assets`                                       | Assets              | ✅ 200                  |
| `/p/[slug]/sponsor/entitlements`                                 | Entitlements        | ✅ 200                  |
| `/p/[slug]/sponsor/privacy`                                      | Privacy             | ✅ 200                  |
| `/p/[slug]/sponsor/reporting`                                    | Reporting           | ✅ 200                  |
| `/p/[slug]/stakeholder`                                          | Stakeholder         | ✅ 200                  |
| `/p/[slug]/tasks`                                                | Tasks               | ✅ 200                  |
| `/p/[slug]/vendor`                                               | Vendor              | ✅ 200                  |
| `/p/[slug]/vendor/chat`                                          | Chat                | ✅ 200                  |
| `/p/[slug]/vendor/credentials`                                   | Credentials         | ✅ 200                  |
| `/p/[slug]/vendor/directory`                                     | Directory           | ✅ 200                  |
| `/p/[slug]/vendor/docs`                                          | Docs                | ✅ 200                  |
| `/p/[slug]/vendor/equipment-pull-list`                           | Equipment Pull List | ✅ 200                  |
| `/p/[slug]/vendor/feed`                                          | Feed                | ✅ 200                  |
| `/p/[slug]/vendor/invoices`                                      | Invoices            | ✅ 200                  |
| `/p/[slug]/vendor/kudos`                                         | Kudos               | ✅ 200                  |
| `/p/[slug]/vendor/privacy`                                       | Privacy             | ✅ 200                  |
| `/p/[slug]/vendor/purchase-orders`                               | Purchase Orders     | ✅ 200                  |
| `/p/[slug]/vendor/schedule`                                      | Schedule            | ✅ 200                  |
| `/p/[slug]/vendor/submissions`                                   | Submissions         | ✅ 200                  |
| `/p/[slug]/vendor/time-off`                                      | Time Off            | ✅ 200                  |
| `/p/[slug]/vendor/training`                                      | Training            | ✅ 200                  |
| `/p/[slug]/vendor/training/[course]`                             | Detail (dynamic)    | ✅ 200 · (param=\_)     |
| `/p/[slug]/vip`                                                  | Vip                 | ✅ 200                  |
| `/p/[slug]/vip/accommodation`                                    | Accommodation       | ✅ 200                  |
| `/p/[slug]/vip/itinerary`                                        | Itinerary           | ✅ 200                  |
| `/p/[slug]/vip/transport`                                        | Transport           | ✅ 200                  |
| `/p/[slug]/volunteer`                                            | Volunteer           | ✅ 200                  |
| `/p/[slug]/volunteer/application`                                | Application         | ✅ 200                  |
| `/p/[slug]/volunteer/schedule`                                   | Schedule            | ✅ 200                  |
| `/p/[slug]/volunteer/training`                                   | Training            | ✅ 200                  |
| `/p/[slug]/volunteer/uniform`                                    | Uniform             | ✅ 200                  |

## COMPVSS mobile (/m) — 74 pages

| Route                          | Purpose          | Validation       |
| ------------------------------ | ---------------- | ---------------- |
| `/m`                           | M                | ✅ smoke (92/92) |
| `/m/[role]`                    | Detail (dynamic) | ✅ smoke (92/92) |
| `/m/[role]/alerts`             | Alerts           | ✅ smoke (92/92) |
| `/m/[role]/directory`          | Directory        | ✅ smoke (92/92) |
| `/m/[role]/docs`               | Docs             | ✅ smoke (92/92) |
| `/m/[role]/feed`               | Feed             | ✅ smoke (92/92) |
| `/m/[role]/inbox`              | Inbox            | ✅ smoke (92/92) |
| `/m/[role]/kudos`              | Kudos            | ✅ smoke (92/92) |
| `/m/[role]/learning`           | Learning         | ✅ smoke (92/92) |
| `/m/[role]/settings`           | Settings         | ✅ smoke (92/92) |
| `/m/[role]/shift`              | Shift            | ✅ smoke (92/92) |
| `/m/[role]/time-off`           | Time Off         | ✅ smoke (92/92) |
| `/m/ad`                        | Ad               | ✅ smoke (92/92) |
| `/m/advances`                  | Advances         | ✅ smoke (92/92) |
| `/m/alerts`                    | Alerts           | ✅ smoke (92/92) |
| `/m/check-in`                  | Check In         | ✅ smoke (92/92) |
| `/m/check-in/manual`           | Manual           | ✅ smoke (92/92) |
| `/m/check-in/scan/[slug]`      | Detail (dynamic) | ✅ smoke (92/92) |
| `/m/checkin`                   | Checkin          | ✅ smoke (92/92) |
| `/m/clock`                     | Clock            | ✅ smoke (92/92) |
| `/m/coc`                       | Coc              | ✅ smoke (92/92) |
| `/m/crew`                      | Crew             | ✅ smoke (92/92) |
| `/m/crew/clock`                | Clock            | ✅ smoke (92/92) |
| `/m/daily-log`                 | Daily Log        | ✅ smoke (92/92) |
| `/m/directory`                 | Directory        | ✅ smoke (92/92) |
| `/m/docs`                      | Docs             | ✅ smoke (92/92) |
| `/m/docs/new`                  | Create form      | ✅ smoke (92/92) |
| `/m/driver`                    | Driver           | ✅ smoke (92/92) |
| `/m/driver/run/[runId]`        | Detail (dynamic) | ✅ smoke (92/92) |
| `/m/feed`                      | Feed             | ✅ smoke (92/92) |
| `/m/gate`                      | Gate             | ✅ smoke (92/92) |
| `/m/gate/scan`                 | Scan             | ✅ smoke (92/92) |
| `/m/gigs`                      | Gigs             | ✅ smoke (92/92) |
| `/m/guard`                     | Guard            | ✅ smoke (92/92) |
| `/m/guide`                     | Guide            | ✅ smoke (92/92) |
| `/m/handover`                  | Handover         | ✅ smoke (92/92) |
| `/m/inbox`                     | Inbox            | ✅ smoke (92/92) |
| `/m/inbox/[roomId]`            | Detail (dynamic) | ✅ smoke (92/92) |
| `/m/incident`                  | Incident         | ✅ smoke (92/92) |
| `/m/incident/new`              | Create form      | ✅ smoke (92/92) |
| `/m/incidents`                 | Incidents        | ✅ smoke (92/92) |
| `/m/incidents/new`             | Create form      | ✅ smoke (92/92) |
| `/m/inventory/scan`            | Scan             | ✅ smoke (92/92) |
| `/m/kudos`                     | Kudos            | ✅ smoke (92/92) |
| `/m/learning`                  | Learning         | ✅ smoke (92/92) |
| `/m/learning/[courseId]`       | Detail (dynamic) | ✅ smoke (92/92) |
| `/m/medic`                     | Medic            | ✅ smoke (92/92) |
| `/m/medic/new`                 | Create form      | ✅ smoke (92/92) |
| `/m/notifications`             | Notifications    | ✅ smoke (92/92) |
| `/m/onboarding`                | Onboarding       | ✅ smoke (92/92) |
| `/m/onboarding/[assignmentId]` | Detail (dynamic) | ✅ smoke (92/92) |
| `/m/polls`                     | Polls            | ✅ smoke (92/92) |
| `/m/punch`                     | Punch            | ✅ smoke (92/92) |
| `/m/requests`                  | Requests         | ✅ smoke (92/92) |
| `/m/requests/[requestId]`      | Detail (dynamic) | ✅ smoke (92/92) |
| `/m/requests/new`              | Create form      | ✅ smoke (92/92) |
| `/m/ros`                       | Ros              | ✅ smoke (92/92) |
| `/m/ros/[showId]`              | Detail (dynamic) | ✅ smoke (92/92) |
| `/m/safeguarding`              | Safeguarding     | ✅ smoke (92/92) |
| `/m/settings`                  | Settings         | ✅ smoke (92/92) |
| `/m/settings/notifications`    | Notifications    | ✅ smoke (92/92) |
| `/m/settings/role`             | Role             | ✅ smoke (92/92) |
| `/m/shift`                     | Shift            | ✅ smoke (92/92) |
| `/m/shift/swap`                | Swap             | ✅ smoke (92/92) |
| `/m/surveys`                   | Surveys          | ✅ smoke (92/92) |
| `/m/surveys/[surveyId]`        | Detail (dynamic) | ✅ smoke (92/92) |
| `/m/tasks`                     | Tasks            | ✅ smoke (92/92) |
| `/m/tasks/[taskId]`            | Detail (dynamic) | ✅ smoke (92/92) |
| `/m/time-off`                  | Time Off         | ✅ smoke (92/92) |
| `/m/time-off/new`              | Create form      | ✅ smoke (92/92) |
| `/m/tracker`                   | Tracker          | ✅ smoke (92/92) |
| `/m/wallet`                    | Wallet           | ✅ smoke (92/92) |
| `/m/wayfind`                   | Wayfind          | ✅ smoke (92/92) |
| `/m/wms`                       | Wms              | ✅ smoke (92/92) |

## Root / misc — 26 pages

| Route                                   | Purpose          | Validation          |
| --------------------------------------- | ---------------- | ------------------- |
| `/api-docs`                             | Api Docs         | ✅ 200              |
| `/forms/[slug]`                         | Detail (dynamic) | ❌ 404              |
| `/ghxstship`                            | Ghxstship        | ✅ 200              |
| `/ghxstship/about`                      | About            | ✅ 200              |
| `/ghxstship/contact`                    | Contact          | ✅ 200              |
| `/ghxstship/markets`                    | Markets          | ✅ 200              |
| `/ghxstship/markets/[city]`             | Detail (dynamic) | ✅ 200 · (param=\_) |
| `/ghxstship/phases`                     | Phases           | ✅ 200              |
| `/ghxstship/phases/[phase]`             | Detail (dynamic) | ✅ 200 · (param=\_) |
| `/ghxstship/pricing`                    | Pricing          | ✅ 200              |
| `/ghxstship/services`                   | Services         | ✅ 200              |
| `/ghxstship/services/[class]`           | Detail (dynamic) | ✅ 200 · (param=\_) |
| `/ghxstship/services/[class]/[service]` | Detail (dynamic) | ✅ 200 · (param=\_) |
| `/ghxstship/solutions`                  | Solutions        | ✅ 200              |
| `/ghxstship/solutions/[solution]`       | Detail (dynamic) | ✅ 200 · (param=\_) |
| `/ghxstship/tiers`                      | Tiers            | ✅ 200              |
| `/ghxstship/tiers/[tier]`               | Detail (dynamic) | ✅ 200 · (param=\_) |
| `/msa/[token]`                          | Detail (dynamic) | ✅ 200 · (param=\_) |
| `/msa/[token]/print`                    | Print            | ❌ 404 · (param=\_) |
| `/offer/[token]`                        | Detail (dynamic) | ✅ 200 · (param=\_) |
| `/offer/[token]/checkin`                | Checkin          | ✅ 200 · (param=\_) |
| `/offer/[token]/onboarding`             | Onboarding       | ✅ 200 · (param=\_) |
| `/offer/[token]/print`                  | Print            | ❌ 404 · (param=\_) |
| `/proposals/[token]`                    | Detail (dynamic) | ❌ 404 · (param=\_) |
| `/proposals/heat`                       | Heat             | ✅ 200              |
| `/share/[token]`                        | Detail (dynamic) | ✅ 200 · (param=\_) |
