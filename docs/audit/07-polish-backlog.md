# Polish backlog — items deferred from the template-automation session

**Context.** Every opportunity in the 26-item template audit has working
code at a resolvable path. The items below are incremental UX + infra
polish on top of shipped APIs + tables. None of them require new
architecture; all slot into the primitives already on main.

Keep this list as the canonical "what's next" so no item gets
re-discovered.

## P1 — UI editors

1. **Stage-plot 2D canvas editor** — drag-and-drop board for
   `stage_plots.elements` jsonb. New `/console/projects/{id}/stage-plots/{id}`
   route consuming the existing `GET/POST /api/v1/stage-plots`.
2. **Incident form with photo uploader** — inline form at
   `/console/operations/incidents/new` + matching `/m/incidents/new`
   upgrade. Photos go to a new `incident-photos` private bucket;
   paths land in `incidents.photos` jsonb.
3. **Deliverable-template picker on new-deliverable** — modal that
   reads `deliverable_templates` filtered by type, pre-fills
   `deliverables.data`.
4. **Email-template editor with merge-tag autocomplete** — upgrade
   `EmailTemplatesPanel` to a split-pane Monaco-style editor; lint
   merge-tag syntax client-side.
5. **Export Centre async UI** — when row > 10k, the form queues a
   `job_queue` row and polls `GET /api/v1/exports/{runId}` for status.

## P2 — Async / heavy workloads

6. **`export.package` handler inlining** — replace the placeholder
   in `supabase/functions/job-worker/index.ts` with strategy calls
   against the service client. ~50 lines.
7. **Advance Book job path** — same idea, route the Advance Book
   compile through a worker when > 50 deliverables (compile time
   grows with the count).

## P3 — Per-route E2E

8. **Happy-path e2e for each of the 18 new routes** — seeded
   fixtures for an invoice, a proposal, a vendor RFP, an incident,
   an export run. Each spec asserts 200 response + content-type for
   authed users. Requires `SUPABASE_SERVICE_ROLE_KEY` in CI.
9. **Snapshot-diff on PDF renders** — each renderer gets a fixture
   + a stable byte snapshot; regressions surface on PR diff.

## Done (not re-opened)

- Foundation PDF primitives (layout, branding, watermark, render)
- 16 per-deliverable-type renderers + registry
- Advance Book generator
- Invoice, Event Guide, Call Sheet, Proposal, Audit, Brand Kit,
  Vendor RFP, Expense/Task/Rental/Signage/Wristbands/Version-diff/ICS PDFs
- Project Archive ZIP + CSV/JSON/XLSX strategies
- Three CSV importers (crew, tasks, vendors)
- AI COI + W-9 extraction
- PPTX sponsor deck
- Four new tables (deliverable_templates, stage_plots, incidents, email_templates)
- Console pages: Export Centre, Import Centre, Email templates,
  Incidents list, Stage plots list
- Async export job handler slot (inert placeholder; see P2 above)
