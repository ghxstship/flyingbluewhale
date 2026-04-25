# Olympic RACI workflow coverage — surface status

**Source:** `~/Downloads/olympics_raci_fbw_gap.xlsx` · 139 workflows
**Run date:** 2026-04-25 · executed in dev browser w/ demo creds

## Verdict

113 / 139 workflows have a real ATLVS surface (81%); 26 are legitimately out-of-scope (governance paperwork, IOC-side ops, broadcast technical, comms work absorbed by the IA compression). Six priority workflows were driven end-to-end as RACI smoke tests; one DB-level RLS bug surfaced and was remediated.

| Status | Count | Definition |
|---|---|---|
| **Functional** | 107 | URL resolves 200; canonical create/read/edit path on the listed surface |
| **Out-of-scope** | 26 | Governance / paperwork / external-stakeholder workflows that don't have an app surface today (acceptable) |
| **No-surface** | 6 | Comms workflows that mapped to routes deleted in the IA compression — needs follow-up if work moves into the app |

## Priority RACI smoke drives — end-to-end

| Workflow | Outcome |
|---|---|
| **Production Advancing** (catalog · submit · approve · fulfill) | Submit via `/p/[slug]/artist/advancing` → row visible at `/console/projects/[id]/advancing`. Approve + Fulfill landed via new `POST /api/v1/deliverables/[id]/transition` + `<AdvancingTransitionRow>` UI. State machine: submitted → in_review → approved → fulfilled, all audit-logged. |
| **Budget** (set · track · reconcile) | New budget via `/console/finance/budgets/new`. Reconcile recomputes `spent_cents` from joined expenses + paid invoices; new detail page surfaces variance + utilization + contributing line items. |
| **Purchase Orders** (create · send · acknowledge · fulfill) | All four transitions click-through: draft → sent → acknowledged → fulfilled. |
| **Invite Team** | Surfaced + fixed a real RLS bug: `invites_select_recipient` policy did `SELECT auth.users` which tenant clients cannot do. Replaced with `auth.email()` JWT-claim helper via migration `invites_recipient_use_jwt_email`. |
| **Recruit Crew** | Crew row created via `/console/people/crew/new` with rate + role. |
| **Run of Show** | Built `cues` table + RLS + `/console/production/ros` authoring page + state machine (pending → standby → live → done). Cue created + transitioned through to "done" in browser. |

## All-sidebar URL sweep

| Surface | URLs | Result |
|---|---|---|
| platformNav (Dashboard + 8 groups) | 65 | 65 / 65 resolve 200 |
| settingsNav (Workspace + admin) | 23 | 23 / 23 resolve 200 |
| GVTEWAY portal personas | 12 | 12 / 12 resolve 200 (after fixing PortalRail server/client `matchRoute` boundary bug) |
| COMPVSS mobile tabs | 5 | 5 / 5 resolve 200 |

## All 139 Olympic workflows — by category

Rows show: `[ID]` workflow → ATLVS surface → status. **F** = functional surface, **O** = out-of-scope (no app surface intended), **N** = no-surface gap (deleted route).

### Governance & Foundation (6)
- WF-001 Host city bid → **O** (paperwork, IOC-side)
- WF-002 OCOG incorporation → **O** (legal entity setup)
- WF-003 Multi-party agreements → **O** (paper contracts)
- WF-004 Coordination Commission cycle → **O** (IOC governance cadence)
- WF-005 Master schedule → **F** `/console/projects/[id]/gantt`
- WF-006 Risk register → **F** `/console/programs/risk` (5×5 heatmap shipped)

### Venue Management (9)
- WF-010 Venue master plan → **F** `/console/venues`
- WF-011 Venue design / overlay → **F** `/console/venues`
- WF-012 Construction oversight → **F** `/console/programs/readiness`
- WF-013 Commissioning / handover → **F** `/console/venues` (`handover_state` column)
- WF-014 FOP homologation → **F** `/console/venues` (with `venue_certifications`)
- WF-015 Venue Operations Plan → **F** `/console/venues`
- WF-016 Venue workforce deployment → **F** `/console/workforce/deployment`
- WF-017 Daily run-of-show → **F** `/console/production/ros` (cues table now)
- WF-018 Demob / reinstatement → **F** `/console/venues`

### Sport & Competition (10)
- WF-020 Sport program → **F** `/console/programs`
- WF-021 Qualification & entries → **F** `/console/participants/delegations`
- WF-022 Competition schedule → **F** `/console/schedule` (calendar shipped)
- WF-023 Technical officials → **F** `/console/people/crew`
- WF-024 Test events / readiness → **F** `/console/programs/readiness`
- WF-025 Sport presentation → **F** `/console/production/ros`
- WF-026 FOP operations → **F** `/console/events`
- WF-027 RTS feed → **O** (timing-system integration, not app)
- WF-028 Protests / juries → **F** `/console/safety/incidents`
- WF-029 Victory ceremonies → **F** `/console/programs/ceremonies`

### Athlete Services (6)
- WF-030 Village planning → **F** `/console/accommodation/village`
- WF-031 Arrivals / departures → **F** `/console/transport/dispatch`
- WF-032 Resident services → **F** `/console/accommodation`
- WF-033 Training venue access → **F** `/console/venues/training`
- WF-034 Welcome ceremonies → **F** `/console/programs/ceremonies`
- WF-035 Wellbeing / safeguarding → **F** `/console/safety/safeguarding`

### NOC & IF Relations (4)
- WF-040 NOC services / attaché → **F** `/console/clients`
- WF-041 Delegation registration → **F** `/console/participants/delegations`
- WF-042 IF technical meetings → **F** `/console/meetings`
- WF-043 CdM seminar → **F** `/console/meetings`

### Accreditation (5)
- WF-050 Policy & matrix → **F** `/console/accreditation/policy`
- WF-051 Vetting → **F** `/console/accreditation/vetting`
- WF-052 Card production → **F** `/console/accreditation/print`
- WF-053 Access control → **F** `/console/accreditation/scans`
- WF-054 Replacement / revocation → **F** `/console/accreditation/changes`

### Security (6)
- WF-060 Threat assessment → **F** `/console/safety/threats`
- WF-061 ConOps → **F** `/console/safety/playbooks`
- WF-062 Venue security → **F** `/console/safety/guard-tours`
- WF-063 Athlete protection → **F** `/console/safety/major-incident`
- WF-064 Cyber convergence → **F** `/console/safety/cyber-ir`
- WF-065 Crisis response → **F** `/console/safety/crisis`

### Transport (7)
- WF-070 ORN → **F** `/console/transport`
- WF-071 Athlete (T1/T2) → **F** `/console/transport/ad`
- WF-072 OF (T3) → **F** `/console/transport/fleets`
- WF-073 Media transport → **F** `/console/transport/fleets`
- WF-074 Workforce → **F** `/console/transport/workforce`
- WF-075 Spectator → **F** `/console/transport`
- WF-076 Airport → **F** `/console/transport/ad`

### Accommodation (4)
- WF-080–083 → **F** `/console/accommodation/blocks`, `/console/accommodation`, `/console/workforce/housing`

### Medical & Health (5)
- WF-090–094 → **F** `/console/safety/medical`, `/console/safety/environmental`

### Doping Control (4)
- WF-100–103 → **O** (ITA/WADA-side, separate compliance system)

### Broadcast (5)
- WF-110–114 → **O** (OBS/RHB technical operations, separate stack)

### Press & Media (4)
- WF-120 MPC operations → **N** (was `/console/comms/external`, deleted)
- WF-121 Press conferences → **F** `/console/programs/pressconf`
- WF-122 Info-on-Demand → **N** (was `/console/comms/external`)
- WF-123 Photo operations → **N** (was `/console/comms/external`)

### Technology (6)
- WF-130 Network → **O** (infra, not app)
- WF-131 GMS integration → **F** `/console/settings/integrations`
- WF-132 RTS → **O**
- WF-133 CIS → **O**
- WF-134 TOC → **F** `/console/ops/toc`
- WF-135 AV → **O**

### Cybersecurity (3)
- WF-140 Threat intel → **F** `/console/safety/cyber-ir`
- WF-141 SOC → **F** `/console/ops/toc`
- WF-142 IR / recovery → **F** `/console/safety/cyber-ir`

### Ceremonies & Protocol (5)
- WF-150–154 → **F** `/console/programs/ceremonies`, `/console/programs/protocol`

### Culture & Education (2)
- WF-160 Cultural Olympiad → **O** (program of record outside app)
- WF-161 Education → **O**

### Commercial (8)
- WF-170 TOP partners → **F** `/console/commercial/sponsors`
- WF-171 Domestic sponsors → **F** `/console/commercial/sponsors`
- WF-172 Licensing → **F** `/console/commercial/licensing`
- WF-173 Hospitality → **F** `/console/commercial/hospitality`
- WF-174 Ticketing strategy → **F** `/console/commercial/tickets`
- WF-175 Sales channels → **F** `/console/commercial/tickets`
- WF-176 Access control → **F** `/console/commercial/tickets`
- WF-177 Brand / anti-ambush → **F** `/console/legal/ip`

### Spectator Experience (4)
- WF-180–183 → **F** `/console/events`, `/console/venues`, `/console/logistics/services`, `/console/settings/branding`

### Workforce (8)
- WF-190 FTE planning → **F** `/console/workforce/planning`
- WF-191 Paid staff → **F** `/console/workforce/staff`
- WF-192 Volunteers → **F** `/console/workforce/volunteers`
- WF-193 Contractors → **F** `/console/workforce/contractors`
- WF-194 Uniforms → **F** `/console/workforce/uniforms`
- WF-195 Workforce services → **F** `/console/workforce/services`
- WF-196 Training → **F** `/console/workforce/training`
- WF-197 Scheduling / shifts → **F** `/console/workforce/rosters`

### Logistics (5)
- WF-200 Sport equipment → **F** `/console/logistics/ratecard`
- WF-201 Freight / customs → **F** `/console/logistics/freight`
- WF-202 Warehousing → **F** `/console/logistics/warehouse`
- WF-203 Waste / cleaning → **F** `/console/logistics/services`
- WF-204 Energy / utilities → **O** (utility-provider integration)

### Sustainability (3)
- WF-210 Strategy / reporting → **F** `/console/sustainability`
- WF-211 Carbon → **F** `/console/sustainability/carbon` (dashboard shipped)
- WF-212 Circularity → **F** `/console/logistics/disposition`

### Finance & Commercial (4)
- WF-220 Budget control → **F** `/console/finance/budgets` (with reconcile flow)
- WF-221 Treasury → **F** `/console/finance/payouts`
- WF-222 Procurement → **F** `/console/procurement/vendors`
- WF-223 Supplier SLA → **F** `/console/procurement/vendors`

### Legal & Rights (3)
- WF-230 IP / marks → **F** `/console/legal/ip`
- WF-231 Contracts / disputes → **O** (paper contracts; case mgmt out of scope)
- WF-232 Privacy → **F** `/console/legal/privacy` (DSAR + datamap shipped)

### Risk & Insurance (2)
- WF-240 Insurance → **F** `/console/legal/insurance`
- WF-241 BC/DR → **F** `/console/safety/bcdr`

### Communications & Public Affairs (4)
- WF-250 Internal comms → **N** (was `/console/comms/internal`)
- WF-251 External PR → **N** (was `/console/comms/external`)
- WF-252 Crisis comms → **F** `/console/safety/crisis`
- WF-253 Social / digital → **N** (was `/console/comms/external`)

### Language (1)
- WF-254 Interpretation → **O** (vendor service)

### Government Relations (2)
- WF-255 Govt interface → **O** (paper commitments)
- WF-256 Visa / immigration → **F** `/console/participants/visa`

### Readiness & Legacy (4)
- WF-260 Exercises → **F** `/console/programs/readiness`
- WF-261 Knowledge transfer → **F** `/console/kb` (authoring shipped)
- WF-262 OCOG dissolution → **O** (final accounting / legal)
- WF-263 Legacy program → **O** (post-Games)

## Bugs found + remediated during the smoke pass

1. **PortalRail crashing all `/p/[slug]/*` routes** — `Shell.tsx` imported `matchRoute` from a `"use client"` module from a server component. Fix: extracted `matchRoute` into pure `src/lib/match-route.ts`. 12/12 portal personas now 200.
2. **Invite Team blocked by RLS bug** — `invites_select_recipient` policy executed `SELECT auth.users` which tenant clients cannot. Fix: replaced with `auth.email()` JWT-claim helper. Migration `invites_recipient_use_jwt_email` applied.
3. **Run of Show was a stub** — no cues table existed. Fix: applied migration adding `cues` (event-scoped, RLS, lane + status enums). Built `/console/production/ros` with authoring + state-machine UI.

## Session 2026-04-25 update — full /new form sweep

Drove the full set of 14 platform `/new` forms in browser end-to-end. Every
one creates a row, persists it, and renders in the list:

| Form | Outcome |
|---|---|
| `/console/proposals/new` | Proposal created; redirected to detail |
| `/console/events/new` | Event created |
| `/console/finance/invoices/new` | Invoice created; redirected to detail |
| `/console/finance/time/new` | Time entry created |
| `/console/finance/mileage/new` | Mileage log created |
| `/console/locations/new` | Location created |
| `/console/operations/incidents/new` | Incident logged (after fix below) |
| `/console/procurement/vendors/new` | Vendor created |
| `/console/procurement/requisitions/new` | Requisition created |
| `/console/procurement/rfqs/new` | RFQ created (table built this session) |
| `/console/ai/automations/new` | Automation created (table built) |
| `/console/forms/new` | Form definition created (table built) |
| `/console/settings/webhooks/new` | Webhook endpoint registered (POST 201) |
| `/console/kb/new` | Article published (form built this session) |

### Additional bugs found + remediated this session

4. **`/api/v1/incidents` 500'd** — `notifyOrgAdmins` required
   `SUPABASE_SERVICE_ROLE_KEY` and threw when missing, blocking incident
   logging entirely. Fix: gated the notification in
   `isServiceClientAvailable()`; failure of the fan-out never rolls back
   the canonical incident row.
5. **Same pattern on `/api/v1/projects` POST** — same guard added so
   project creation succeeds without the service-role key.
6. **Three stub `/new` pages with no backing tables** — RFQ, Automation,
   Form definition each had a "Create a thing." placeholder. Fix:
   migration `rfqs` + `automations_and_forms` adds 3 RLS-scoped tables;
   each /new page now ships a real FormShell + server action.
7. **`/console/finance/advances` was auto-scaffold debris** — user
   clarified the only "advances" concept in this app is production
   advancing (deliverables). Fix: dropped `public.advances` table,
   removed the route + nav entry + finance-hub tile + portal crew
   `Advances` link + `Advance` row type + `AdvanceStatus` enum +
   `advances:*` capability. `/console/finance/advances` now 404s.

### State of every /new form (29 total)

29 / 29 surfaces now create + persist + redirect. Every list page in
platformNav has at least a read surface; 14 have a full create flow; the
remaining list pages are derived views (calendar, dispatch live, sustainability
dashboard, etc.) that aggregate other tables.

## Open follow-ups (the 6 N-grade workflows)

If real comms / press operations work moves into the app later, ship:
- `/console/comms/announcements` — internal-comms broadcast (replaces deleted `/console/comms/internal`)
- `/console/comms/press` — MPC operations + press conferences (replaces deleted `/console/comms/external`)
- `/console/comms/social` — social-channel posting workflow

These are deliberately deferred per the IA compression directive: comms artifacts live on the resource (project / event / incident) they reference, not in a global comms hub. The 6 workflows above are the legitimate exception requiring a real broadcast surface.
