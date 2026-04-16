# GVTEWAY (Gateway) -- Phase 0 Discovery

## 1. Repo Audit: boardingpass (ghxstship/boardingpass)

### Overview
Boardingpass is a **static Next.js 16 site** serving role-tiered "Know Before You Go" guides for a single event (Black Coffee + Carlita + Kaz James -- Open Air at the Racetrack, Miami Music Week 2026). It is deployed at `productionsite.guide`.

### Stack
- **Framework:** Next.js 16.2.1 (App Router)
- **React:** 19.2.4
- **Styling:** Tailwind CSS v4 (postcss plugin)
- **Fonts:** Syne (display), Plus Jakarta Sans (body), Geist Mono
- **Build:** TypeScript 5, React Compiler enabled
- **Database:** None
- **Auth:** None
- **API:** None
- **Supabase:** Not present

### File Disposition

| Path | Type | Disposition |
|---|---|---|
| `src/app/layout.tsx` | Root layout | **REPLACE** -- new GVTEWAY layout with auth, nav, theming |
| `src/app/page.tsx` | Home page (guide index) | **REPLACE** -- GVTEWAY landing/dashboard |
| `src/app/globals.css` | Theme tokens (pink accent, light mode) | **REPLACE** -- GVTEWAY design system (cyan accent, dark mode) |
| `src/app/guide/[slug]/page.tsx` | Guide detail page | **REMOVE** -- not part of platform |
| `src/components/GuideView.tsx` | 1000-line guide renderer | **REMOVE** -- not part of platform |
| `src/data/*.ts` | Static event data (6 guide configs) | **REMOVE** -- replaced by database-driven content |
| `src/data/types.ts` | Guide config types | **REMOVE** -- replaced by DB schema types |
| `src/fonts/` | Syne, Plus Jakarta Sans | **REMOVE** -- replace with Anton, Bebas Neue, Share Tech |
| `public/` | Next.js default SVGs | **REPLACE** -- GVTEWAY brand assets |
| `AGENTS.md` | Next.js agent rules | **KEEP** |
| `CLAUDE.md` | Points to AGENTS.md | **KEEP** |
| `package.json` | Dependencies | **MODIFY** -- add Supabase, auth, UI deps |
| `next.config.ts` | Minimal config | **MODIFY** -- add env vars, image domains |
| `tsconfig.json` | TS config | **KEEP** |
| `postcss.config.mjs` | PostCSS config | **KEEP** |

### Verdict
The repo provides a clean Next.js 16 + Tailwind v4 starter shell. All content/data files are replaced. The framework configuration (App Router, React Compiler, TS) is reusable. **No existing database schema, auth, roles, or API to extend.**

---

## 2. Boardingpass Roles (As-Is)

Boardingpass uses **content tiers** (not RBAC roles) to filter guide content:

| Tier | Title | Scope | Target |
|---|---|---|---|
| T1 | Production | Executive, Admin, Site, Technical, Experiential | Internal crew |
| T2 | Operations | Access Control, Public Safety, Security, Guest Services, Traffic, Cleaning | Internal ops |
| T3 | Food & Beverage | Bar, VIP Table Service, Catering, Concessions | Internal F&B |
| T4 | Talent & Industry | Artists, Touring Parties, Management, Agents, Industry Guests, Media | External talent |
| T5 | Guests | GA, VIP, VIP Table Reservations | External guests |
| T6 | Temporary Access | Logistics, Deliveries, Suppliers | External temporary |

### Mapping to GVTEWAY 11-Role Target

| Boardingpass Tier | GVTEWAY Role(s) | Notes |
|---|---|---|
| T1 Production | `developer`, `owner`, `admin`, `team_member` | Internal hierarchy |
| T2 Operations | `team_member` | Subset of internal |
| T3 Food & Beverage | `team_member` | Subset of internal |
| T4 Talent & Industry | `talent_management`, `talent_performer`, `talent_crew`, `industry_guest` | Split into 4 roles |
| T5 Guests | No platform role (public portal) | Guest-facing is CMS content |
| T6 Temporary | `vendor` | External vendors |
| N/A | `client` | New role for production track |
| N/A | `sponsor` | New role for sponsor track |

---

## 3. Artist Track IA (from productionsite.guide)

The deployed boardingpass site shows the artist track IA as a single-event, tiered guide system. For GVTEWAY, the artist track maps to the **Talent Advancing** subsystem:

### Artist Track Portal Routes (GVTEWAY)
1. **Welcome** -- event info, liaison contact
2. **Show Details** -- venue, date, schedule
3. **Venue** -- capacity, site plan, amenities
4. **Schedule** -- set times, soundcheck, call times
5. **Credentials** -- request and view status *(deferred)*
6. **Payment** -- payment info, W-9 requirements
7. **Contacts** -- liaison, production office, emergency
8. **FAQ** -- role-specific FAQ
9. **Advancing** (6 sub-pages):
   - Technical Rider (references UAC `talent_facing` items)
   - Hospitality Rider
   - Input List
   - Stage Plot
   - Crew List
   - Guest List

---

## 4. Salvage City + EDC Research (Production Scope)

### EDC Las Vegas 2026
- **Dates:** May 15-17, 2026
- **Venue:** Las Vegas Motor Speedway
- **Scale:** 170,000+ attendees per day, multiple stages

### Salvage City Supper Club
- **Concept:** Post-apocalyptic immersive dining experience within EDC grounds
- **Location:** Nomads Land area within EDC
- **Format:** 60-minute experience, 80 guests per seating, family-style tables of 20
- **Menu:** 5-course curated menu (classic + vegetarian), free-flowing cocktails
- **Price:** ~$189 per person (18% gratuity included)
- **Dietary:** Accommodates restrictions on-site (communicate with server)
- **Requirements:** EDC festival wristband mandatory
- **Production scope:** Kitchen, FOH staff, performers, circus acts, lighting, sound, scenic, F&B procurement

### GVTEWAY Production Advance Scope (Salvage City)
This project stress-tests multi-collection UAC procurement:
- **Site Collection:** Tent/structure, flooring, fencing, generators
- **Technical Collection:** Sound, lighting, video for immersive space
- **Hospitality Collection:** Tables, chairs, linens, serviceware, glassware
- **F&B Collection:** Kitchen equipment, refrigeration, prep stations
- **Workplace Collection:** Backstage, crew areas, storage

---

## 5. iii Joints PDF Extraction

### Event Metadata
- **Event:** iii Joints 2026
- **Date:** Saturday, April 18, 2026 (PDF says 2025, flagged as `NEEDS_2026_CONFIRMATION`)
- **Venue:** Factory Town, 4800 NW 37th Ave, Miami, FL 33142
- **Hours:** 4:00 PM - 5:00 AM
- **Stages:** 6

### Day-of-Show Contacts
- Manuel Portocarrero: +1 (689) 217-5066
- Pablo Ycaza: +1 (305) 748-0921

### Talent Advance Policies
- **Credential Pickup:** Artist Check-in on-site, artist entrance of Building 1
- **Payment:** Check distributed on-site at artist relations desk (W-9 required)
- **Guest List:** 10 GA + 1 VIP per artist
- **VIP Guest:** Must enter with artist on arrival
- **Guest List Deadline:** 5:00 PM Friday April 17 (day before)
- **Parking:** No on-site parking; rideshare recommended
- **Belongings:** Not guaranteed safe at VIP/Artist Lounge

### Stages & Backline

| Stage Name | Room | Backline |
|---|---|---|
| Satiiiva | The Park | 4x CDJ-3000 + DJM-V10 + RMX1000 |
| Strain Room | Chain Room | 4x CDJ-3000 + DJM-V10 |
| Skate Space | Warehouse | 4x CDJ-3000 + DJM-A9 + 2 turntables |
| Kush Gardens | Cypress End | 4x CDJ-3000 + DJM-V10 |
| Diesel Den | Engine Room | 4x CDJ-3000 + DJM-V10 |
| Reefer Theater | Infinity Room | 4x CDJ-3000 + DJM-A9 |

### Set Times Summary
- **6 stages** running 4:00 PM - 5:00 AM (13 hours)
- **All DJ format** except Reefer Theater (mixed: live bands, game shows, film festival, karaoke, movie screening)
- **~60+ acts** total, predominantly B2B sets
- **Reefer Theater** is the hybrid exception: Cumbiamba, Greybody's Plantasia, The Floridians, The Boy Who Wore Jade (live), plus game shows, Subtropic Film Festival, Live Band Karaoke

---

## 6. Dice Page Extraction

- **Ticket source:** DICE app (mobile-secured tickets)
- **Venue:** Factory Town, 4800 NW 37th Ave, Miami, FL 33142
- **Age:** Event-specific (general 18+, VIP 21+)
- **No re-entry**
- **No on-site parking** (rideshare/carpool recommended)
- **VIP includes:** Elevated viewing decks, exclusive bars, food vendors, air-conditioned restroom trailers
- **Bag policy:** Clear bags up to 12"x6"x12"; non-clear up to 6"x9"
- **Permitted:** Empty water bottles, sealed naloxone, vapes, non-pro cameras under 6"

---

## 7. Parity Matrices

### Talent Track Deliverables

| Deliverable Type | Description | iii Joints Applicable |
|---|---|---|
| `technical_rider` | Backline/equipment requirements, references UAC `talent_facing` items | Yes -- CDJ/DJM/turntable confirmation |
| `hospitality_rider` | Green room, catering, dressing room requirements | Yes -- no green room mentioned, minimal |
| `input_list` | Audio inputs per act | Yes -- all DJ (line-level) except Reefer Theater bands |
| `stage_plot` | Physical stage layout per act | Yes -- standard DJ plots |
| `crew_list` | Touring party roster | Yes -- for credential issuance |
| `guest_list` | Per-act guest list with caps | Yes -- 10 GA + 1 VIP per act |

### Production Track Deliverables

| Deliverable Type | Description | Salvage City Applicable |
|---|---|---|
| `equipment_pull_list` | Full UAC procurement list | Yes -- multi-collection pull |
| `power_plan` | Electrical requirements and distribution | Yes -- kitchen + AV power |
| `rigging_plan` | Overhead rigging and load calculations | Yes -- tent/structure rigging |
| `site_plan` | Physical layout and dimensions | Yes -- dining layout within EDC |
| `build_schedule` | Phased construction timeline | Yes -- EDC build window |
| `vendor_package` | Vendor onboarding documents | Yes -- F&B vendors, performers |
| `safety_compliance` | Safety documentation | Yes -- food safety, fire, crowd |
| `comms_plan` | Communications infrastructure | Yes -- radio channels within EDC |
| `signage_grid` | Wayfinding and branding signage | Yes -- within Nomads Land |

---

## 8. Existing UAC Schema Audit

**Result: No existing Supabase tables found.** The boardingpass repo has no database, no Supabase integration, and no migration files. The prompt references existing tables (`advance_category_groups`, `advance_categories`, `advance_subcategories`, `advance_items`) but these do not exist in this repo.

**Decision:** Build the UAC schema from scratch as specified in the prompt:
- `advance_category_groups` (10 collections)
- `advance_categories` (24+)
- `advance_subcategories` (94+)
- `advance_items` (350+ items with `visibility_tags`)
- `catalog_item_interchange`
- `catalog_item_supersession`
- `catalog_item_fitment`
- `catalog_item_inventory`
- `catalog_item_allocations`

---

## 9. Key Decisions & Flags

1. **PDF date discrepancy:** Talent Advance PDF says "April 18 2025" but prompt specifies 2026. Flagged as `NEEDS_2026_CONFIRMATION`.
2. **Credential Engine deferred:** Per user instruction, Phase 3 (Credential Engine) is deferred to a later session. Schema stubs will be created but UI/API implementation is skipped.
3. **No existing Supabase:** All schema is built from scratch. No "extend" scenario -- it's all new.
4. **productionsite.guide:** This IS the boardingpass app deployed. It serves as the artist track IA reference only.
5. **iii Joints is DJ-dominant:** 5 of 6 stages are pure DJ (CDJ+DJM). Reefer Theater is the hybrid stage with live bands, game shows, and film.
6. **Salvage City is multi-collection:** Kitchen, dining, performance, scenic, infrastructure -- tests full UAC breadth.
7. **GVTEWAY accent is cyan** (replacing boardingpass pink #E84393).
8. **Typography change:** Anton / Bebas Neue / Share Tech (replacing Syne / Plus Jakarta Sans).
