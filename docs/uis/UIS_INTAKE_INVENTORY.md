# UIS_INTAKE_INVENTORY

**Phase 0 deliverable for the Universal Intake System (UIS) protocol.** Audits every existing intake path in `flyingbluewhale` that produces or updates a participant-shaped record. Findings at the bottom map evidence to the protocol's Phase 0 stop conditions.

**Repo state:** main @ `c3b1673` (2026-05-06).
**Migrations audited:** [`0001_remote_snapshot.sql`](supabase/migrations/0001_remote_snapshot.sql), [`0002_marketplace_canon.sql`](supabase/migrations/0002_marketplace_canon.sql), [`0003_booking_canon.sql`](supabase/migrations/0003_booking_canon.sql), [`20260506000001_onboarding_v2_industry_lead.sql`](supabase/migrations/20260506000001_onboarding_v2_industry_lead.sql).
**Citation discipline:** every claim cites file path + line number. Routes use Next.js group syntax (e.g. `(platform)`); SQL/server actions cite the line where the `insert`/`update`/`CREATE TABLE` lives.

---

## Inventory Table

| #   | Flow                                      | Channel                               | Auth                | Entry route(s)                                                                                                                                                    | Tables touched                                                                                              | Lifecycle starting state                         | Compliance gates                      | Dedup?                                                                                                                                 |
| --- | ----------------------------------------- | ------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 1   | Workspace signup (self-serve)             | `direct_invite` (alt: organic)        | public              | `(auth)/signup` → `signupAction`                                                                                                                                  | `auth.users`, `public.users` (trigger)                                                                      | DISCOVERED                                       | none                                  | yes (Supabase email unique)                                                                                                            |
| 2   | Magic-link login                          | `direct_invite`                       | public              | `(auth)/magic-link` → `magicLinkAction`                                                                                                                           | `auth.users` (existing only)                                                                                | DISCOVERED                                       | none                                  | n/a (sign-in only)                                                                                                                     |
| 3   | Accept invite (email-token)               | `direct_invite`                       | token+auth          | `(auth)/accept-invite/[token]` → `acceptInviteAction`                                                                                                             | `invites`, `memberships`                                                                                    | INTERESTED→COMMITTED                             | none                                  | yes (unique `org_id,user_id`)                                                                                                          |
| 4   | Org admin sends invite                    | `direct_invite`                       | authed (admin)      | `(platform)/console/people/invites/new` → `createInviteAction`                                                                                                    | `invites`                                                                                                   | DISCOVERED                                       | none                                  | yes (`23505` on dup pending)                                                                                                           |
| 5   | SCIM provisioning                         | `import_csv` (provisioning)           | bearer SCIM token   | `/api/scim/v2/Users` (POST)                                                                                                                                       | `users`, `memberships`                                                                                      | DISCOVERED→ENABLED                               | none                                  | yes (`users.email` lookup)                                                                                                             |
| 6   | OAuth/SSO sign-in                         | `direct_invite`                       | OAuth               | `/auth/callback`                                                                                                                                                  | `auth.users`                                                                                                | DISCOVERED                                       | none                                  | yes (provider-side)                                                                                                                    |
| 7   | Engagement-letter accept (offer letter)   | `direct_invite` (token)               | token + access code | `/offer/[token]` → `acceptOffer`                                                                                                                                  | `offer_letters`, `offer_letter_activity`, `crew_members` (FK)                                               | COMMITTED                                        | typed/canvas signature, IP+UA         | n/a (1:1 letter↔crew_member)                                                                                                           |
| 8   | Engagement-letter onboarding              | `direct_invite`                       | token               | `/offer/[token]/onboarding` (read), step updates via `recordCheckIn`                                                                                              | `onboarding_steps`                                                                                          | ENABLED→CONFIRMED                                | per-step (paperwork, safety, travel)  | yes (PK `(offer_letter_id, step_key)`)                                                                                                 |
| 9   | Day-1 check-in                            | `walk_up`                             | token               | `/offer/[token]/checkin` → `recordCheckIn`                                                                                                                        | `offer_letters` (signature_audit), `onboarding_steps` (auto-flip `day_one_checkin`)                         | ACTIVE                                           | none                                  | n/a                                                                                                                                    |
| 10  | Crew-member admin create (PM)             | `direct_invite`                       | authed              | `(platform)/console/people/crew/new` → `createCrewAction`                                                                                                         | `crew_members`                                                                                              | DISCOVERED                                       | none                                  | **none** (no email check)                                                                                                              |
| 11  | Crew-member self EPK upsert               | `referral` (self)                     | authed              | `(personal)/me/crew` → `upsertMyCrewAction`                                                                                                                       | `crew_members`                                                                                              | INTERESTED                                       | none                                  | yes (lookup by `user_id+org_id`)                                                                                                       |
| 12  | Crew CSV import                           | `import_csv`                          | authed              | `POST /api/v1/import/crew-members`                                                                                                                                | `crew_members`, `import_runs`                                                                               | DISCOVERED                                       | none                                  | yes (email or `name+phone`)                                                                                                            |
| 13  | Vendor admin create                       | `direct_invite`                       | authed              | `(platform)/console/procurement/vendors/new` → `createVendorAction`                                                                                               | `vendors`                                                                                                   | DISCOVERED                                       | W-9 flag, COI date (optional)         | **none**                                                                                                                               |
| 14  | Vendor CSV import                         | `import_csv`                          | authed              | `POST /api/v1/import/vendors`                                                                                                                                     | `vendors`, `import_runs`                                                                                    | DISCOVERED                                       | none                                  | yes (email or name)                                                                                                                    |
| 15  | Public RFQ marketplace bid (vendor)       | `marketplace_bid`                     | authed              | `/marketplace/rfqs/[slug]` (read) → `/login?redirect=...` (auth gate); response form not yet wired                                                                | `rfq_responses` (legacy procurement schema)                                                                 | INTERESTED→VETTED                                | prequalification, COI, W-9, NDA flags | partial — unique key `(org_id, requisition_id, vendor_id)`                                                                             |
| 16  | Job posting (operator side)               | n/a (creates listing, not Party)      | authed              | `(platform)/console/marketplace/postings/new` → `createPostingAction`                                                                                             | `job_postings`                                                                                              | n/a                                              | none                                  | n/a                                                                                                                                    |
| 17  | Job application (candidate apply)         | `job_listing`                         | authed              | Marketplace public detail `/marketplace/gigs/[slug]` bounces to `/login?redirect=...`; the apply form & submit action are **not yet implemented** in the codebase | `job_applications` (consumed by `/me/applications`, `/console/marketplace/postings/[postingId]/applicants`) | INTERESTED                                       | screening Qs, vetted-only flag        | unique `(job_posting_id, applicant_user_id) where status<>'withdrawn'`                                                                 |
| 18  | Open call submission (talent/crew/vendor) | `curated_opportunity`                 | authed              | Marketplace public detail `/marketplace/calls/[slug]` bounces to `/login?redirect=.../submit`; submit form & action are **not yet implemented**                   | `open_call_submissions` (consumed by `/me/submissions`, console submissions queue)                          | INTERESTED                                       | depends on `eligibility` jsonb        | unique `(open_call_id, submitter_user_id) where status<>'withdrawn'`                                                                   |
| 19  | Talent EPK self upsert                    | `curated_opportunity` (provider side) | authed              | `(personal)/me/talent` → `upsertMyTalentAction`                                                                                                                   | `talent_profiles`                                                                                           | DISCOVERED→VETTED (`verified_at`)                | none                                  | yes (`user_id+org_id` lookup)                                                                                                          |
| 20  | Talent profile admin create               | `curated_opportunity`                 | authed              | `(platform)/console/marketplace/talent/new` → action                                                                                                              | `talent_profiles`                                                                                           | DISCOVERED                                       | none                                  | **none**                                                                                                                               |
| 21  | Talent offer (booking)                    | `curated_opportunity`                 | authed              | `(platform)/console/marketplace/offers/new` → `createOfferAction`, send/accept/decline                                                                            | `talent_offers`                                                                                             | INTERESTED→COMMITTED                             | rider attachments, terms jsonb        | n/a (state machine on offer, not on Party)                                                                                             |
| 22  | Agency artist signing                     | `referral`                            | authed              | `(platform)/console/agency/roster/[agencyArtistId]` → `updateAgencyArtistAction`                                                                                  | `agency_artists`, `agencies`                                                                                | COMMITTED                                        | commission, exclusive flag, signed_at | unique active `(talent_profile_id) where ended_at IS NULL AND exclusive`                                                               |
| 23  | Lead (sales pipeline)                     | `sales_pipeline`                      | authed              | `(platform)/console/leads/new` → `createLeadAction`                                                                                                               | `leads`                                                                                                     | DISCOVERED                                       | none                                  | **none**                                                                                                                               |
| 24  | Client (organization) create              | `sales_pipeline`                      | authed              | `(platform)/console/clients/new` → `createClientAction`                                                                                                           | `clients`                                                                                                   | DISCOVERED                                       | none                                  | **none**                                                                                                                               |
| 25  | Sponsor entitlement create                | `sales_pipeline`                      | authed              | `(platform)/console/commercial/sponsors/new` → `createEntitlement`                                                                                                | `sponsor_entitlements` (FK to `clients` as `sponsor_client_id`)                                             | COMMITTED                                        | none                                  | n/a                                                                                                                                    |
| 26  | Proposal share-link sign (external)       | `sales_pipeline`                      | token               | `/proposals/[token]` → `signProposalAction`                                                                                                                       | `proposal_signatures`, `proposals`, `proposal_events`                                                       | COMMITTED                                        | typed/canvas signature                | n/a (signer captured per-event)                                                                                                        |
| 27  | Workforce — paid staff                    | `direct_invite`                       | authed              | `(platform)/console/workforce/staff/new` → `createStaff`                                                                                                          | `workforce_members` (`kind='paid_staff'`)                                                                   | DISCOVERED                                       | none                                  | **none**                                                                                                                               |
| 28  | Workforce — contractor                    | `direct_invite`                       | authed              | `(platform)/console/workforce/contractors/new` → `createContractor`                                                                                               | `workforce_members` (`kind='contractor'`)                                                                   | DISCOVERED                                       | none                                  | **none**                                                                                                                               |
| 29  | Workforce — volunteer                     | `volunteer_signup`                    | authed              | `(platform)/console/workforce/volunteers/new` → `createVolunteer`                                                                                                 | `workforce_members` (`kind='volunteer'`)                                                                    | DISCOVERED                                       | none                                  | **none**                                                                                                                               |
| 30  | Accreditation vetting (press, VIP, crew)  | `accreditation_request`               | authed              | `(platform)/console/accreditation/vetting/[applicationId]/edit` → `updateVettingApp` (only updates; create path = admin direct insert)                            | `accreditations`, `accreditation_changes`                                                                   | INTERESTED→VETTED→ENABLED (state machine on row) | photo, valid_from/to, vetting state   | n/a                                                                                                                                    |
| 31  | Accreditation portal view (self)          | `accreditation_request`               | authed              | `(portal)/p/[slug]/apply` (read-only; no submit action)                                                                                                           | `accreditations` (read)                                                                                     | n/a                                              | n/a                                   | n/a                                                                                                                                    |
| 32  | Accreditation change request              | `accreditation_request`               | authed              | `(platform)/console/accreditation/changes/new` → `createChange`                                                                                                   | `accreditation_changes`                                                                                     | INTERESTED                                       | admin review                          | n/a                                                                                                                                    |
| 33  | Delegation (country/team) create          | `accreditation_request`               | authed              | `(platform)/console/participants/delegations/new` → `createDelegation`                                                                                            | `delegations`                                                                                               | DISCOVERED                                       | none                                  | unique constraint on `code` (org-scoped)                                                                                               |
| 34  | Delegation entry (athlete/competitor)     | `accreditation_request`               | authed              | `(platform)/console/participants/entries/new` → `createEntry`                                                                                                     | `delegation_entries`                                                                                        | INTERESTED                                       | none                                  | **none**                                                                                                                               |
| 35  | Form submission (public)                  | `walk_up`                             | public + Turnstile  | `/forms/[slug]` → `submitFormAction`                                                                                                                              | `form_submissions`, Storage:`forms/`                                                                        | INTERESTED                                       | captcha (optional), honeypot          | **none** (only `submitter_email` recorded)                                                                                             |
| 36  | Mobile ticket scan (gate)                 | `walk_up`                             | authed (operator)   | `(mobile)/m/check-in` (UI) → `POST /api/v1/tickets/scan` → `scanTicket`                                                                                           | `tickets` (status update), `ticket_scans`                                                                   | ACTIVE                                           | n/a (validation only)                 | n/a — Party is `tickets.holder_email/holder_name`; tickets themselves are populated by ticketing-vendor sync (no in-app purchase flow) |
| 37  | Ticketing-vendor sync (snapshot)          | `import_csv`                          | authed              | `(platform)/console/settings/integrations/ticketing/[connectionId]` → `recordSalesSnapshotAction`                                                                 | `ticketing_sales_snapshots`, `ticketing_connections`                                                        | n/a (aggregate)                                  | n/a                                   | n/a                                                                                                                                    |
| 38  | Mobile shift check-in (T&A)               | `walk_up`                             | authed              | `POST /api/v1/shifts/checkin`                                                                                                                                     | `shifts` (FK to `workforce_members`)                                                                        | ACTIVE                                           | none                                  | n/a (one shift row per assignment)                                                                                                     |
| 39  | Service request (operator/guest)          | `walk_up`                             | authed              | `(platform)/console/services/requests/...` → action                                                                                                               | `service_requests` (carries `requester_email/name`)                                                         | INTERESTED                                       | none                                  | **none**                                                                                                                               |
| 40  | Medical encounter                         | `walk_up`                             | authed (medic)      | `(mobile)/m/medic/new` → `logEncounter`                                                                                                                           | `medical_encounters` (carries `patient_ref`)                                                                | ACTIVE                                           | clinician signature                   | **none**                                                                                                                               |
| 41  | Daily-log visitor sign-in                 | `walk_up`                             | authed              | `(mobile)/m/daily-log` → `quickCreateDailyLog` (parent), visitor rows separate                                                                                    | `daily_logs`, `daily_log_visitors`, `daily_log_manpower`                                                    | ACTIVE                                           | none                                  | upsert by `(org,project,date)` for log; visitors **none**                                                                              |
| 42  | Safety briefing attendance                | `direct_invite`                       | authed              | console briefing detail (table-only — `safety_briefing_attendees` ack timestamp)                                                                                  | `safety_briefing_attendees`                                                                                 | CONFIRMED                                        | acknowledged_at + signature_path      | unique `(briefing_id, user_id                                                                                                          | crew_member_id)` |
| 43  | Share-link consume (passcode)             | `direct_invite`                       | passcode token      | `/share/[token]` → `submitPasscode`                                                                                                                               | `share_links` (consumes use), forwards to resource                                                          | n/a (visitor-style, not a Party row)             | passcode + use-limit + expires_at     | n/a                                                                                                                                    |
| 44  | Co-pro partnership                        | `referral` (org-to-org)               | authed              | `(platform)/console/bookings/deals/[offerId]/co-pro`                                                                                                              | `co_pro_partnerships` (carries `partner_name`, optional `partner_org_id`)                                   | COMMITTED                                        | split %, contact email                | **none**                                                                                                                               |
| 45  | Crew rating (mutual review)               | n/a (post-engagement)                 | authed              | crew rating UI (no action file yet — table exists)                                                                                                                | `crew_ratings`                                                                                              | CLOSED                                           | direction, score                      | unique `(crew_member_id, project_id, direction)` not enforced                                                                          |
| 46  | Marketplace review (bidirectional)        | n/a (post-engagement)                 | authed              | `(personal)/me/reviews` (read), trigger-driven counterpart                                                                                                        | `reviews`                                                                                                   | CLOSED                                           | trigger inserts counterpart row       | trigger-side, not app-side                                                                                                             |

Citations for each row are inlined in the narrative below.

---

## Flow Detail

### 1. Workspace signup (self-serve)

- **Purpose:** New user registers with email + password, optionally creates an org.
- **Entry:** [`src/app/(auth)/actions.ts:56`](<src/app/(auth)/actions.ts>) (`signupAction`).
- **Tables:** `auth.users` (Supabase), `public.users` populated via Supabase trigger ([snapshot:6239](supabase/migrations/0001_remote_snapshot.sql)).
- **Fields:** `name`, `email`, `password`, optional `orgName`.
- **Owner:** `(auth)` shell; helper `urlFor` from `@/lib/urls`.
- **Channel:** `direct_invite` for the protocol's purposes (no project context yet) — really an organic top-of-funnel.
- **Lifecycle:** DISCOVERED. No project relationship until invite or org creation.
- **Compliance:** none.
- **Overlap:** Same email may later appear as `crew_members.email`, `vendors.contact_email`, `clients.contact_email`, `tickets.holder_email`, etc. — no FK relating those rows back to `users.id`.
- **Dedup:** Yes — `auth.users.email` is unique; the action surfaces "already registered" ([actions.ts:71-77](<src/app/(auth)/actions.ts>)).

### 2. Magic-link login

- **Purpose:** Passwordless re-auth for an existing user.
- **Entry:** [`src/app/(auth)/actions.ts:198`](<src/app/(auth)/actions.ts>) (`magicLinkAction`).
- **Tables:** none new — `shouldCreateUser: false` ([actions.ts:213](<src/app/(auth)/actions.ts>)).
- **Lifecycle:** sign-in only, no Party state change.

### 3. Accept invite

- **Purpose:** Recipient of an admin-issued invite joins the org.
- **Entry:** [`src/app/(auth)/actions.ts:121`](<src/app/(auth)/actions.ts>) (`acceptInviteAction`); URL `/accept-invite/[token]`.
- **Tables:** reads `invites` ([actions.ts:140-145](<src/app/(auth)/actions.ts>)); inserts `memberships` ([actions.ts:158](<src/app/(auth)/actions.ts>)); updates `invites.status='accepted'` ([actions.ts:167-172](<src/app/(auth)/actions.ts>)).
- **Fields:** token only (recipient's identity already in `auth.users`).
- **Compliance:** none.
- **Dedup:** unique `(org_id, user_id)` on `memberships` ([snapshot:4272](supabase/migrations/0001_remote_snapshot.sql)) — duplicate accept treated as success ([actions.ts:160](<src/app/(auth)/actions.ts>)).
- **Lifecycle:** INTERESTED → COMMITTED.

### 4. Org admin sends invite

- **Entry:** [`src/app/(platform)/console/people/invites/actions.ts:18`](<src/app/(platform)/console/people/invites/actions.ts>) (`createInviteAction`).
- **Tables:** `invites` ([snapshot:4007](supabase/migrations/0001_remote_snapshot.sql)).
- **Fields:** `email`, `role` (platform_role enum).
- **Channel:** `direct_invite`. **Compliance:** none. **Dedup:** PK constraint `(org_id, email, status='pending')` enforced via `23505` handler ([actions.ts:38-40](<src/app/(platform)/console/people/invites/actions.ts>)).
- **Lifecycle:** creates DISCOVERED row addressed to an email; the recipient may not yet have a `users` row.

### 5. SCIM provisioning

- **Entry:** [`src/app/api/scim/v2/Users/route.ts:94`](src/app/api/scim/v2/Users/route.ts) (POST handler).
- **Tables:** `users` (idempotent insert, [route.ts:141-147](src/app/api/scim/v2/Users/route.ts)); `memberships` (upsert, [route.ts:155-159](src/app/api/scim/v2/Users/route.ts)).
- **Fields:** SCIM `userName`, `displayName`, `active`.
- **Channel:** `import_csv` (provisioning) per protocol taxonomy.
- **Auth:** SCIM bearer token resolved by `resolveScimAuth`.
- **Dedup:** Yes — `users.email` lookup before insert ([route.ts:120-123](src/app/api/scim/v2/Users/route.ts)).

### 6. OAuth/SSO callback

- **Entry:** [`src/app/auth/callback/route.ts:24`](src/app/auth/callback/route.ts).
- **Tables:** `auth.users` (Supabase mints row on first login).
- **Compliance:** Provider-mediated; same-origin `next` whitelist enforced ([route.ts:8-11](src/app/auth/callback/route.ts)).

### 7. Engagement-letter accept (offer letter)

- **Purpose:** Token-gated public acceptance of a generated engagement letter — flagship "industry-leading" flow added in onboarding v2.
- **Entry:** [`src/app/offer/[token]/actions.ts:47`](src/app/offer/[token]/actions.ts) (`acceptOffer`); access-code unlock at [`actions.ts:15`](src/app/offer/[token]/actions.ts).
- **Tables:** updates `offer_letters.accepted_at/_signature/_ip/_user_agent` via `acceptOfferLetterByToken` ([snapshot:4341](supabase/migrations/0001_remote_snapshot.sql)); inserts `offer_letter_activity` ([snapshot:4325](supabase/migrations/0001_remote_snapshot.sql)). Recipient is denormalized as `crew_member_id` FK on the letter ([snapshot:4345](supabase/migrations/0001_remote_snapshot.sql)).
- **Compliance:** typed signature, IP, UA captured ([actions.ts:53-57](src/app/offer/[token]/actions.ts)). `signature_audit` jsonb added in v2 ([20260506000001:150-180 region](supabase/migrations/20260506000001_onboarding_v2_industry_lead.sql)).
- **Lifecycle:** COMMITTED. Critical document = Offer Letter (RDSP slot 2).

### 8. Engagement-letter onboarding tracker

- **Entry:** [`src/app/offer/[token]/onboarding/page.tsx:1`](src/app/offer/[token]/onboarding/page.tsx) (read); helpers in `@/lib/db/onboarding`.
- **Tables:** `onboarding_steps` ([20260506000001:81](supabase/migrations/20260506000001_onboarding_v2_industry_lead.sql)) — one row per step per offer letter.
- **State machine:** `pending|in_progress|done|waived|blocked` — explicit column.
- **Lifecycle:** ENABLED→CONFIRMED. Critical-path steps gate first-call ([page.tsx:74-83](src/app/offer/[token]/onboarding/page.tsx)).

### 9. Day-1 check-in

- **Entry:** [`src/app/offer/[token]/checkin/page.tsx:1`](src/app/offer/[token]/checkin/page.tsx).
- **Tables:** writes via `recordCheckIn` (helper in `@/lib/db/onboarding`) — affects `offer_letters.signature_audit` and onboarding_steps row.
- **Compliance:** none.
- **Lifecycle:** ACTIVE.

### 10. Crew-member admin create

- **Entry:** [`src/app/(platform)/console/people/crew/actions.ts:19`](<src/app/(platform)/console/people/crew/actions.ts>) (`createCrewAction`).
- **Tables:** `crew_members` ([snapshot:3012](supabase/migrations/0001_remote_snapshot.sql)).
- **Dedup:** **none** — blind insert. PM creating "Sarah Fry" twice yields two rows.
- **Lifecycle:** DISCOVERED.

### 11. Crew-member self EPK upsert

- **Entry:** [`src/app/(personal)/me/crew/actions.ts:39`](<src/app/(personal)/me/crew/actions.ts>) (`upsertMyCrewAction`).
- **Tables:** `crew_members` (extended in 0002 with `is_public_profile`, `public_handle`, etc., per CLAUDE.md).
- **Dedup:** Yes — looks up existing row by `user_id+org_id` ([actions.ts:46-49](<src/app/(personal)/me/crew/actions.ts>)).
- **Note:** Same human can have one `crew_members` row per (user, org) — but the same human admin-created in flow 10 will produce a second row that does **not** auto-link.

### 12. Crew CSV import

- **Entry:** [`src/app/api/v1/import/crew-members/route.ts:33`](src/app/api/v1/import/crew-members/route.ts) (POST).
- **Tables:** `crew_members`, `import_runs` (audit, [route.ts:99-106](src/app/api/v1/import/crew-members/route.ts)).
- **Dedup:** Yes — set built from existing crew by email-or-`name+phone` ([route.ts:54-59](src/app/api/v1/import/crew-members/route.ts)).

### 13. Vendor admin create

- **Entry:** [`src/app/(platform)/console/procurement/vendors/actions.ts:19`](<src/app/(platform)/console/procurement/vendors/actions.ts>).
- **Tables:** `vendors` ([snapshot:6585](supabase/migrations/0001_remote_snapshot.sql)).
- **Compliance fields recorded but not enforced:** `w9_on_file`, `coi_expires_at`.
- **Dedup:** **none**.

### 14. Vendor CSV import

- **Entry:** [`src/app/api/v1/import/vendors/route.ts:20`](src/app/api/v1/import/vendors/route.ts).
- **Dedup:** Yes — existing-key set by email-or-name ([route.ts:43](src/app/api/v1/import/vendors/route.ts)).

### 15. Public RFQ marketplace bid

- **Public entry:** [`src/app/(marketing)/marketplace/rfqs/[slug]/page.tsx:1`](<src/app/(marketing)/marketplace/rfqs/[slug]/page.tsx>) reads from `public_rfq_marketplace` view; CTA is `/login?redirect=/marketplace/rfqs/[slug]` ([page.tsx:87](<src/app/(marketing)/marketplace/rfqs/[slug]/page.tsx>)) — i.e., the actual response form is **not yet implemented**.
- **Existing target table:** `rfq_responses` ([snapshot:5550](supabase/migrations/0001_remote_snapshot.sql)) — legacy procurement schema, keyed by `(org_id, requisition_id, vendor_id)`.
- **RFQ publish action:** [`src/app/(platform)/console/procurement/rfqs/[rfqId]/publish/actions.ts:32`](<src/app/(platform)/console/procurement/rfqs/[rfqId]/publish/actions.ts>) — sets visibility, public_slug, compliance gates (`requires_prequalification`, `requires_insurance`, `requires_w9`, `nda_required`).
- **Compliance gates:** evaluated app-side, not DB-side, per CLAUDE.md.
- **Defect:** the public-side bid-submission flow is a stub; the legacy `rfq_responses` schema is keyed on `vendor_id` (org-internal vendor record), not on the bidding party. A vendor responding via the public marketplace currently has nowhere to land.

### 16. Job posting (operator side, listing-only)

- **Entry:** [`src/app/(platform)/console/marketplace/postings/new/actions.ts:47`](<src/app/(platform)/console/marketplace/postings/new/actions.ts>) (`createPostingAction`).
- **Tables:** `job_postings` ([0002:394](supabase/migrations/0002_marketplace_canon.sql)).
- This row is the JD analog (RDSP slot 1). No participant created here.

### 17. Job application

- **Public entry:** [`src/app/(marketing)/marketplace/gigs/[slug]/page.tsx`](<src/app/(marketing)/marketplace/gigs/[slug]/page.tsx>) reads from `public_job_board`; "Apply" CTA bounces to `/login?redirect=...`. **No submit action wired in `src/app` for `job_applications`** — schema, RLS, and `/me/applications` and console reviewer pages exist but the inbound write path does not.
- **Schema:** `job_applications` ([0002:452](supabase/migrations/0002_marketplace_canon.sql)) carries `applicant_user_id`, optional `crew_member_id`, `cover_note`, `resume_url`, `reel_url`, `day_rate_proposed_cents`, `answers` jsonb.
- **Dedup:** unique `(job_posting_id, applicant_user_id) where status<>'withdrawn'` ([0002:479](supabase/migrations/0002_marketplace_canon.sql)).
- **Reviewer flows:** `(platform)/console/marketplace/postings/[postingId]/applicants/[applicationId]/actions.ts` updates status; doesn't create.

### 18. Open call submission

- **Public entry:** [`src/app/(marketing)/marketplace/calls/[slug]/page.tsx`](<src/app/(marketing)/marketplace/calls/[slug]/page.tsx>) — same pattern as #17, "Submit" → `/login?redirect=.../submit`. **No submit action wired**.
- **Schema:** `open_call_submissions` ([0002:300](supabase/migrations/0002_marketplace_canon.sql)) — submitter is `submitter_user_id`; subject can be one of `talent_profile_id`, `crew_member_id`, `vendor_id` (mutex via check constraint at [0002:323-328](supabase/migrations/0002_marketplace_canon.sql)).
- **Dedup:** unique `(open_call_id, submitter_user_id) where status<>'withdrawn'` ([0002:342](supabase/migrations/0002_marketplace_canon.sql)).

### 19. Talent EPK self upsert

- **Entry:** [`src/app/(personal)/me/talent/actions.ts:35`](<src/app/(personal)/me/talent/actions.ts>) (`upsertMyTalentAction`).
- **Tables:** `talent_profiles` ([0002:160](supabase/migrations/0002_marketplace_canon.sql)).
- **Dedup:** Yes — by `user_id+org_id` ([actions.ts:42-49](<src/app/(personal)/me/talent/actions.ts>)).
- **Public surface:** `is_public` flag + `verified_at` gate the marketplace EPK detail page.

### 20. Talent profile admin create

- **Entry:** [`src/app/(platform)/console/marketplace/talent/new/actions.ts`](<src/app/(platform)/console/marketplace/talent/new/actions.ts>).
- **Dedup:** **none** in the new-create path.

### 21. Talent offer (booking)

- **Entry:** [`src/app/(platform)/console/marketplace/offers/new/actions.ts:27`](<src/app/(platform)/console/marketplace/offers/new/actions.ts>) (`createOfferAction`); send/accept/decline same file.
- **Tables:** `talent_offers` ([0002:347](supabase/migrations/0002_marketplace_canon.sql)).
- **State machine:** `draft|sent|accepted|declined|...` on the offer row (not the Party).
- **Default terms:** `deposit_pct=60`, `balance_terms='load_in'` per `feedback_payment_terms_default.md`.

### 22. Agency artist signing

- **Entry:** [`src/app/(platform)/console/agency/roster/[agencyArtistId]/actions.ts:19`](<src/app/(platform)/console/agency/roster/[agencyArtistId]/actions.ts>).
- **Tables:** `agency_artists`, `agencies` ([0003:228, 0003:253](supabase/migrations/0003_booking_canon.sql)).
- **Dedup:** unique active `(talent_profile_id) where ended_at IS NULL AND exclusive` ([0003:277-279](supabase/migrations/0003_booking_canon.sql)).

### 23. Lead (sales pipeline)

- **Entry:** [`src/app/(platform)/console/leads/actions.ts:25`](<src/app/(platform)/console/leads/actions.ts>).
- **Tables:** `leads` ([snapshot:4149](supabase/migrations/0001_remote_snapshot.sql)) — carries `email`, `phone`.
- **Dedup:** **none**.
- **Stages:** `new|qualified|contacted|proposal|won|lost`.

### 24. Client (organization) create

- **Entry:** [`src/app/(platform)/console/clients/actions.ts:19`](<src/app/(platform)/console/clients/actions.ts>).
- **Tables:** `clients` ([snapshot:2912](supabase/migrations/0001_remote_snapshot.sql)).
- **Dedup:** **none**.
- **Type discrimination:** `clients` is an organization in disguise — no formal Person/Org distinction.

### 25. Sponsor entitlement create

- **Entry:** [`src/app/(platform)/console/commercial/sponsors/new/actions.ts:18`](<src/app/(platform)/console/commercial/sponsors/new/actions.ts>).
- **Tables:** `sponsor_entitlements` ([snapshot:5893](supabase/migrations/0001_remote_snapshot.sql)) — FK `sponsor_client_id` to `clients`.
- **Note:** Sponsor isn't its own table — it's a `clients` row plus this entitlement row. The sponsor onboarding flow is therefore **not a participant flow** at the schema level; the brand's contact (named human) lives only in `clients.contact_email`.

### 26. Proposal share-link sign (external)

- **Entry:** [`src/app/proposals/[token]/actions.ts:27`](src/app/proposals/[token]/actions.ts) (`signProposalAction`).
- **Tables:** `proposal_signatures` ([snapshot:5234](supabase/migrations/0001_remote_snapshot.sql)), updates `proposals.signed_at/signer_name/signer_email` ([actions.ts:55-65](src/app/proposals/[token]/actions.ts)), inserts `proposal_events`.
- **Identity captured:** `signer_name`, `signer_email`, `signer_role` — **plain text fields, not FKs** to `users` or `clients`.
- **Lifecycle:** COMMITTED. Critical document = Offer Letter analog.

### 27–29. Workforce — staff / contractor / volunteer

- **Entries:** [`(platform)/console/workforce/staff/new/actions.ts:18`](<src/app/(platform)/console/workforce/staff/new/actions.ts>), [`contractors/new/actions.ts:18`](<src/app/(platform)/console/workforce/contractors/new/actions.ts>), [`volunteers/new/actions.ts:18`](<src/app/(platform)/console/workforce/volunteers/new/actions.ts>).
- **Tables:** all three insert into `workforce_members` ([snapshot:6894](supabase/migrations/0001_remote_snapshot.sql)) discriminated by `kind` enum (`paid_staff|contractor|volunteer`). The same row shape is reached from three URLs.
- **Dedup:** **none** in any of the three.
- **Overlap:** A "contractor" here can also exist as a `crew_members` row (different table) and a `users`/`memberships` row — none auto-link.

### 30. Accreditation vetting

- **Entry:** [`src/app/(platform)/console/accreditation/vetting/[applicationId]/edit/actions.ts:20`](<src/app/(platform)/console/accreditation/vetting/[applicationId]/edit/actions.ts>) (`updateVettingApp`) — only updates; the create path is direct admin insert on `accreditations`.
- **Tables:** `accreditations` ([snapshot:2561](supabase/migrations/0001_remote_snapshot.sql)) — carries `person_name`, `person_email`, optional `user_id`, optional `delegation_id`, `state` (`accreditation_state` enum), `vetting` (`vetting_state` enum).
- **State machine:** explicit on the row — `applied|vetting|approved|issued|suspended|revoked` with separate `vetting` column.
- **Lifecycle:** explicit DISCOVERED→INTERESTED→VETTED→ENABLED chain on the row, but **separate from** offer-letter onboarding state.

### 31. Accreditation portal view (self)

- **Entry:** [`src/app/(portal)/p/[slug]/apply/page.tsx:62`](<src/app/(portal)/p/[slug]/apply/page.tsx>) reads accreditations matching `user_id`. **No portal-side submit action** — copy says "your producer will invite you" ([page.tsx:111](<src/app/(portal)/p/[slug]/apply/page.tsx>)).

### 32. Accreditation change request

- **Entry:** [`src/app/(platform)/console/accreditation/changes/new/actions.ts:17`](<src/app/(platform)/console/accreditation/changes/new/actions.ts>).
- **Tables:** `accreditation_changes` ([snapshot:2544](supabase/migrations/0001_remote_snapshot.sql)).

### 33. Delegation create

- **Entry:** [`src/app/(platform)/console/participants/delegations/new/actions.ts:19`](<src/app/(platform)/console/participants/delegations/new/actions.ts>).
- **Tables:** `delegations` ([snapshot:3233](supabase/migrations/0001_remote_snapshot.sql)).
- **Type:** Organization (country/team), not person. Carries `attache_user_id` FK to `users`.

### 34. Delegation entry (athlete/competitor)

- **Entry:** [`src/app/(platform)/console/participants/entries/new/actions.ts:19`](<src/app/(platform)/console/participants/entries/new/actions.ts>).
- **Tables:** `delegation_entries` ([snapshot:3218](supabase/migrations/0001_remote_snapshot.sql)) — `participant_name` is plain text, no FK to a person record.
- **Dedup:** **none**.

### 35. Form submission (public)

- **Entry:** [`src/app/forms/[slug]/actions.ts:36`](src/app/forms/[slug]/actions.ts) (`submitFormAction`) — uses service-role client because forms are public.
- **Tables:** `form_submissions` ([snapshot:3575](supabase/migrations/0001_remote_snapshot.sql)) plus Supabase Storage `forms/` bucket for file fields.
- **Anti-spam:** Cloudflare Turnstile (optional) + honeypot ([actions.ts:56-59, 97-100](src/app/forms/[slug]/actions.ts)).
- **Dedup:** **none** — `submitter_email` only stored if a field named `email` is present and looks valid ([actions.ts:102-103](src/app/forms/[slug]/actions.ts)).
- **Critical defect for UIS:** form submissions are the most likely intake of brand-new humans (volunteer signups, vendor registration, press accreditation), but they land in a free-form `payload` jsonb with no Party linkage.

### 36. Mobile ticket scan (gate)

- **Entry:** [`src/app/api/v1/tickets/scan/route.ts:11`](src/app/api/v1/tickets/scan/route.ts) — UI: [`src/app/(mobile)/m/check-in/CheckInScanner.tsx`](<src/app/(mobile)/m/check-in/CheckInScanner.tsx>).
- **Tables:** `tickets` (status update only, [tickets.ts:36-40](src/lib/db/tickets.ts)), `ticket_scans` insert ([tickets.ts:43-48](src/lib/db/tickets.ts)).
- **Identity:** `tickets.holder_name/holder_email` is the entire Party record — plain text on the ticket row ([snapshot:6125-6126](supabase/migrations/0001_remote_snapshot.sql)).
- **Note:** the **ticket-purchase intake itself is not in the codebase** — `tickets` rows arrive via 3rd-party ticketing-vendor sync (#37) or manual import. No internal commerce flow exists.

### 37. Ticketing-vendor sales snapshot

- **Entry:** [`src/app/(platform)/console/settings/integrations/ticketing/[connectionId]/actions.ts:28`](<src/app/(platform)/console/settings/integrations/ticketing/[connectionId]/actions.ts>) (`recordSalesSnapshotAction`).
- **Tables:** `ticketing_sales_snapshots` ([0003:206](supabase/migrations/0003_booking_canon.sql)), bumps `ticketing_connections.last_synced_at`.
- **Note:** aggregate counts only — no per-Party detail.

### 38. Mobile shift check-in (T&A)

- **Entry:** [`src/app/api/v1/shifts/checkin/route.ts:15`](src/app/api/v1/shifts/checkin/route.ts).
- **Tables:** `shifts` (FK to `workforce_members`).
- **Lifecycle:** ACTIVE.

### 39. Service request (operator/guest)

- **Schema:** `service_requests` ([snapshot:5715](supabase/migrations/0001_remote_snapshot.sql)) — carries `requester_email`, `requester_name`, optional `requester_id` FK to `users`.
- **Note:** anonymous requesters (guests, vendors) leave only email/name on the row, not a Party row.

### 40. Medical encounter

- **Entry:** [`src/app/(mobile)/m/medic/new/actions.ts:22`](<src/app/(mobile)/m/medic/new/actions.ts>) (`logEncounter`).
- **Tables:** `medical_encounters` ([snapshot:4254](supabase/migrations/0001_remote_snapshot.sql)) — patient identity is `patient_ref` (free text), PHI in `phi_encrypted` jsonb.
- **Note:** patient is not a Party row. By design (PHI isolation), but means the patient is invisible to the rest of the system.

### 41. Daily-log visitor sign-in

- **Entry:** [`src/app/(mobile)/m/daily-log/actions.ts:16`](<src/app/(mobile)/m/daily-log/actions.ts>).
- **Tables:** `daily_logs`, plus `daily_log_visitors`/`daily_log_manpower`/`daily_log_equipment`/`daily_log_deliveries`/`daily_log_photos` ([snapshot:3090-3173](supabase/migrations/0001_remote_snapshot.sql)).
- **Dedup:** parent log upserts on `(org,project,date)` ([actions.ts:23-29](<src/app/(mobile)/m/daily-log/actions.ts>)). Visitor child rows: **none**.

### 42. Safety briefing attendance

- **Tables:** `safety_briefing_attendees` ([snapshot:5661](supabase/migrations/0001_remote_snapshot.sql)) — references either `user_id` or `crew_member_id` plus `acknowledged_at` and `signature_path`. Insert path is admin/console-side (not located in a public action file in the audit).
- **Dedup:** unique on `(briefing_id, user_id|crew_member_id)`.
- **Lifecycle:** CONFIRMED gate.

### 43. Share-link consume (passcode)

- **Entry:** [`src/app/share/[token]/actions.ts:23`](src/app/share/[token]/actions.ts) (`submitPasscode`).
- **Tables:** `share_links` (consumes a use), forwards to `resolveResourceUrl`.
- **Note:** visitor-only — no Party row created.

### 44. Co-pro partnership

- **Entry:** [`src/app/(platform)/console/bookings/deals/[offerId]/co-pro/actions.ts`](<src/app/(platform)/console/bookings/deals/[offerId]/co-pro/actions.ts>).
- **Tables:** `co_pro_partnerships` ([0003:338](supabase/migrations/0003_booking_canon.sql)) — `partner_org_id` optional; `partner_name` mandatory text.

### 45. Crew rating (mutual review)

- **Schema:** `crew_ratings` ([20260506000001:129](supabase/migrations/20260506000001_onboarding_v2_industry_lead.sql)).
- **Note:** No write path located in `src/app` — the table exists, the UI does not yet.

### 46. Marketplace review (bidirectional)

- **Schema:** `reviews` ([0002:517](supabase/migrations/0002_marketplace_canon.sql)) with trigger-driven counterpart row insert per CLAUDE.md.
- **Insert path:** Not directly via a public action file in the audit; consumed by `/me/reviews` and console reviews queue. Per CLAUDE.md, "insert a counterpart review on the same `(transaction_type, transaction_id)` and both rows auto-flip `released_at=now()`."

---

## Findings

### Independent participant tables

The audit identifies **17 distinct tables that store a participant-shaped record** (a person or organization touching a project). Each can hold the same human as a separate row with no FK linkage:

1. [`users`](supabase/migrations/0001_remote_snapshot.sql:6239) — auth identity (name, email, avatar)
2. [`memberships`](supabase/migrations/0001_remote_snapshot.sql:4272) — `(user, org, role)` tuples
3. [`invites`](supabase/migrations/0001_remote_snapshot.sql:4007) — pending invitations addressed by email
4. [`crew_members`](supabase/migrations/0001_remote_snapshot.sql:3012) — production crew (name, email, phone, role, day_rate)
5. [`workforce_members`](supabase/migrations/0001_remote_snapshot.sql:6894) — staff/contractor/volunteer (full_name, email, phone, role)
6. [`vendors`](supabase/migrations/0001_remote_snapshot.sql:6585) — vendor orgs (name, contact_email, COI/W-9 flags)
7. [`clients`](supabase/migrations/0001_remote_snapshot.sql:2912) — client orgs (name, contact_email/phone, used as sponsor anchor)
8. [`leads`](supabase/migrations/0001_remote_snapshot.sql:4149) — sales-pipeline humans (name, email, phone)
9. [`talent_profiles`](supabase/migrations/0002_marketplace_canon.sql:160) — booking-side EPK
10. [`agencies`](supabase/migrations/0003_booking_canon.sql:228) — agencies (org-level)
11. [`agency_artists`](supabase/migrations/0003_booking_canon.sql:253) — artist↔agency relationship rows
12. [`accreditations`](supabase/migrations/0001_remote_snapshot.sql:2561) — `(person_name, person_email, user_id?, delegation_id?)` + state machine
13. [`delegations`](supabase/migrations/0001_remote_snapshot.sql:3233) — country/team orgs
14. [`delegation_entries`](supabase/migrations/0001_remote_snapshot.sql:3218) — competitors (`participant_name` text)
15. [`tickets`](supabase/migrations/0001_remote_snapshot.sql:6120) — guests (holder_name, holder_email)
16. [`job_applications`](supabase/migrations/0002_marketplace_canon.sql:452) — applicants (FK to `users` + optional `crew_members`)
17. [`open_call_submissions`](supabase/migrations/0002_marketplace_canon.sql:300) — submitters (FK to `users` + optional talent/crew/vendor)

That's **far above the protocol's >3-table threshold**. (The protocol's Phase 0 stop condition: "if the inventory reveals more than three independent participant tables, flag this as the core problem to solve.")

Auxiliary/transactional tables that store **denormalized identity but aren't the primary participant record** — listed for completeness:

- `proposal_signatures.signer_name/email` ([snapshot:5234](supabase/migrations/0001_remote_snapshot.sql))
- `service_requests.requester_email/name` ([snapshot:5715](supabase/migrations/0001_remote_snapshot.sql))
- `co_pro_partnerships.partner_name/contact_email` ([0003:338](supabase/migrations/0003_booking_canon.sql))
- `safety_briefing_attendees.user_id|crew_member_id` ([snapshot:5661](supabase/migrations/0001_remote_snapshot.sql))
- `medical_encounters.patient_ref` ([snapshot:4254](supabase/migrations/0001_remote_snapshot.sql))
- `daily_log_visitors` (free-text)
- `form_submissions.payload` (jsonb catchall) — see `submitter_email` at [snapshot:3575](supabase/migrations/0001_remote_snapshot.sql)
- `offer_letters.crew_member_id` (FK; not its own Party row)
- `co_pro_partnerships`, `event_milestones`, `delegation_entries.attache_user_id`, etc.

### Same-Party-many-tables defects (top 3 concrete examples)

1. **Sarah Fry, Project Director on EDCLV26 Salvage City** can simultaneously be:
   - a `users` row (signup),
   - a `memberships` row (`org_admin` on the demo org),
   - a `crew_members` row (created by PM in the people module, [actions.ts:24](<src/app/(platform)/console/people/crew/actions.ts>)) — which is also referenced by an `offer_letters.crew_member_id` ([snapshot:4345](supabase/migrations/0001_remote_snapshot.sql)),
   - a `crew_members` row a _second time_ via the self-EPK flow ([actions.ts:39](<src/app/(personal)/me/crew/actions.ts>)) if she opts into a public profile, only deduped by `user_id+org_id` lookup,
   - a `safety_briefing_attendees` row (FK to either `user_id` or `crew_member_id` — both possible),
   - a `proposal_signatures.signer_name='Sarah Fry'` row (free text), and
   - a `tickets.holder_name='Sarah Fry'` row if she also bought a guest ticket via a 3rd-party vendor.
     That's **up to 7 different rows for one human**, only two of which (`crew_members` self vs. admin-create) have any dedup at all, and zero of which back-reference each other transitively.

2. **A vendor responding to a public RFQ on the marketplace.** The marketplace public detail page exists ([rfqs/[slug]/page.tsx:32](<src/app/(marketing)/marketplace/rfqs/[slug]/page.tsx>)) but the bid-submission action does not. If/when wired, a vendor bidding via the public path produces a `users` row + `memberships` row + (potentially) a `vendors` row in the buyer's org, with no schema link between (a) the bidder's own org's vendor record and (b) the buyer-org's vendor record. The legacy `rfq_responses.vendor_id` ([snapshot:5554](supabase/migrations/0001_remote_snapshot.sql)) presumes a vendor record already exists in the buyer's org — an impedance mismatch with public marketplace bidding.

3. **A festival headliner.** Same human can be a `talent_profiles` row (EPK), a `crew_members` row (if they also gig as a tech), an `agency_artists` row (signed to an agency), a `talent_offers` row (booked for the date), an `accreditations` row (issued credential), an `offer_letters.crew_member_id` reference (engagement letter), a `delegation_entries.participant_name` row (free text), and a `safety_briefing_attendees` row. Each is independent.

### Channels with no dedup (blind-insert intake paths)

- **Crew admin create** — [actions.ts:24](<src/app/(platform)/console/people/crew/actions.ts>) ([flow #10](#10-crew-member-admin-create))
- **Vendor admin create** — [actions.ts:24](<src/app/(platform)/console/procurement/vendors/actions.ts>) ([flow #13](#13-vendor-admin-create))
- **Lead create** — [actions.ts:32](<src/app/(platform)/console/leads/actions.ts>) ([flow #23](#23-lead-sales-pipeline))
- **Client create** — [actions.ts:25](<src/app/(platform)/console/clients/actions.ts>) ([flow #24](#24-client-organization-create))
- **Workforce staff/contractor/volunteer** — three separate URLs, all blind ([flows #27–29](#2729-workforce--staff--contractor--volunteer))
- **Talent admin create** — [marketplace/talent/new/actions.ts](<src/app/(platform)/console/marketplace/talent/new/actions.ts>) ([flow #20](#20-talent-profile-admin-create))
- **Delegation entries** — [actions.ts:24](<src/app/(platform)/console/participants/entries/new/actions.ts>) ([flow #34](#34-delegation-entry-athletecompetitor))
- **Form submissions** — [actions.ts:109](src/app/forms/[slug]/actions.ts) — never checks if `submitter_email` matches a known Party
- **Service requests** — `requester_email/name` written without dedup
- **Co-pro partnerships** — partner identity is `partner_name` text

The dedup that _does_ exist is local-only: each of the marketplace tables has a unique key on `(opportunity, submitter_user_id)` to prevent double-submission to the same gig, but none of them check whether the same human submitted to a _different_ gig under a different email.

### Document-chain coverage (RDSP — JD / Offer Letter / KBYG / Pre-Arrival)

| Channel                                | JD analog                    | Offer Letter analog                                 | KBYG analog                                  | Pre-Arrival analog                |
| -------------------------------------- | ---------------------------- | --------------------------------------------------- | -------------------------------------------- | --------------------------------- |
| Engagement letter (crew/talent direct) | `org_roles` (enriched in v2) | `offer_letters` ✓                                   | `event_guides` (per-persona Boarding Pass) ✓ | `onboarding_steps` ✓ + check-in ✓ |
| Job listing                            | `job_postings` ✓             | — (no offer-letter handoff from `job_applications`) | —                                            | —                                 |
| Open call                              | `open_calls` ✓               | `talent_offers` (only for talent kind)              | —                                            | —                                 |
| Marketplace RFQ                        | `rfqs.title/description`     | —                                                   | —                                            | —                                 |
| Sponsor                                | proposals (loosely)          | `proposals` + signatures ✓                          | `event_guides` (sponsor persona) ✓           | —                                 |
| Ticket purchase                        | `ticket_types`               | `tickets.code` (the ticket itself)                  | — (no guest KBYG)                            | —                                 |
| Accreditation                          | `accreditation_categories`   | `accreditations` (issued card)                      | —                                            | —                                 |
| Volunteer                              | — (no JD for volunteers)     | —                                                   | —                                            | —                                 |
| Press / VIP                            | —                            | —                                                   | —                                            | —                                 |

Coverage is **deepest for the engagement-letter (crew/talent) channel** — offer letter, KBYG, onboarding tracker, day-1 check-in all exist (the `feedback_no_redirect_stubs.md` and `feedback_8_phase_lifecycle.md` memos drove this). It is **bare for ticket purchase, volunteer signup, and press accreditation** — these channels have a participant record but no document chain at all.

### Lifecycle-state coverage (explicit state-machine columns?)

Tables with an explicit lifecycle column on the row:

- `accreditations.state` — `applied|vetting|approved|issued|suspended|revoked` ([snapshot:2569](supabase/migrations/0001_remote_snapshot.sql)) + separate `vetting` column.
- `offer_letters.status` — `draft|sent|accepted|declined|withdrawn` ([snapshot:4367](supabase/migrations/0001_remote_snapshot.sql)).
- `talent_offers.status` — `draft|sent|accepted|declined|...` ([0002:364](supabase/migrations/0002_marketplace_canon.sql)).
- `job_applications.status` — `new|reviewed|interview|offered|hired|rejected|withdrawn` ([0002:464](supabase/migrations/0002_marketplace_canon.sql)).
- `open_call_submissions.status` — same enum family ([0002:313](supabase/migrations/0002_marketplace_canon.sql)).
- `tickets.status` — `issued|scanned|voided|refunded` ([snapshot:6128](supabase/migrations/0001_remote_snapshot.sql)).
- `onboarding_steps.status` — `pending|in_progress|done|waived|blocked` ([20260506000001:92](supabase/migrations/20260506000001_onboarding_v2_industry_lead.sql)).
- `leads.stage` — `new|qualified|contacted|proposal|won|lost` ([snapshot:4156](supabase/migrations/0001_remote_snapshot.sql)).
- `service_requests.status` — `open|acknowledged|in_progress|resolved|cancelled` ([snapshot:5745](supabase/migrations/0001_remote_snapshot.sql)).

Tables with **no lifecycle column** (state inferred from joins or null-check timestamps):

- `users`, `crew_members`, `workforce_members`, `vendors`, `clients`, `talent_profiles` (only `verified_at`), `delegation_entries` (only a free-text `status`), `delegations`.

So lifecycle is per-document/per-engagement, not per-Party. A Party today has no lifecycle state because there is no Party.

### Auth/Routing notes

- `withAuth` from `@/lib/auth` gates every API route ([CLAUDE.md](CLAUDE.md)).
- `requireSession` gates server actions in console/me/portal.
- Public surfaces are: `/forms/[slug]`, `/proposals/[token]`, `/offer/[token]`, `/share/[token]`, `/marketplace/*` (read-only), `/api/scim/v2/*` (bearer SCIM token), `/api/v1/webhooks/stripe`, `/auth/callback`.

---

## Phase 0 stop-condition assessment

| Stop condition                                        | Fires?                                                  | Evidence                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **>3 independent participant tables**                 | **YES** (17, plus ~9 satellite identity-bearing tables) | See "Independent participant tables count" above.                                                                                                                                                                                                                                                                                                                             |
| **<3 independent intake flows (UIS over-engineered)** | NO                                                      | 46 distinct flows catalogued.                                                                                                                                                                                                                                                                                                                                                 |
| **Existing canonical participant table close to UIS** | NO                                                      | None of the 17 tables aspires to canonical — `users` is auth-only, `crew_members` and `workforce_members` overlap, neither is intended as universal. The closest thing to a canonical layer is the **XPMS atom layer** (`xpms_atom_id` on `crew_members`, [snapshot:3024](supabase/migrations/0001_remote_snapshot.sql)) but it's only wired on crew, not on parties broadly. |
| **A Role type that doesn't fit XTC class**            | DEFER                                                   | Phase 2 work; Phase 0 doesn't surface this.                                                                                                                                                                                                                                                                                                                                   |
| **UI conflict (HVRBOR vs ATLVS)**                     | DEFER                                                   | Phase 7 work.                                                                                                                                                                                                                                                                                                                                                                 |
| **Legacy data quality blocks dedup**                  | LIKELY (preview)                                        | Crew/workforce/vendor admin-create paths blind-insert with no email check, so any legacy data has duplicate humans. A data-cleansing pre-phase will be required ahead of any backfill.                                                                                                                                                                                        |

### Recommendation

**Schema consolidation will dominate the migration plan** (the protocol's verbatim language for this stop condition). Specifically:

1. The 17 participant-shaped tables collapse to a `parties` + `party_identities` + `party_relationships` triple per Phase 1, with the existing tables either renamed to `roles` (if they carry project/role context) or merged into `party_identities`/`party_relationships`.
2. `crew_members`, `workforce_members`, `talent_profiles`, `vendors`, `agencies`, `clients`, `delegations` are the canonical Role records — they should keep their domain-specific columns but lose the embedded identity fields (`name`, `email`, `phone`) which migrate to `party_identities`.
3. The four existing strong document chains (engagement-letter onboarding, talent-offer booking, job-application ATS, open-call submission) become **specializations of the universal RDSP chain**, not parallel implementations.
4. The blind-insert intake paths (flows #10, #13, #20, #23, #24, #27–29, #34, #35) need a Phase-0.5 patch: add an email-match dedup-prompt at the action layer before the migration lands, so the dataset isn't compounding the problem during the migration window.
5. The two **public marketplace bid/apply/submit flows that don't yet have a write path** (#15, #17, #18) should be designed against the new UIS schema rather than against the legacy `rfq_responses` / `job_applications` / `open_call_submissions` tables — i.e. don't ship the gap before Phase 1 is decided.
