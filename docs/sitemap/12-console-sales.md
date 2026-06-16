# ATLVS Console — Sales & Marketplace

Inventory of every `page.tsx` under the in-scope `/console` segments: marketplace, sales, bookings, commercial, clients, agency, leads, pipeline, campaigns, marketing. CRUD/interactive notes reflect the actual server actions, forms, tables, and controls wired into each page (dynamic children collapsed under their parent where natural).

## Marketplace

- `/console/marketplace` — Marketplace overview hub: metric cards (live postings, open calls, active offers, new applicants) linking into sub-modules, plus tiles for postings, calls, talent, offers, RFQ marketplace, inquiries, reviews. **CRUD/interactive:** read-only dashboard; metric cards + tiles are nav links, with inline `+ New` shortcuts to each create route.
- `/console/marketplace/settings` — Marketplace take-rate and public visibility settings for the org. **CRUD/interactive:** form (`FormShell` → `updateMarketplaceSettingsAction`) — enable/disable public surfaces toggle + take-rate (bps) input; owner/admin-gated.
- `/console/marketplace/inquiries` — Inbox of quote/booking inquiries from public profiles and RFQs. **CRUD/interactive:** per-row state controls (Mark Responded, Close) via `setInquiryState` bound forms; new/responded/closed lifecycle.
- `/console/marketplace/reviews` — Bidirectional review moderation list (hidden until both sides post). **CRUD/interactive:** read-only `DataTable` with filterable/groupable subject, tx, released columns.
- `/console/marketplace/offers` — Talent offer list with active-offer count. **CRUD/interactive:** `DataTable` with `rowHref` to detail, filterable/groupable status; `+ New Offer` link.
- `/console/marketplace/offers/new` — Create a talent offer (talent, optional project, date, slot, fee/currency/deposit, balance terms). **CRUD/interactive:** create form (`FormShell` → `createOfferAction`); native selects for talent/project/balance-terms; 60/40 default.
- `/console/marketplace/offers/[offerId]` — Offer detail: terms, deposit/balance split, timeline. **CRUD/interactive:** offer state machine via `OfferControls` (Send Offer / Accept / Decline → `sendOfferAction`/`acceptOfferAction`/`declineOfferAction`); draft→sent→countered→accepted→contracted.
- `/console/marketplace/postings` — Public crew job-board postings list with live/draft counts + metric card. **CRUD/interactive:** `DataTable` with `rowHref`, filterable status; `+ New Posting` link.
- `/console/marketplace/postings/new` — Create a job posting. **CRUD/interactive:** create form (`createPostingAction`); selects for posting type + employment type; drafts private until published.
- `/console/marketplace/postings/[postingId]` — Posting detail (roles, certifications, unions). **CRUD/interactive:** `PublishControls` (publish/close FSM via `publishPostingAction`/`closePostingAction`); links to Applicants + Edit.
- `/console/marketplace/postings/[postingId]/edit` — Edit a posting. **CRUD/interactive:** update form (`updatePostingAction`); type/employment selects.
- `/console/marketplace/postings/[postingId]/applicants` — Applicant list (ATS) for a posting. **CRUD/interactive:** `DataTable` with `rowHref` to applicant detail.
- `/console/marketplace/postings/[postingId]/applicants/[applicationId]` — Applicant detail. **CRUD/interactive:** application status-transition form (`transitionApplicationAction`) via native select.
- `/console/marketplace/calls` — Open calls / casting list with live + submission counts + metric card. **CRUD/interactive:** `DataTable` with `rowHref`; `+ New` link.
- `/console/marketplace/calls/new` — Create an open call (casting / RFP / audition). **CRUD/interactive:** create form (`createCallAction`); kind select.
- `/console/marketplace/calls/[callId]` — Open-call detail. **CRUD/interactive:** publish/close FSM (`publishCallAction`/`closeCallAction`); links to Submissions + Edit.
- `/console/marketplace/calls/[callId]/edit` — Edit an open call. **CRUD/interactive:** update form (`updateCallAction`); kind select.
- `/console/marketplace/calls/[callId]/submissions` — Submission list for a call. **CRUD/interactive:** `DataTable` with `rowHref` to submission detail.
- `/console/marketplace/calls/[callId]/submissions/[submissionId]` — Submission detail. **CRUD/interactive:** submission status-transition form (`transitionSubmissionAction`) via native select.
- `/console/marketplace/talent` — Talent EPK roster list with public count. **CRUD/interactive:** `DataTable` with `rowHref`; `+ New` link.
- `/console/marketplace/talent/new` — Create a talent profile / EPK. **CRUD/interactive:** create form (`createTalentAction`).
- `/console/marketplace/talent/[talentId]` — Talent detail (bio, genres, riders summary). **CRUD/interactive:** `TalentVisibility` publish/unpublish toggle (`publishTalentAction`/`unpublishTalentAction`); links to Riders + Edit + add rider.
- `/console/marketplace/talent/[talentId]/edit` — Edit a talent profile. **CRUD/interactive:** update form (`updateTalentAction`).
- `/console/marketplace/talent/[talentId]/riders` — Rider list for a talent profile. **CRUD/interactive:** read-only list; `+ New Rider` link.
- `/console/marketplace/talent/[talentId]/riders/new` — Attach a rider (kind, version, file URL). **CRUD/interactive:** create form (`createRiderAction`); kind select.
- `/console/marketplace/talent/[talentId]/riders/[riderId]` — Rider detail. **CRUD/interactive:** read-only; external file-URL link if present.
- `/console/marketplace/discounts` — Discount-code list (Commerce). **CRUD/interactive:** `DataTable` with `rowHref`; links to Promoters + `+ New Code`.
- `/console/marketplace/discounts/new` — Create a discount code. **CRUD/interactive:** create form (`createDiscountAction`).
- `/console/marketplace/discounts/[discountId]` — Discount-code detail. **CRUD/interactive:** state-transition buttons (`setDiscountStateAction` bound forms) + `DeleteForm` (`deleteDiscountAction`).
- `/console/marketplace/discounts/promoters` — Affiliate/promoter list. **CRUD/interactive:** `DataTable` with `rowHref`; `+ New Promoter` link.
- `/console/marketplace/discounts/promoters/new` — Create a promoter. **CRUD/interactive:** create form (`createPromoterAction`).
- `/console/marketplace/discounts/promoters/[promoterId]` — Promoter detail with attribution ledger. **CRUD/interactive:** state-transition buttons (`setPromoterStateAction`) + `DeleteForm` (`deletePromoterAction`) + Record-Attribution form (`AttributionForm` → `createAttributionAction`).
- `/console/marketplace/box-office` — Box-office hub: guest lists with check-in metrics. **CRUD/interactive:** `DataTable`; `+ New Guest List` link; guest-code scan + check-in actions exposed (`scanGuestCodeAction`, `checkInEntryAction`).
- `/console/marketplace/box-office/new` — Create a guest list (name + event). **CRUD/interactive:** create form (`createGuestListAction`); event select.
- `/console/marketplace/box-office/[listId]` — Guest-list detail: entries, scan codes, check-in metrics. **CRUD/interactive:** add-guest form (`addGuestEntryAction`) + per-entry check-in / deny / reset controls (`checkInEntryAction`/`denyEntryAction`/`resetEntryAction`).

## Sales

- `/console/sales` — Sales hub linking to leads (pipeline kanban + saved views), clients, sponsors, marketing, bookings. **CRUD/interactive:** read-only card grid of nav links.
- `/console/sales/beos` — Banquet Event Orders (BEOs) list. **CRUD/interactive:** `DataTable` with `rowHref`; `+ New BEO` link.
- `/console/sales/beos/new` — Create a BEO. **CRUD/interactive:** create form (`createBeoAction`).
- `/console/sales/beos/[id]` — BEO detail (event, headcount, line items). **CRUD/interactive:** `BeoStateControls` state machine (`setBeoStateAction`); add/delete line items (`addBeoLineAction`/`deleteBeoLineAction`).
- `/console/sales/diary` — Function Diary calendar (spaces × dates) with prev/today/next navigation. **CRUD/interactive:** calendar view with date-range nav; links to Spaces + `+ New Booking`; empty-state CTA.
- `/console/sales/diary/new` — Create a booking against a space. **CRUD/interactive:** create form (`createBookingAction`); empty-state if no spaces.
- `/console/sales/diary/[bookingId]` — Booking detail. **CRUD/interactive:** state-transition select form (`transitionBookingAction`) + `DeleteForm` (`deleteBooking`) + Edit link.
- `/console/sales/diary/[bookingId]/edit` — Edit a booking. **CRUD/interactive:** update form (`updateBookingAction`).
- `/console/sales/diary/spaces` — Bookable spaces list. **CRUD/interactive:** `DataTable`; `+ New Space` link.
- `/console/sales/diary/spaces/new` — Create a space. **CRUD/interactive:** create form (`createSpaceAction`).

## Bookings

- `/console/bookings` — Bookings overview: deal/hold/settlement metrics (tier-1 holds, finalized, settled GBOR) + tiles. **CRUD/interactive:** read-only dashboard with nav tiles.
- `/console/bookings/calendar` — Calendar of upcoming tiered holds + booking milestones. **CRUD/interactive:** read-only calendar/list view.
- `/console/bookings/deals` — Deal-tracker list (sourced from talent offers). **CRUD/interactive:** `DataTable` with `rowHref`; `+ New` routes to offers/new.
- `/console/bookings/deals/[offerId]` — Deal detail: walkout threshold, co-promoter partners/splits, settlement link. **CRUD/interactive:** co-promoter partner forms (`addCoProPartnerAction`/`removeCoProPartnerAction` from `co-pro/actions`); links to source offer + create/open settlement.
- `/console/bookings/deals/[offerId]/settlement` — Post-show reconciliation (NBOR, balance due, ancillary). **CRUD/interactive:** upsert form (`upsertSettlementAction`) + finalize action (`finalizeSettlementAction`); read-only once final.
- `/console/bookings/holds` — Tiered holds list (active). **CRUD/interactive:** `DataTable`; `+ New Hold` link; release action available (`releaseHoldAction`).
- `/console/bookings/holds/new` — Place a tiered hold (tier 1/2/3, first-refusal). **CRUD/interactive:** create form (`createTieredHoldAction`); tier select.
- `/console/bookings/settlements` — Settlements list with GBOR/NBOR/final/draft metrics. **CRUD/interactive:** `DataTable` with `rowHref`; read-only roll-up.
- `/console/bookings/settlements/[id]` — Settlement detail with itemized lines. **CRUD/interactive:** add/delete settlement-line forms (`addSettlementLine`/`deleteSettlementLine`); state badge; Edit-on-deal link.

## Commercial

- `/console/commercial` — Commercial revenue hub linking sponsors, ticketing, hospitality, licensing, brand. **CRUD/interactive:** read-only card grid of nav links.
- `/console/commercial/licensing` — Trademark / licensing roll-up with active + expiring-soon counts. **CRUD/interactive:** read-only; links to `/console/legal/ip`; empty-state CTA.
- `/console/commercial/hospitality` — Hospitality packages + entitlements roll-up (seats, allocation). **CRUD/interactive:** read-only aggregator; links to Sponsors + package detail; empty-state CTAs.
- `/console/commercial/hospitality/[packageId]` — Hospitality package detail. **CRUD/interactive:** read-only display + `DeleteForm` (`deleteHospitalityPackage`) + Edit link.
- `/console/commercial/hospitality/[packageId]/edit` — Edit a hospitality package. **CRUD/interactive:** update form (`updateHospitalityPackage`).
- `/console/commercial/sponsors` — Sponsor entitlements list. **CRUD/interactive:** `DataTable` with `rowHref`; `+ New` link.
- `/console/commercial/sponsors/new` — Create a sponsor entitlement. **CRUD/interactive:** create form (`createEntitlement`); status select.
- `/console/commercial/sponsors/[sponsorId]` — Sponsor entitlement detail. **CRUD/interactive:** read-only display + `DeleteForm` (`deleteSponsorEntitlement`) + Edit link.
- `/console/commercial/sponsors/[sponsorId]/edit` — Edit a sponsor entitlement. **CRUD/interactive:** update form (`updateSponsorEntitlement`); status select.

## Clients

- `/console/clients` — Clients list with saved DataTable views. **CRUD/interactive:** `DataTable` with `rowHref`, saved-view config (save/delete/set-default via `saveClientsView`/`deleteClientsView`/`setDefaultClientsView`) + bulk delete (`bulkDeleteClients`); `+ New Client` link.
- `/console/clients/new` — Create a client. **CRUD/interactive:** create form (`createClientAction`).
- `/console/clients/[clientId]` — Client detail. **CRUD/interactive:** `DeleteForm` (`deleteClient`); shortcut buttons to new proposal / new invoice (prefilled) + Edit.
- `/console/clients/[clientId]/edit` — Edit a client. **CRUD/interactive:** update form (`updateClient`); also exposes `deleteClient`.
- `/console/clients/[clientId]/branding` — Client co-brand logo + colors editor. **CRUD/interactive:** branding form (`updateClientBrandingAction`) for proposal/invoice co-brand lockup.
- `/console/clients/[clientId]/invoices` — Invoices for this client. **CRUD/interactive:** read-only `DataTable` with `rowHref` to finance/invoices.
- `/console/clients/[clientId]/projects` — Projects linked to this client. **CRUD/interactive:** read-only `DataTable` with `rowHref` to projects.
- `/console/clients/[clientId]/proposals` — Proposals sent to this client. **CRUD/interactive:** read-only `DataTable` with `rowHref` to proposals.

## Agency

- `/console/agency` — Agency overview: roster/tours/commission cards + counts. **CRUD/interactive:** read-only nav cards; `+ New Tour` link.
- `/console/agency/commissions` — Commission tracking list. **CRUD/interactive:** read-only `DataTable` with `rowHref`.
- `/console/agency/roster` — Agency artist roster list. **CRUD/interactive:** `DataTable` with `rowHref`; links to talent/new.
- `/console/agency/roster/[agencyArtistId]` — Roster-entry detail (signed/ended dates). **CRUD/interactive:** update form (`updateAgencyArtistAction`) + end-representation form (`endAgencyArtistAction`).
- `/console/agency/tours` — Tours list (multi-date P&L roll-up). **CRUD/interactive:** `DataTable` with `rowHref`; `+ New Tour` link.
- `/console/agency/tours/new` — Create a tour (routing container). **CRUD/interactive:** create form (`createTourAction`); talent + agency selects.
- `/console/agency/tours/[tourId]` — Tour detail: multi-date P&L roll-up with deal links. **CRUD/interactive:** read-only; status badge + links to deals.

## Leads

- `/console/leads` — Leads list (stage column, value, source). **CRUD/interactive:** `DataTable` with `rowHref` + `StatusBadge` stages; `+ New Lead` link (stage moves happen on detail).
- `/console/leads/new` — Create a lead. **CRUD/interactive:** create form (`createLeadAction`).
- `/console/leads/[leadId]` — Lead detail (stage, notes). **CRUD/interactive:** `LeadStageMover` stage transitions (`moveLeadStageAction`) + `DeleteForm` (`deleteLead`) + Edit link.
- `/console/leads/[leadId]/edit` — Edit a lead. **CRUD/interactive:** update form (`updateLead`); stage changes deferred to detail.
- `/console/leads/[leadId]/activity` — Audit trail for the lead. **CRUD/interactive:** read-only `DataTable` over `audit_log`.
- `/console/leads/[leadId]/proposals` — Proposals sourced from this lead. **CRUD/interactive:** read-only `DataTable`.

## Pipeline

- `/console/pipeline` — CRM deal pipeline board: opportunities grouped into stage lanes, open-value metrics, multi-pipeline switcher. **CRUD/interactive:** read-only board view; pipeline switcher links (`?pipeline=slug`); no inline mutations.
- `/console/pipeline/[dealId]` — Opportunity detail with stage badge + activity timeline. **CRUD/interactive:** read-only display of deal fields + logged activities.

## Campaigns

- `/console/campaigns` — Marketing campaigns list with live count + budget/spend roll-up. **CRUD/interactive:** `DataTable` with filterable/groupable columns; `+ New Campaign` link (list-only, no detail route).
- `/console/campaigns/new` — Create a campaign (channel, kind, budget). **CRUD/interactive:** create form (`createCampaign`); channel + kind selects.

## Marketing

- `/console/marketing` — Marketing overview: metric cards + on-sales / calendar nav cards. **CRUD/interactive:** read-only dashboard with nav links.
- `/console/marketing/calendar` — Two-week marketing-milestone calendar. **CRUD/interactive:** read-only calendar/list view.
- `/console/marketing/onsales` — On-sale schedule list. **CRUD/interactive:** read-only `DataTable` with filterable/groupable columns.
