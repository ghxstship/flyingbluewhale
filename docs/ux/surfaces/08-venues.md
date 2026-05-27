# Surface Spec #8 — Venues

**Shell:** ATLVS · **Route:** /console/venues (master directory) + /console/venues/[venueId]/\* (detail with tabs design/zones/ros/handover/closeout) + /console/production/compounds (IBC/MPC sub-filter)
**Status:** Drafted · awaiting review — stop signal per brief
**Theme:** Bermuda Triangle only. ATLVS pink throughout.

## 1. Data class & lifecycle

| Item                    | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conceptual XPMS class   | **0 EXECUTIVE — Strategy** (venue is the place a project happens; lives in the executive/strategy group per ADR-0004). Adjacent class touches: 4 BUILD (compound/yard live here too), 6 OPERATIONS (transport/dispatch destinations).                                                                                                                                                                                                                           |
| Primary lifecycle       | **`handover_state`** — already shipped + LDP-canonical name (✓ no rename needed). Implementation today is `venues.handover_state` column (probed in Surface #0 discovery). State values not yet inventoried in this run; spec treats it as the canonical lifecycle and asks Phase 2 to confirm the enum members. Reasonable default per Olympic-style workflows: `discovered → site_visited → secured → designed → built → operational → handed_back → closed`. |
| Sub-lifecycles per area | Each venue has multiple **zones** (the existing `/zones` sub-route hints at a `venue_zones` table). Each zone can carry its own micro-lifecycle (e.g. `zone_readiness`: planned / built / dressed / show-ready). Surface spec keeps zones nested under the venue detail page; not a list-level concept.                                                                                                                                                         |
| Adjacent tables         | `venue_build_log` (event ledger per audit), `locations` (lat/lng + address), `venue_zones` (assumed from `/zones` route), `events.location_id` (events held at venue), `cues.event_id → events` (ROS scoped to event scoped to venue), `dispatch_runs.{origin,destination}_venue_id`.                                                                                                                                                                           |
| Kind discriminator      | `venues.kind` — sentinels include `ibc` / `mpc` per `/console/production/compounds` filter. Other values implied (stage / warehouse / hotel / hospitality / vip-lounge — TBC by probe in Phase 2). Drives map markers + the compounds sub-route.                                                                                                                                                                                                                |
| Cluster grouping        | `venues.cluster` — operator-tagged grouping (e.g. "Downtown Festival Cluster" = multiple proximate venues). Drives a Cluster Map view.                                                                                                                                                                                                                                                                                                                          |
| Existing detail tabs    | `design` · `zones` · `ros` (run of show scoped to this venue) · `handover` · `closeout` · plus `training` at the index level. Detail surface is already DEEP — this spec focuses on the directory + Map + cross-venue Insights views.                                                                                                                                                                                                                           |
| Authority docs          | `src/app/(platform)/console/venues/page.tsx`, `src/app/(platform)/console/venues/[venueId]/{layout,page,handover,zones,design,ros,closeout}.tsx`, `src/app/(platform)/console/production/compounds/page.tsx`, ADR-0004.                                                                                                                                                                                                                                         |

**Single-axis truth.** Unlike Projects/Productions (phase + state), a venue has one lifecycle column. The detail-level sub-lifecycles (per-zone readiness, build-log events) attach to the venue but don't override the macro arc.

## 2. SaaS parity targets

Per brief: Tripleseat, Cvent venue profiles. Specific patterns:

| Product              | Specific pattern to match or exceed                                                                                                                                           | Why it applies                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Tripleseat           | "Venue profile" — single page with capacity by configuration (theater / classroom / banquet), amenities checklist, photos, floor plans (PDF-embedded), per-room sub-records.  | Direct fit for the detail page's `/design` tab. Capacity-by-config is missing today; spec adds. |
| Cvent venue profiles | "RFP outbox" — sourcing a venue triggers an RFP to N venues simultaneously, responses gathered in a side-by-side compare. Operator picks the winner; rest auto-dispositioned. | Plumbs into our existing `rfqs` schema. Cross-venue RFP comparison is a workflow gap.           |
| Gather (Tripleseat)  | "Booking calendar" per venue — every event held there, calendar grid. Conflicts highlighted.                                                                                  | Maps to events.location_id grouped by venue. Calendar view at the venue detail level.           |
| Google Maps Local    | "Cluster map" — multiple proximate venues clustered at low zoom, individual at high. Filter by amenities.                                                                     | Direct fit for the Map view at the directory level. Maplibre-gl already in deps.                |
| Showtime Analytics   | "Per-venue performance" — past events at this venue: attendance, revenue, incidents-per-event, audience NPS. The "should we book this venue again?" answer.                   | Compose from existing finance + safety tables. Spec adds an Insights tab to the detail page.    |

**Rejected references:** Cvent Supplier Network (we're not running a marketplace at this layer). EventMobi (mobile-attendee-focused, wrong scope).

## 3. Primary view

**State-filtered table with summary tile strip** (Asset Panda / Surface #3 pattern). Venues are 10–500 rows typical; the directory wants a table not a board.

Tile strip: tiles for each `handover_state` value, count, click-to-filter. Plus a "Kind" tile group: stage · warehouse · hotel · compound (IBC/MPC) · etc. Kind tiles render a second row when ≥2 distinct kinds present.

Columns: name · kind · cluster · capacity (max across configs) · `handover_state` pill · upcoming events count · last event date · location chip (with map-pin link).

Row hover → row actions: Open detail · View on map · Issue RFQ · Add to booking calendar.

## 4. Secondary views

| View       | When operator uses it                                                                                                                                                                              | Source                                             | Verdict                  |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------ |
| `map`      | "Where are our venues clustered?" — pins by `locations.lat/lng`. Cluster pins at low zoom. Filter by handover state + kind. **Cluster-aware filter:** select a cluster chip → map zooms to bounds. | `venues.location_id → locations.{lat,lng,cluster}` | **Accept**               |
| `board`    | "What's in handover right now" — kanban by `handover_state`. Useful at the run-up to a multi-venue event (Olympic-style).                                                                          | `venues.handover_state`                            | **Accept**               |
| `calendar` | Venue booking calendar — rows = venues, columns = days, cells = events scheduled at that venue. Conflict highlight.                                                                                | `events.location_id` joined with venues            | **Accept**               |
| `gallery`  | Photo grid — each venue tile = primary photo + name + capacity. Visual scouting mode. Conditional on `venue_photos` table or `venues.primary_photo_url` existing — flag for Phase 2.               | `venues.primary_photo_url?`                        | **Accept (conditional)** |
| `timeline` | Reject. Same shape as calendar but worse for venue × event grid.                                                                                                                                   | n/a                                                | **Reject**               |
| `tree`     | Reject. Venues don't nest. Cluster grouping handled by filter.                                                                                                                                     | n/a                                                | **Reject**               |

Allowed set: `["table", "map", "board", "calendar", "gallery"]`. Default `table`. `?view=` URL state. Map is heavily used during sourcing/planning; expect operators to set it as their default per saved view.

Filter chips:

- Handover state (multi)
- Kind (multi)
- Cluster (typeahead)
- Capacity range (slider)
- Amenities (multi — when `venues.amenities jsonb` lands)
- "Available on date" (date picker — filters out venues with conflicting `events.starts_at..ends_at`)
- "Within Nmi of {address}" (location chip; uses location_id distance)

Saved views:

- "Available This Weekend" — no event conflict in weekend window.
- "Headliner-Ready" — capacity ≥ N (org-config) AND amenities include backstage + production_power.
- "Active Compounds" — kind IN (ibc, mpc), handover_state = operational.
- "Closing Out" — handover_state IN (handed_back, closed); sort by last event desc.

## 5. Lifecycle visualization

| Element                               | Pattern                                                                                                                                                            | Visual                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| Directory tile strip                  | `<StateTileStrip enum="handover_state" />` reused from Surface #3.                                                                                                 | Existing primitive.          |
| Per-row pill                          | `<StatusBadge state={venue.handover_state} />`                                                                                                                     | Existing.                    |
| Detail header                         | `<PhaseStepper enum="handover_state" current={…} onAdvance={…} />` — generalized primitive.                                                                        | Existing.                    |
| Map markers                           | Color = `handover_state` tone. Cluster pin coloring = majority state. Click cluster → popover list.                                                                | `<MapView>` + `<MapMarker>`. |
| Per-zone readiness (detail page only) | Compact horizontal stepper per zone within `/zones` tab. Same `<PhaseStepper compact />`.                                                                          | Existing.                    |
| `venue_build_log` timeline            | `<LdpStateTimeline>` configured for the build-log table on detail page.                                                                                            | Existing.                    |
| Bridge to Surface #2 Productions      | When a fab order with `installation_venue_id` exists, the venue page surfaces a "Inbound Fabrications" chip linking back to /console/production/fabrication board. | Cross-link.                  |
| Bridge to Surface #5 ROS              | The detail page's `/ros` tab embeds the ROS show-mode (or plan-mode) scoped to the venue's events.                                                                 | Reuse Surface #5 components. |

## 6. RBAC affordances

`canTransitionVenue` predicate in `policy.ts`.

| Action                          | Owner | Admin | Manager | Member                 | Treatment                                                       |
| ------------------------------- | ----- | ----- | ------- | ---------------------- | --------------------------------------------------------------- |
| View directory / map / calendar | ✓     | ✓     | ✓       | ✓ (RLS)                | **Shown.**                                                      |
| Open detail                     | ✓     | ✓     | ✓       | ✓                      | **Shown.**                                                      |
| Create venue                    | ✓     | ✓     | ✓       | —                      | **Hidden** for member.                                          |
| Advance handover state forward  | ✓     | ✓     | ✓       | —                      | **Shown** manager+.                                             |
| Regress within super-lane       | ✓     | ✓     | ✓       | —                      | Shown manager+.                                                 |
| Cross-super-lane regression     | ✓     | ✓     | —       | —                      | Detail page only.                                               |
| Edit venue metadata / amenities | ✓     | ✓     | ✓       | —                      | Shown manager+.                                                 |
| Upload photos / floor plans     | ✓     | ✓     | ✓       | ✓ (own project venues) | Member can upload to venues they're on the project_members for. |
| Archive / delete                | ✓     | ✓     | —       | —                      | Hidden for manager + member.                                    |
| Issue RFQ from venue page       | ✓     | ✓     | ✓       | —                      | Shown manager+.                                                 |

## 7. Empty / loading / error states

| State                          | Copy                                                                                                                                                                         | Visual                |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Empty                          | Title: "No Venues Yet" · Body: "A venue is a physical space — stage, compound, warehouse, hotel. Pin your first to start the booking + handover trail." · CTA: "+ New Venue" | `<EmptyState>`.       |
| Empty map                      | "No venues with location set. Add lat/lng to a venue to see it on the map."                                                                                                  | Centered map overlay. |
| Empty calendar                 | "No events scheduled at any venue in this window."                                                                                                                           | Inline.               |
| Loading                        | `<PageSkeleton variant="table" rows={6}>` for table; greyed map tiles for map.                                                                                               | Existing.             |
| Optimistic move failure        | Toast: "Couldn't advance {venue.name} to {state}."                                                                                                                           | Sonner.               |
| Calendar conflict on new event | Inline alert: "{venue.name} is already booked {start}–{end} by {project}. Pick another venue or time."                                                                       | Inline.               |

## 8. Bulk actions, filters, saved views, keyboard nav

| Capability   | Spec                                                                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bulk actions | Table view: Bulk-tag cluster · Bulk-advance handover state · Bulk-export CSV. Bulk operations are rare on this surface (venues are slow-changing). |
| Filters      | Chip strip per §4. URL-stateful.                                                                                                                   |
| Saved views  | Per-user + org-share. Defaults in §4.                                                                                                              |
| Keyboard nav | ⌘K: venue by name. `g v` jump. Map view: `+`/`-` zoom, arrow keys pan, `f` focus on selected. Detail page: 1–6 jump to tabs.                       |

## 9. Mobile / narrow viewport behavior

Venues are desktop-primary for authoring; mobile-relevant during site walks. ≤768px: tile strip wraps, map view defaults to current-location pan. Detail page: `/design` floor-plan PDFs degrade to download link; `/zones` collapses to vertical accordion. No COMPVSS native entry (field crew use `/m/wms` for warehouse-shaped venue interaction).

## 10. Surface composition

| Path                                                             | Change                                                                                                                                                                                    |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/(platform)/console/venues/page.tsx`                     | Replace 5-column DataTable with view resolver + tile strip + filter chips + saved view selector.                                                                                          |
| `src/app/(platform)/console/venues/VenuesTable.tsx`              | **New.** Column set from §3.                                                                                                                                                              |
| `src/app/(platform)/console/venues/VenuesMap.tsx`                | **New.** MapView with cluster pins + handover-tone coloring.                                                                                                                              |
| `src/app/(platform)/console/venues/VenuesBoard.tsx`              | **New.** KanbanBoard by `handover_state`.                                                                                                                                                 |
| `src/app/(platform)/console/venues/VenuesCalendar.tsx`           | **New.** CalendarView joined with `events.location_id`.                                                                                                                                   |
| `src/app/(platform)/console/venues/[venueId]/page.tsx`           | Add `<PhaseStepper enum="handover_state">` top chrome. Add Insights panel (per-venue rollup of past events: count, last_event_date, incident_count from `safety_incidents` if available). |
| `src/app/(platform)/console/venues/[venueId]/insights/page.tsx`  | **New tab.** Per-venue performance — past events count, attendance (when ticketing wired), incidents per event, audience NPS (when survey data lands).                                    |
| `src/lib/db/venues.ts`                                           | **New.** `listVenues`, `getVenue`, `advanceHandoverState`, `listVenueEvents`, `listVenueBuildLog`.                                                                                        |
| `src/lib/auth/policy.ts`                                         | Add `canTransitionVenue`.                                                                                                                                                                 |
| `supabase/migrations/{next}_venue_amenities_jsonb.sql`           | **New (conditional).** Add `venues.amenities jsonb DEFAULT '{}'` if not present. Drives amenities filter chip.                                                                            |
| `supabase/migrations/{next}_handover_state_transitions.sql`      | **New (likely conditional — table may exist).** Append-only log per the `*_state_transitions` pattern.                                                                                    |
| `supabase/migrations/{next}_phase_advance_policy_venue_kind.sql` | Extension of unified policy table (Surface #2 Resolution #7), `phase_kind='venue'`.                                                                                                       |

## 11. Acceptance

1. Operator finds a venue available next Saturday via "Available on date" chip in ≤2 clicks.
2. Bulk-tagging 12 venues into a cluster persists; cluster filter renders them as a group on Map view within 30s.
3. Detail-page Insights tab renders per-venue rollup for a venue with 12 past events in <300ms.
4. Cross-link: from a venue's `/ros` tab, click → Surface #5 show mode scoped to today's event at that venue.
5. Handover-state advance from `built → operational` on the venue triggers cue scheduling on the venue (existing trigger pattern reused).

## 12. Resolutions — 2026-05-24

1. **Enum members for `handover_state`?** **Confirm in Phase 2 from live schema.** Spec assumes the 8-state Olympic-derived list (discovered → site_visited → secured → designed → built → operational → handed_back → closed) but doesn't block on it. If actual enum differs, the spec's chrome adapts via the generalized `<PhaseStepper enum="handover_state">`.
2. **Compounds — separate route or filtered view?** **Filtered view.** `/console/production/compounds` becomes a permalinked filter (`?kind=ibc,mpc`) on the venues directory; route stays for back-compat (302 → filtered URL). Reasoning: compounds are venues with `kind ∈ (ibc, mpc)` — promoting them to a separate route is a sidebar-nav convenience, not a different data class. One canonical surface, two URLs.
3. **Venue photos table or jsonb column?** **`venue_photos` table** future-fit (one venue → many photos with metadata). For Phase 2 the gallery view ships when the table lands; until then, gallery is auto-disabled.
4. **Per-venue performance metrics — pre-aggregate or compute on-demand?** **Materialized view `v_venue_performance` refreshed nightly.** Reasoning: past-events rollups are slow-changing; on-demand SUM/COUNT across 5-year event history is a 1-second query. Materialized view + nightly refresh + on-write invalidation when an event closes.
5. **Cluster — text tag or first-class table?** **`venue_clusters` table** with `(id, org_id, name, slug)`; `venues.cluster_id uuid REFERENCES venue_clusters`. Reasoning: clusters get URLs, descriptions, and aggregated metrics. Free-text would lose this. Migration backfills any existing `venues.cluster text` value into a new `venue_clusters` row.
6. **"Available on date" filter — performance?** **Index on `events(location_id, starts_at, ends_at)`** (likely already exists). Filter becomes a NOT-EXISTS subquery; runs in <100ms even on 1000-venue + 10k-event orgs.
7. **Detail page tab order — keep or reshuffle?** **Keep.** Existing order (Overview → Design → Zones → ROS → Handover → Closeout) matches the natural lifecycle scan. Insights inserts as tab #2 (between Overview and Design) so the "should we book this again?" question is one click away.

---

**Phase 2 ready.**
