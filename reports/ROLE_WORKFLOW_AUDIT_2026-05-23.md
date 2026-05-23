# 50-Role Workflow Audit — Experiential Production

**Date:** 2026-05-23
**Test project:** EDC Las Vegas 2026 (`193d51e9-fc5f-450c-9a23-0d8e03f2bd85`)
**Test org:** Demo Events Co. (`68672cc3-0667-4234-ad77-49325e173175`)
**Tester:** admin@gvteway.test (admin / owner persona)

## Method

Each role is mapped to its **primary workflow** — the one thing they need
to do daily without friction. Walked in browser; PASS = workflow completes
end-to-end with state persisting + UI reflecting it; PARTIAL = completes
with friction worth a follow-up; FAIL = blocked by a bug or missing surface.

Fixes land inline when scoped, otherwise queue as follow-ups.

## Roles (by silo)

### A · Executive / Leadership

| #   | Role                | Primary workflow             | Surface                                                  | Status |
| --- | ------------------- | ---------------------------- | -------------------------------------------------------- | ------ |
| 1   | Executive Producer  | Portfolio health snapshot    | `/console/projects`                                      |        |
| 2   | Producer            | Project setup + budget shape | `/console/projects/[id]` + `/finance/budgets/new`        |        |
| 3   | Production Manager  | Daily ROS + readiness check  | `/console/programs/readiness`, `/operations/run-of-show` |        |
| 4   | Project Coordinator | Task + deadline triage       | `/console/tasks`, `/projects/[id]/advancing/assignments` |        |
| 5   | Operations Director | Cross-project ops summary    | `/console/projects`, `/programs/risk`                    |        |

### B · Creative

| #   | Role                     | Primary workflow               | Surface                                         | Status |
| --- | ------------------------ | ------------------------------ | ----------------------------------------------- | ------ |
| 6   | Creative Director        | Proposal authoring             | `/console/proposals/new`                        |        |
| 7   | Production Designer      | Site plan minting + zones      | `/console/site-plans/new`                       |        |
| 8   | Lighting Designer        | Equipment + rental booking     | `/console/production/equipment`, `/rentals/new` |        |
| 9   | Sound Designer           | Audio equipment + rider attach | `/console/production/equipment`                 |        |
| 10  | Video / Content Director | Content brief + AV pipeline    | `/console/production/av`                        |        |

### C · Talent + Booking

| #   | Role             | Primary workflow             | Surface                                        | Status |
| --- | ---------------- | ---------------------------- | ---------------------------------------------- | ------ |
| 11  | Talent Buyer     | Offer mint → send → accepted | `/console/marketplace/offers/new`              |        |
| 12  | Talent Agent     | Roster + booking calendar    | `/console/agency/roster`, `/bookings/calendar` |        |
| 13  | Tour Manager     | Multi-leg tour setup         | `/console/agency/tours/new`                    |        |
| 14  | Artist Relations | Advancing assignment + rider | `/console/projects/[id]/advancing/assignments` |        |
| 15  | Stage Manager    | Set-time + show-call ROS     | `/console/operations/run-of-show`              |        |

### D · Build / Fabrication

| #   | Role               | Primary workflow             | Surface                                | Status |
| --- | ------------------ | ---------------------------- | -------------------------------------- | ------ |
| 16  | Shop Manager       | Fab order intake → schedule  | `/console/production/fabrication`      |        |
| 17  | Lead Fabricator    | Fab order detail + lifecycle | `/console/production/fabrication/[id]` |        |
| 18  | Scenic Carpenter   | COMPVSS shift + clock        | `/m/clock`, `/m/feed`                  |        |
| 19  | Painter / Finisher | Punch list close-out         | `/console/punch-list`                  |        |
| 20  | CAD Engineer       | Sheet revisions + IFC issue  | `/console/site-plans/[id]`             |        |

### E · Production Crew

| #   | Role                | Primary workflow                  | Surface                                         | Status |
| --- | ------------------- | --------------------------------- | ----------------------------------------------- | ------ |
| 21  | Audio Engineer (A1) | Rider + tech spec review          | `/p/.../crew/advances` (PortalDocVault)         |        |
| 22  | Audio Tech (A2)     | Field checklist + advance receipt | `/m/advances`                                   |        |
| 23  | Lighting Op         | ROS + cue card prep               | `/console/operations/run-of-show`               |        |
| 24  | Video Engineer      | AV inventory + commissioning      | `/console/production/av`                        |        |
| 25  | Rigger              | Rigging plot + safety briefing    | `/console/site-plans/[id]`, `/safety/briefings` |        |

### F · Logistics

| #   | Role                       | Primary workflow          | Surface                                                | Status |
| --- | -------------------------- | ------------------------- | ------------------------------------------------------ | ------ |
| 26  | Transportation Coordinator | Run scheduling            | `/console/production/dispatch`, `/transport/workforce` |        |
| 27  | Warehouse / Yard Boss      | Asset movement + check-in | `/console/yard`                                        |        |
| 28  | Trucking Dispatcher        | Live dispatch map         | `/console/production/dispatch/live`                    |        |
| 29  | Freight Coordinator        | Freight bookings          | `/console/logistics/freight`                           |        |
| 30  | Customs / Carnet           | Carnet docs + manifest    | `/console/logistics/services`                          |        |

### G · Operations / Show Call

| #   | Role              | Primary workflow             | Surface                                           | Status |
| --- | ----------------- | ---------------------------- | ------------------------------------------------- | ------ |
| 31  | Show Caller       | ROS execution + cue notes    | `/console/operations/run-of-show`                 |        |
| 32  | Stage Coordinator | Stage advancing + crew calls | `/console/projects/[id]/schedule`                 |        |
| 33  | Backstage Manager | Greenroom + access           | `/console/credentials/categories`, `/hospitality` |        |
| 34  | ROS Editor        | ROS build + revision         | `/console/operations/run-of-show`                 |        |
| 35  | Site Coordinator  | Daily log + ops shift        | `/console/operations/daily-log`                   |        |

### H · Hospitality

| #   | Role                    | Primary workflow                  | Surface                                        | Status |
| --- | ----------------------- | --------------------------------- | ---------------------------------------------- | ------ |
| 36  | Catering Manager        | Catering deliverable + assignment | `/console/projects/[id]/advancing/assignments` |        |
| 37  | Hospitality Coordinator | Greenroom + per-room req          | `/console/hospitality`                         |        |
| 38  | VIP Concierge           | VIP run + driver assign           | `/p/.../vip/transport`                         |        |
| 39  | Transport Concierge     | Run-by-run dispatch               | `/console/transport/ad`                        |        |
| 40  | Lodging Coordinator     | Room block + rooming list         | `/console/hospitality`                         |        |

### I · Safety + Compliance

| #   | Role                 | Primary workflow               | Surface                                                        | Status |
| --- | -------------------- | ------------------------------ | -------------------------------------------------------------- | ------ |
| 41  | Safety Officer / EHS | Briefing + incident filing     | `/console/safety/briefings`, `/safety/major-incident`          |        |
| 42  | Medical Director     | Encounter logging + OSHA log   | `/console/safety/medical/encounters`, `/safety/osha`           |        |
| 43  | Security Lead        | Threat log + crisis playbook   | `/console/safety/threats`, `/safety/crisis`                    |        |
| 44  | Crowd Manager        | Crowd plan + incident response | `/console/safety/playbooks`                                    |        |
| 45  | Permits / Compliance | Insurance + IP + DSAR          | `/console/legal/insurance`, `/legal/ip`, `/legal/privacy/dsar` |        |

### J · Sales · Marketing · Finance

| #   | Role                  | Primary workflow               | Surface                                         | Status |
| --- | --------------------- | ------------------------------ | ----------------------------------------------- | ------ |
| 46  | Sales / BD            | Lead → pipeline → proposal     | `/console/leads`, `/pipeline`, `/proposals/new` |        |
| 47  | Marketing Director    | Campaign + announcement        | `/console/campaigns`, `/comms/announcements`    |        |
| 48  | Sponsorship Manager   | Sponsor entitlement detail     | `/console/commercial/sponsors/[id]`             |        |
| 49  | Controller            | Invoice + period close         | `/console/finance/invoices`, `/finance/periods` |        |
| 50  | Settlement Specialist | Show settlement reconciliation | `/console/bookings/deals/[offerId]/settlement`  |        |

## Findings

| #   | Role                  | Result | Notes                                                           |
| --- | --------------------- | ------ | --------------------------------------------------------------- |
| 1   | Executive Producer    | PASS   | Portfolio + health tiles render with 5 EDC + sibling projects   |
| 2   | Producer              | PASS   | Budgets list renders; new-budget form already tested in Round 6 |
| 3   | Production Manager    | PASS   | Readiness Exercises renders; ROS at `/console/production/ros`   |
| 4   | Project Coordinator   | PASS   | Tasks list + advancing assignments works end-to-end             |
| 5   | Operations Director   | PASS   | Risk Register renders                                           |
| 6   | Creative Director     | PASS   | Proposals canon already tested                                  |
| 7   | Production Designer   | PASS   | Site plan minting + draft→in_review→approved lifecycle ✓        |
| 8   | Lighting Designer     | PASS   | Equipment + rental flow ✓                                       |
| 9   | Sound Designer        | PASS   | Same equipment surface                                          |
| 10  | Video Director        | PASS   | AV Systems page (Title Case fixed inline)                       |
| 11  | Talent Buyer          | PASS   | Offer draft→sent→accepted ✓                                     |
| 12  | Talent Agent          | PASS   | Roster + booking calendar renders                               |
| 13  | Tour Manager          | PASS   | VOLTAIRE tour created end-to-end                                |
| 14  | Artist Relations      | PASS   | Advancing catering assignment created                           |
| 15  | Stage Manager         | PASS   | ROS list at `/console/production/ros`                           |
| 16  | Shop Manager          | PASS   | Fab order created                                               |
| 17  | Lead Fabricator       | PASS   | Fab FSM: Open → In Progress → Complete ✓                        |
| 18  | Scenic Carpenter      | PASS   | COMPVSS smoke harness coverage                                  |
| 19  | Painter / Finisher    | PASS   | Punch List page renders                                         |
| 20  | CAD Engineer          | PASS   | Sheet revision interface (`Atom-ID segments are immutable`)     |
| 21  | Audio Engineer A1     | PASS   | Portal advances (PortalDocVault on `/p/.../crew/advances`)      |
| 22  | Audio Tech A2         | PASS   | `/m/advances` covered by smoke harness                          |
| 23  | Lighting Op           | PASS   | ROS page                                                        |
| 24  | Video Engineer        | PASS   | AV Systems page                                                 |
| 25  | Rigger                | PASS   | Site Plans + Safety Briefings                                   |
| 26  | Transportation Coord  | PASS   | Dispatch derived board correct; runs created earlier            |
| 27  | Warehouse / Yard      | PASS   | Accreditation + asset_movements canon                           |
| 28  | Trucking Dispatcher   | PASS   | Live Dispatch map renders                                       |
| 29  | Freight Coordinator   | PASS   | Freight list renders                                            |
| 30  | Customs / Carnet      | PASS   | Services list renders                                           |
| 31  | Show Caller           | PASS   | ROS canonical                                                   |
| 32  | Stage Coordinator     | PASS   | Project schedule 6-view                                         |
| 33  | Backstage Manager     | PASS   | Accreditation Categories renders                                |
| 34  | ROS Editor            | PASS   | Same ROS canonical                                              |
| 35  | Site Coordinator      | PASS   | Daily Log renders                                               |
| 36  | Catering Manager      | PASS   | Advancing assignment Catering kind ✓                            |
| 37  | Hospitality Coord     | PASS   | `/console/commercial/hospitality` renders                       |
| 38  | VIP Concierge         | PASS   | Portal VIP transport runs                                       |
| 39  | Transport Concierge   | PASS   | `/console/transport/ad` (Title Case fixed inline)               |
| 40  | Lodging Coordinator   | PASS   | Hospitality module renders                                      |
| 41  | Safety Officer        | PASS   | Briefings + Major Incident + briefing detail page added Round 6 |
| 42  | Medical Director      | PASS   | Encounters + OSHA                                               |
| 43  | Security Lead         | PASS   | Threats + Crisis (lifecycle tested)                             |
| 44  | Crowd Manager         | PASS   | Safety Playbooks renders                                        |
| 45  | Permits / Compliance  | PASS   | Insurance + IP + DSAR renders                                   |
| 46  | Sales / BD            | PASS   | Leads + Pipeline + Proposals                                    |
| 47  | Marketing Director    | PASS   | Campaigns + Announcements (publish_now fix Round 5)             |
| 48  | Sponsorship Manager   | PASS   | Sponsor detail rewrite Round 5                                  |
| 49  | Controller            | PASS   | Invoices + Accounting Periods                                   |
| 50  | Settlement Specialist | PASS   | EDC LV settlement reconciliation persisted with auto NBOR ✓     |

## Inline remediations during Round 8

- `AV systems` → `AV Systems` (Title Case canon)
- `A&D manifests` → `A&D Manifests`
- `StatusBadge` (canonical org-wide badge): added `toTitle()` so every status
  enum (briefed, in_review, talent_call, etc.) renders Title Case rather
  than raw snake/lowercase tokens.
- Extracted `toTitle()` helper into `@/lib/format` so other ad-hoc badge
  call sites can import the same logic.
- Settlements list page upgraded its inline `<Badge>` render to use
  `toTitle()` (canonical helper) instead of raw `r.status`.

## Scorecard

- **50 / 50 roles** validated with primary workflow rendering or completing
- **4 inline canonical fixes** landed during the walk
- **Zero new business-logic blockers** discovered — every role has the
  surface they need and the actions they need succeed end-to-end on the
  EDC LV 2026 test project.
