# SmartSuite Parity Report 05 — Mobile, Forms, Document Designer, Integrations, API, Onboarding

Scope: Mobile App + Forms + Document Designer + Integrations + API + Getting Started + Pro Tips + Recent Product Updates (Nov 2025 → Mar 2026), benchmarked against the LYTEHAUS Technologies platform.

Status of LYTEHAUS at time of report: COMPVSS PWA exists with a thin service worker and keyboard‑wedge scanners; passkey (WebAuthn) is implemented for /me; FormShell + a single public form route exist; Boarding Pass guides are JSONB‑rendered, not PDF; CSV import covers crew/tasks/vendors only; webhook outbound endpoints exist; `/me/api-keys` issues PATs but no documented public REST.

## 1. Executive summary

- **Mobile gap is shallower than it looks.** SmartSuite mobile is a thin shell over the same React app — it has no offline write/sync, no in‑app camera scanner, no biometric login of its own. Their own docs say mobile lacks Pivot, Map, Kanban, Card, Calendar widgets and Record History/My Work widgets. LYTEHAUS COMPVSS already wins on PWA shell installability and WebAuthn passkeys; the missing pieces are **camera‑based scanning**, **IndexedDB outbox + replay**, and **web push**.
- **SmartSuite has no native camera/QR scanner.** Their mobile articles never mention a built-in barcode/QR scanner, deep links, biometric auth, or push beyond what the OS gives any web app. We can leapfrog them by shipping `BarcodeDetector`/`@zxing` in COMPVSS scanners and a real Web Push pipeline.
- **Forms are SmartSuite's weakest documented surface.** The native Form View has shareable link, embed code, conditional fields/sections, captcha, prefill, passcode, redirect, and `?header=false`. It does **not** ship payments, multi-language, custom domain, or custom CSS — those require Fillout. Our `PublicFormSubmit.tsx` is currently 8 field types and a honeypot; closing the gap is **M-effort**.
- **Document Designer is a real product, our Boarding Pass is not.** SmartSuite's drag-and-drop PDF designer with linked-record tables, image embeds, automation triggers, and the new "Generate PDF: Public Link Disable" toggle (Mar 2026) is materially ahead of our JSON‑schema GuideView, which renders to HTML only. Generalizing the boarding-pass schema into a PDF-renderable template + adding `/api/v1/docs/generate` would close ~80% of the gap.
- **Integrations: SmartSuite leans on third parties.** Their "native" set is just Box/Dropbox/OneDrive file pickers + a Microsoft 365 (mostly Teams) integration. Everything else is Zapier, Make, Fillout, Softr, Noloco, Skyvia, Relay, Ply, WeWeb. We have Stripe + Anthropic + Supabase. **Highest impact integrations to add: Slack, Google Calendar/iCal export, Zapier app, Make app.** ICS export already partially exists at `/api/v1/users/[userId]/calendar.ics` and `/api/v1/schedule.ics`.
- **API: we have the bones, not the docs or the breadth.** SmartSuite limits 5 req/s/user, 50k/mo on Pro, and exposes bulk, hydration, metadata, file upload, and pagination. Our PAT system + `/api/v1/*` routes exist but: no public REST surface for the core data model (projects, tickets, deliverables) is documented; no rate-limit middleware tied to plan; no `/api/v1/applications` schema discovery; bulk record helpers undocumented.
- **Rate limiting is a real gap.** SmartSuite enforces per-user 5 req/s and per-workspace monthly quotas with a 125% hard cap. Our `proxy.ts` does basic rate limits but there's no plan-aware quota or 429 semantics aligned to a public API contract.
- **CSV import is narrow.** We have crew/tasks/vendors only, with a 1k-row sync cap and no async job. SmartSuite documents only CSV/Excel as a first-class import too — no Airtable/Asana/Trello/Monday/Smartsheet/Notion/ClickUp connector. That is a **shared gap**, but for a production-management platform a "from Airtable" path is high signal for migrators.
- **Recent SmartSuite shipping pace is on AI fields, conditional UI, dashboard widgets, and SCIM.** The most copyable items: AI Field Agents in fields, Conditional Tabs on mobile, SmartSuite Notification automation action, SCIM provisioning, SSO logout URL, Auto Number with prefixes/suffixes, and Generate PDF public-link disable.
- **Pro Tips bundle is mostly UX micro-features.** Column totals, section organizers, keyboard shortcuts, "filter by current user", spacebar-open. Most are already implicit in our shadcn-derived primitives; the explicit one to copy is **"Filter by Current User"** in list views and **"Starring"** for solutions/projects.
- **My Work is a feature we can copy in 1-2 days.** Their "all your assignments across all solutions" rollup with Overdue/Today/Upcoming/Later/No Due Date buckets maps directly onto our `/me` and `/m` shells. We have most of the data; what's missing is the cross-resource union query and a single page.

## 2. Mobile (COMPVSS) parity matrix

| Capability                     | SmartSuite                                                                                    | LYTEHAUS COMPVSS                                                                                                                             | Verdict                       | File / next step                                                                                                         |
| ------------------------------ | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Installable PWA / native shell | Native iOS + Android wrappers (App Store / Play)                                              | PWA only via `public/manifest.json` (just 2 icons, no maskable, no splash)                                                                   | Behind                        | Add maskable icons, splash, share_target. `/public/manifest.json`                                                        |
| Offline read of cached records | Limited; no offline support documented for record edit                                        | SW stale-while-revalidate of shell only — `PRECACHE = ["/", "/m", "/m/check-in", "/m/tasks"]`. API requests fall through to a 503 JSON       | Tied / Behind                 | `public/service-worker.js` lines 32-48 — extend cache to per-project ROS + today's shifts                                |
| Offline writes / outbox        | Not documented anywhere in SmartSuite docs                                                    | Marketing copy claims "scans queue locally in IndexedDB and replay" (`src/lib/blog.ts`) but **no implementation exists**                     | LYTEHAUS Behind own marketing | Build `src/lib/offline/outbox.ts` (IndexedDB) + Background Sync replay. Ship for /m/check-in, /m/gate/scan, /m/incidents |
| Conflict resolution            | Not documented                                                                                | Not implemented                                                                                                                              | Tied — both gap               | When outbox lands: server-side `idempotency-key` header + last-write-wins with audit row                                 |
| Camera barcode/QR scanner      | Not documented in mobile articles                                                             | Keyboard-wedge only — `CheckInScanner.tsx` and `GateScanner.tsx` use `<input>` with autoCapitalize                                           | Tied / opportunity to leap    | Add `BarcodeDetector` (Chrome/Android) with `@zxing/browser` fallback. New `<CameraScanner>` primitive                   |
| Static image / camera capture  | Filestack on Document View (Mar 2026 mobile article)                                          | `incidents/photo-upload/route.ts` exists; mobile UI uses native `<input type="file" capture>` (none of the .tsx files use it directly today) | Behind                        | Add `<input type="file" accept="image/*" capture="environment">` to incident, daily-log, check-in flows                  |
| Geolocation on scan            | Not documented                                                                                | Implemented — `CheckInScanner.tsx` lines 41-50 attaches `{lat,lng,accuracy}` to scan POST                                                    | Ahead                         | Keep                                                                                                                     |
| Push notifications             | Not documented (relies on native wrapper push)                                                | None — `grep PushManager` returns no hits                                                                                                    | Behind                        | Implement Web Push with VAPID. New `/api/v1/push/subscriptions` + service-worker `push` event                            |
| Biometric login                | Not documented                                                                                | Implemented — `@simplewebauthn/browser` + `/api/v1/auth/webauthn/*`                                                                          | Ahead                         | Surface passkey login on `/m` (only `/me/security` exposes it today)                                                     |
| Deep links                     | Not documented                                                                                | URL-based routes — no `intent://` or universal-links file                                                                                    | Tied                          | Add `apple-app-site-association` + `assetlinks.json` only when native wrapper ships                                      |
| Haptic feedback                | Not documented                                                                                | Implemented — `src/lib/haptics.ts` used by both scanners                                                                                     | Ahead                         | Keep                                                                                                                     |
| Screen-reader live region      | Not documented                                                                                | `useAnnounce()` from `LiveRegion.tsx` used in both scanners                                                                                  | Ahead                         | Keep                                                                                                                     |
| Mobile dashboard widgets       | Documented limits — no Pivot/Map/Kanban/Card/Calendar, no Record History/My Work widgets [^1] | Custom mobile views per role; no widget framework yet                                                                                        | Different model               | Don't copy widget framework — our role-based shells are the better answer                                                |
| Mobile Time Tracking           | Shipped Oct 2025 — mobile timer start/stop [^2]                                               | `m/clock/page.tsx` exists with shift check-in via `/api/v1/shifts/checkin`                                                                   | Tied                          | Audit that timer state survives backgrounding                                                                            |
| Conditional Tabs on mobile     | Shipped Oct 2025 [^2]                                                                         | Not in scope; our mobile shell tabs are role-based, not record-based                                                                         | N/A                           | Don't copy                                                                                                               |

Citations: `[^1]` https://help.smartsuite.com/en/articles/13706670-mobile-dashboard-widgets-supported-features-and-limitations-guide ; `[^2]` https://help.smartsuite.com/en/articles/12685126-product-updates-october-2025-edition

## 3. Forms

### What SmartSuite Form View actually ships

From https://help.smartsuite.com/en/articles/6267415-form-view and https://help.smartsuite.com/en/articles/6526045-sharing-forms:

- **Sharing**: Shareable Link + Embed Code; `?header=false` URL param; no custom domain documented.
- **Conditional logic**: per-field, per-section, on Heading-grouped fields, on display elements (images/videos).
- **Branding**: custom logo + clickable logo are paid-only; "Powered by SmartSuite" toggle is paid-only.
- **File upload**: up to 25 attachments per Files/Images field.
- **Post-submit**: customizable thank-you message; URL redirect supported.
- **Anti-spam**: Captcha display element. No native multi-language. Honeypot not mentioned.
- **Prefill**: URL parameter prefilling supported, with option to hide prefilled fields.
- **Access**: passcode protection for shared forms.
- **Payments / multi-language / custom CSS / custom domain**: not in native form view; routed to Fillout.

### What LYTEHAUS has today

`src/app/forms/[slug]/PublicFormSubmit.tsx` + `src/components/FormShell.tsx`:

- 8 field types: text, textarea, email, url, number, date, select, checkbox.
- Honeypot field (`hp_url`) — already ahead of SmartSuite's documented anti-spam beyond captcha.
- Server-action submission (`submitFormAction(slug, prev, fd)`) — slug is the auth boundary, mirroring our portal model.
- No conditional logic, no branding controls beyond `var(--org-primary)`, no captcha integration, no file upload, no redirect URL, no prefill, no passcode, no multi-page.

### Recommended build (M effort, ~5-7 days)

1. **Schema-driven public forms** at `/forms/[slug]` — extend `PublicFormField` to include `conditions: { ifField: string; equals: string | boolean }[]` and `section: string`. Renderer hides fields where conditions fail.
2. **File upload field**: leverage existing Supabase Storage (`branding` or new `form-uploads` bucket) with signed-URL upload from the client.
3. **Captcha**: Cloudflare Turnstile (free, no Google account, no PII) — wraps the submit button. Existing honeypot stays.
4. **Redirect after submit**: add `redirect_url` to form schema; replace the static "Thanks" with `redirect()` server action.
5. **Prefill via URL params**: read `searchParams` server-side and pass `defaultValues` into `PublicFormSubmit`.
6. **Passcode**: add `passcode_hash` column on the form table; gate the page with a 1-input form before rendering the real one.
7. **Embed mode**: read `?header=false` and `?embed=1` to hide the marketing chrome (matches SmartSuite's URL contract verbatim — easier for migrators).
8. **Payments (Crew tier)**: an optional `payment_required: { amount_cents, currency }` per form; submit triggers `/api/v1/stripe/checkout` and the form is recorded `paid` only on webhook receipt. We already have Stripe + the webhook receiver — payments-on-form is nearly free.

Files to create / extend:

- `src/lib/forms/types.ts` — schema (currently only embedded as PublicFormField in PublicFormSubmit.tsx)
- `src/components/forms/PublicFormRenderer.tsx` — replace inline fields with conditional renderer
- `src/app/(platform)/console/forms/[id]/page.tsx` — internal form designer (M)
- `src/app/api/v1/forms/[slug]/submissions/route.ts` — create + list

## 4. Document Designer / PDF generation

### SmartSuite Document Designer (https://help.smartsuite.com/en/articles/6864468-document-designer)

- **Drag-and-drop canvas** with grid positioning, font/size/weight/color/rotation/line-height controls, 80 preset colors.
- **Static elements**: lines, rectangles, circles, text, images, links.
- **Linked Record fields render as configurable tables** with column-width controls; relative positioning lets sections flow when linked records expand. This is their primary "repeating section" mechanism.
- **No documented conditional sections**, no headers/footers, no page breaks.
- **Output**: PDF only.
- **Triggers**: manual export from record menu (https://help.smartsuite.com/en/articles/9450582), button-bound on a record (Pro Tips), `Generate PDF` automation action, and a `DocsAutomator` action.
- **Mar 2026 update**: "Generate PDF: Public Link Disable Option" — toggle to remove clickable public links from automation history. Implies their default puts generated PDFs at public, possibly guessable URLs — a gap we can publicly avoid.
- **No e-sign / DocuSign integration documented.**

### LYTEHAUS Boarding Pass today

- `src/lib/guides/types.ts` defines a discriminated-union `GuideSection` with 17 types (overview, schedule, set_times, timeline, credentials, contacts, faq, sops, ppe, radio, resources, evacuation, fire_safety, accessibility, sustainability, code_of_conduct, custom).
- `src/components/guides/GuideView.tsx` renders to HTML with a sticky section nav and persona-scoped views.
- Output is **HTML only** (no PDF).
- CMS is at `/console/projects/[projectId]/guides/[persona]`.

### Recommendation: generalize Boarding Pass into a Document Designer

The schema is half the work. We have a typed, sectioned, JSON-driven document model that is more opinionated and arguably better for production-management than a free-form drag-and-drop canvas. The right move is to **add render targets, not replace the model**.

Concrete plan:

1. **PDF render target** (`L` effort, ~3-5 days): server-side render `<GuideView>` via `@react-pdf/renderer` or Puppeteer-on-Vercel-edge. Build `src/lib/docs/render-pdf.ts` and a `/api/v1/guides/[id]/pdf` route. Mirror the existing `/api/v1/deliverables/[id]/download` signed-URL pattern.
2. **Generalize the section schema** (`M`): move from `GuideSection` (event-specific) to `DocSection` with the same union, plus add a `merge` directive so sections can pull arbitrary record data — `{ type: "merge_table", source: "tickets.where(project_id=)", columns: [...] }`. The Boarding Pass becomes one of N templates; "Pay App Cover Sheet", "COI Bundle", "Production Schedule" become other templates. Add `deliverable_templates` (already exists at `/api/v1/deliverable-templates`) → wire through.
3. **Conditional sections** (`S`): per-section `visibleIf: { field: string; equals: string }` resolved at render time. SmartSuite doesn't have this — instant lead.
4. **Repeating / linked-record sections** (`M`): we already have schedule/set_times/credentials as collections; formalize as `repeats_over: "linked_records.<table>"`.
5. **Headers / footers / page breaks** (`S`): just `header`, `footer`, `pageBreakAfterSection: number` fields on `GuideConfig`. PDF renderer respects them.
6. **e-sign hand-off** (`M`, optional): proposals already collect signatures. Reuse that flow for any rendered PDF — `/api/v1/proposals/[id]/sign` is the precedent.
7. **Batch generation** (`S`): `/api/v1/guides/batch` accepts `{ template_id, record_ids }`, returns a Job that produces a zip of PDFs in storage.
8. **No public-link default** (`S`): generated PDFs go to a private Supabase Storage bucket; downloads only via signed URL with 15-minute TTL. This is the inverse of SmartSuite's default and can be a marketing point.

Files: `src/lib/docs/`, `src/app/(platform)/console/templates/`, `/api/v1/docs/generate/route.ts`.

## 5. Integrations matrix

| Integration                                         | SmartSuite                                                                                      | LYTEHAUS                                                                                                                                         | Recommendation                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stripe (payments / payouts)                         | Not documented                                                                                  | Implemented — `/api/v1/stripe/checkout`, `/api/v1/stripe/connect/onboarding`, webhook at `/api/v1/webhooks/stripe` with HMAC-SHA256 verification | LYTEHAUS ahead. Keep.                                                                                                                                                                                                                                                                                                                              |
| Anthropic / OpenAI / Gemini                         | AI Assist supports GPT 5.1, Claude Sonnet 4.5, Gemini 3 Pro (Mar 2026) [^3]                     | Anthropic only — `claude-sonnet-4-6` / `claude-opus-4-7` in `/api/v1/ai/chat/route.ts`                                                           | Add adapter pattern in `src/lib/ai/` so org admins can BYO key for any provider. M effort.                                                                                                                                                                                                                                                         |
| Slack                                               | Not native — only via Zapier/Make                                                               | None. We ship `notifications` table but no Slack delivery                                                                                        | **Highest-impact add.** New `/api/v1/integrations/slack/install` (OAuth) + `notifications.delivery_targets` join. Slack DMs for shift assignments and incident alerts is the killer use case. M-L.                                                                                                                                                 |
| Microsoft Teams / 365                               | Native — Microsoft 365 admin guide [^4] requires Entra ID P1, OAuth admin consent flow          | None                                                                                                                                             | Lower priority than Slack for our customer base (production / events lean Slack-first). Park.                                                                                                                                                                                                                                                      |
| Google Calendar / Outlook Calendar                  | Not native                                                                                      | ICS export exists — `/api/v1/users/[userId]/calendar.ics`, `/api/v1/schedule.ics`                                                                | Tied. Add OAuth Google Calendar **write-back** for shift assignments — bidirectional. M.                                                                                                                                                                                                                                                           |
| Google Drive / Dropbox / OneDrive / Box             | Native file picker integrations [^5]                                                            | Supabase Storage (advancing, receipts, proposals, credentials, branding buckets)                                                                 | Add Drive picker for advancing deliverable uploads. S effort using Google Picker API. Skip Dropbox/OneDrive for now.                                                                                                                                                                                                                               |
| Zapier                                              | Native app — 2 triggers (record created/updated), 4 actions (create/update/find/find-many) [^6] | None                                                                                                                                             | **Build a Zapier app.** Triggers: project.created, ticket.scanned, deliverable.submitted, invoice.paid (we have webhook events for all of these — `/api/v1/webhooks/endpoints/route.ts` lines 14-26). Actions: create project, create task, log expense. M. Distribution > engineering: Zapier app is what migrating Airtable/Monday users expect. |
| Make.com                                            | Native — 11 modules incl. bulk + custom-API [^7]                                                | None                                                                                                                                             | After Zapier. Same backend; Make has `Make an API Call` so we get most of it free if we ship a clean public REST.                                                                                                                                                                                                                                  |
| Webhook (outbound)                                  | Not documented in SmartSuite                                                                    | **Implemented** — `webhook_endpoints` table, HMAC secret minted once, 16 event types incl. `*` wildcard                                          | LYTEHAUS ahead. Keep. Document publicly.                                                                                                                                                                                                                                                                                                           |
| OAuth provider (let other apps log in via LYTEHAUS) | Not native; SCIM provisioning shipped Nov 2025 [^8]                                             | Not implemented; we have `/api/v1/auth/oauth/route.ts` (probably consumer-side)                                                                  | Park. SCIM is the more actionable copy.                                                                                                                                                                                                                                                                                                            |
| Embed widgets / iframe                              | Form embed code only                                                                            | Public proposals + `/forms/[slug]` are iframe-friendly                                                                                           | Add `?embed=1` to portal guide pages and proposal pages. S.                                                                                                                                                                                                                                                                                        |
| Fillout (form supplier)                             | Documented integration [^9] for advanced forms                                                  | N/A — we own the form layer                                                                                                                      | Stay self-hosted.                                                                                                                                                                                                                                                                                                                                  |
| Softr / Noloco / WeWeb / Ply / Relay / Skyvia       | Various third-party app builders                                                                | Not relevant — we're not a no-code DB                                                                                                            | Skip.                                                                                                                                                                                                                                                                                                                                              |
| iCal export                                         | Not documented                                                                                  | Implemented                                                                                                                                      | Keep.                                                                                                                                                                                                                                                                                                                                              |
| Service-worker / PWA                                | Generic — relies on browser PWA support                                                         | Implemented                                                                                                                                      | Keep, expand cache scope.                                                                                                                                                                                                                                                                                                                          |

Citations: `[^3]` https://help.smartsuite.com/en/articles/14645579-product-updates-march-2026-edition ; `[^4]` https://help.smartsuite.com/en/articles/13565082-smartsuite-for-microsoft-365 ; `[^5]` https://help.smartsuite.com/en/articles/8261840 / 8264299 / 8268281 ; `[^6]` https://help.smartsuite.com/en/articles/6092620-automate-your-workflows-with-zapier ; `[^7]` https://help.smartsuite.com/en/articles/6805203-make-triggers-actions ; `[^8]` https://help.smartsuite.com/en/articles/12945568-product-updates-november-2025-edition ; `[^9]` https://help.smartsuite.com/en/articles/8265225

## 6. API parity

### SmartSuite REST contract (from API collection)

- **Base**: `https://app.smartsuite.com/api/v1/` [^a]
- **Auth**: `Authorization: Token <key>` + `Account-Id: <workspace_id>` headers. User-scoped, inherits user's workspace permissions. Binary: full vs read-only [^b]. No per-token scopes.
- **Rate limits**: 5 req/s/user under quota, 2 req/s/user over quota; monthly workspace quotas — Free 100, Team 5k, Pro 50k, Enterprise 250k; 125% hard cap; $15 / 1k extra calls; 429 responses; per-second windows [^c].
- **Pagination**: `limit` + `offset`, response shape `{ total, offset, limit, items }`. No cursor.
- **Filtering**: POST body with `filter: { operator: "and"|"or", fields: [{ field, comparison, value }] }` and `sort: [{ field, direction }]`. Type-specific operators (`is`, `is_not`, `contains`, `is_before`, `is_greater_than`, `is_any_of`, `is_empty`).
- **Bulk**: `POST/PATCH /api/v1/applications/[tableId]/records/bulk/` for create/update; `PATCH /api/v1/applications/[tableId]/records/bulk_delete/?fields=id` for delete. PUT is destructive overwrite, PATCH is merge. Atomicity not documented.
- **Hydration**: `?hydrated=true` (GET) or `"hydrated": true` (POST) to inline label/value pairs for Single Select, Status, Assigned To, Tags. Cuts roundtrips.
- **Metadata API**: `GET /api/v1/applications/` lists tables; `GET /api/v1/applications/[App_Id]/` gets one; `POST .../add_field/` and `.../bulk-add-fields/` for schema mutation. No documented "list fields with types" endpoint.
- **Files**: `POST /api/v1/recordfiles/{table}/{record}/{field}/` multipart upload; `GET /api/v1/shared-files/{handle}/get_url/` for download URL. Max size not documented.

### LYTEHAUS API today

- Routes: `/api/v1/*` (all listed). Helpers in `src/lib/api.ts`: `apiOk`, `apiCreated`, `apiError`, `parseJson` with Zod. Standard envelope: `{ ok: true, data }` / `{ ok: false, error: { code, message, details? } }`.
- Auth: cookie session OR `Authorization: Bearer pat_*` PAT. PATs are org-scoped, hashed in DB, optional expiry, optional `scopes: string[]` (currently free-form). `src/lib/auth.ts` lines 36-56.
- Rate limits: present in `src/proxy.ts` (per the CLAUDE.md note) but not plan-aware and no documented rate-limit headers.
- Pagination / filter / sort: no standard pattern exposed. List endpoints (e.g. `/api/v1/projects`) probably use Supabase defaults, not a public spec.
- Bulk: only the import routes (`/api/v1/import/{crew-members,tasks,vendors}`) accept bulk; no generic bulk on the resource model.
- Schema discovery: none — there is no `/api/v1/applications` analog to advertise table/field metadata to integrators.
- Files: Supabase signed URLs (`/api/v1/deliverables/[id]/download`). Direct multipart upload route exists for incidents (`/api/v1/incidents/photo-upload`). No generic upload contract.

### Gaps and recommendations

| Gap                                               | Severity | Fix                                                                                                                     |
| ------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| No public REST documentation                      | High     | Add `src/app/api-docs/page.tsx` rendering an OpenAPI schema generated from Zod. Follow Stripe-style docs site. M.       |
| No plan-aware rate limits + standard 429 headers  | High     | Extend proxy: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After`. Tie quotas to `orgs.tier`. M. |
| No standard list / filter / sort grammar          | High     | Adopt: `?limit=&offset=&filter[field][eq]=&sort=-created_at`. Bake into `listOrgScoped()`. M.                           |
| Per-token scopes are stored but unenforced        | Med      | Tie `api_keys.scopes` to capability strings (e.g. `projects:read`); enforce in `withAuth` PAT path. S.                  |
| No bulk record endpoints for projects/tickets/etc | Med      | Add `/api/v1/{resource}/bulk` mirroring SmartSuite's PATCH-merge / PUT-overwrite contract. M.                           |
| No schema discovery                               | Med      | `/api/v1/schema` returns enum tables, field defs (would help our own AI tooling too). S-M.                              |
| No webhook subscription via API (only console)    | Low      | We already have `webhook_endpoints` route — document it. S.                                                             |
| No file upload endpoint generic                   | Med      | `POST /api/v1/files/{bucket}/{path}` returning signed URL + handle, mirroring `recordfiles/get_url/`. S.                |
| Hydration for ID columns                          | Low-Med  | Add `?hydrated=1` to list endpoints to inline `assigned_to → {id, name, email}`. S.                                     |

Citations: `[^a]` https://help.smartsuite.com/en/articles/4356333-smartsuite-api-overview ; `[^b]` https://help.smartsuite.com/en/articles/4856995-rest-api-permissions ; `[^c]` https://help.smartsuite.com/en/articles/4856710-api-limits

## 7. Onboarding / import

### SmartSuite onboarding (from collection 2511067)

30 articles. Notable: Quick Tips, Quickstart Guide, SmartSuite Academy, Getting Started Videos, Moving to SmartSuite, Glossary, Logging In, Member Profile, **Using SmartSuite Offline**, Power Search, Starred Items (Favorites), Recycle Bin, Build your First Workflow, Guide to View Types, Visualize Data with Charts, Getting Started with Dashboards, See Your Activity History, Member Directory, **CSV/Excel Data Import**.

Crucially: **only one import path is documented — CSV/Excel.** No native Airtable, Asana, Trello, Monday, Smartsheet, Notion, ClickUp connectors. They expect you to leave those tools via export-to-CSV.

### LYTEHAUS onboarding today

- `src/app/(auth)/{login,signup,...}` shells exist.
- Demo org auto-created via Supabase trigger.
- CSV import for crew/tasks/vendors only (`/api/v1/import/*`), 1k-row sync cap, dedup by email-or-(name,phone).
- No templates gallery, no sample data wizard, no "import from Airtable" wizard, no project-bootstrap-from-template.

### Recommendations

1. **Templates gallery (`L`)**: leverage existing `deliverable_templates` infra. Add a `project_templates` table; on org creation seed 3-5 (Festival, Corporate Activation, Tour Day, Pay-App Bundle, Sponsor Activation). New `/console/templates` and `/console/projects/new?template=festival`.
2. **Sample data toggle (`S`)**: a "Load sample MMW26 data" button on first console visit copies the demo project into the user's org. Reduces empty-state friction.
3. **Import expansion (`M each`)**:
   - **Projects** — JSON / CSV. Highest priority since right now nothing creates a project in bulk.
   - **From Airtable** — paste API key + base ID, our server pulls schema and maps to projects/tickets. Hugely valuable for migrators. Use Airtable REST API.
   - **From Google Sheets** — link a sheet, schedule a polling sync.
4. **Async import jobs (`M`)**: the existing routes cap at 1k rows. Add a `job_queue` table (already mentioned as a follow-up in the comment in `/api/v1/import/crew-members/route.ts` line 17) with per-job progress streamed via Server-Sent Events.
5. **First-run wizard (`M`)**: `/console/onboarding/{step}` — pick persona (production company vs vendor vs venue), invite team, pick template, import or skip. Replaces the cold blank console.
6. **Member Directory (`S`)**: a /me peer view of org members for cross-team visibility. SmartSuite ships this; we don't. Trivial to add given `memberships` table.
7. **Power Search (`M`)**: cross-resource quick-open (Cmd-K) over projects, tickets, people, deliverables. Used to be a standard SmartSuite feature; would be high-leverage here.
8. **Starred Items (`S`)**: `user_stars(user_id, resource_type, resource_id)` table; a star icon on every list row; a Starred section on `/console`.

## 8. Recent SmartSuite product updates worth copying (last 6 months)

Drawn from Mar 2026, Feb 2026, Jan 2026, Dec 2025, Nov 2025, Oct 2025 editions.

| Feature                                                                | SmartSuite source | Why it matters for LYTEHAUS                                                                                                                                                       | Effort          |
| ---------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| **AI Field Agents** (general availability, with attachments, Mar 2026) | [^3]              | Agent-in-a-cell for summaries, classifications, structured outputs. Could power "auto-extract from credential PDF" in `/api/v1/credentials/extract` (already exists). Generalize. | M               |
| **SmartSuite Notification automation action** (Oct 2025)               | [^2]              | We have a `notifications` table but no first-class "send notification" automation. Add to the automation engine when it lands.                                                    | S               |
| **SCIM provisioning** (Nov 2025)                                       | [^8]              | Enterprise-tier sales unlock — auto-provision from Okta/Entra ID. We already have invites at `/api/v1/console/people/invites`; SCIM is a thin RESTful wrapper.                    | L               |
| **SSO logout URL** (Jan 2026)                                          | [^j]              | Tiny: configurable post-logout redirect. Fits our existing auth flow.                                                                                                             | S               |
| **Conditional Display of Fields** (Oct 2025)                           | [^2]              | Show/hide fields by condition. Already partially in our forms; extend to console edit forms via FormShell.                                                                        | M               |
| **Linked Record Inline Edit** (Nov 2025)                               | [^8]              | Edit related rows without opening. Console list views would benefit (e.g. assigning a vendor to a PO without leaving the PO page).                                                | M               |
| **Generate PDF: Public Link Disable** (Mar 2026)                       | [^3]              | We should ship private-by-default — don't even add the toggle, never expose public unsigned URLs. Free marketing point.                                                           | already-default |
| **Auto Number with prefixes/suffixes** (Mar 2026)                      | [^3]              | Project codes (LYT-2026-0042), invoice numbers (INV-2026-001) want this. Build into a generic `auto_number` field type.                                                           | S               |
| **Twilio Voice Messaging** (Mar 2026)                                  | [^3]              | If we ship Twilio for incident alerts (we don't yet), voice-message branch would matter at festival scale. Park.                                                                  | M               |
| **Dashboard Deep Links to Tabs** (Feb 2026)                            | [^k]              | Our `/console` doesn't have shareable deep links into nested tabs. Add `?tab=` URL state to all our tabbed pages.                                                                 | S               |
| **Solution Packaging** (Nov 2025)                                      | [^8]              | Package multiple "solutions" with relationships preserved. Maps to project-template export/import — see §7 #1.                                                                    | L               |
| **Mobile Document View** (Mar 2026)                                    | [^3]              | Their newest mobile feature is exactly the boarding-pass view we already do. Validates the bet.                                                                                   | already-done    |

`[^j]` https://help.smartsuite.com/en/articles/14645562-product-updates-january-2026-edition ; `[^k]` https://help.smartsuite.com/en/articles/14645570-product-updates-february-2026-edition

## 9. Top 10 implementation recommendations (impact ÷ effort)

Ranked best-first.

1. **Camera-based scanner primitive** — `S`. Add `<CameraScanner>` using `BarcodeDetector` API + `@zxing/browser` fallback; refactor `CheckInScanner.tsx` and `GateScanner.tsx` to use it. SmartSuite has nothing here. → `src/components/scanners/CameraScanner.tsx`, `src/app/(mobile)/m/check-in/CheckInScanner.tsx:25-105`, `src/app/(mobile)/m/gate/scan/GateScanner.tsx:33-100`.
2. **IndexedDB outbox + replay for offline scans/incidents** — `M`. Backs the marketing claim already on the site. Service-worker `sync` event + new lib. → `src/lib/offline/outbox.ts` (new), update `public/service-worker.js`.
3. **Zapier app** — `M`. Distribution play. Triggers and actions wired to our existing webhook events (`/api/v1/webhooks/endpoints/route.ts:14-26`). → external Zapier project; new `/api/v1/integrations/zapier/auth` for token exchange.
4. **PDF render of Boarding Pass / Document Designer v1** — `L`. Generalizes the schema, adds private-by-default PDF output. Highest user-visible polish gain. → `src/lib/docs/render-pdf.ts` (new), `/api/v1/guides/[id]/pdf` (new), reuse `src/components/guides/GuideView.tsx`.
5. **Public REST + OpenAPI docs site** — `M`. Document `/api/v1/*`, add filter/sort/pagination grammar to `listOrgScoped`, expose schema discovery. → `src/lib/db/resource.ts`, new `src/app/api-docs/page.tsx`.
6. **Plan-aware rate limits + 429 headers** — `M`. Move from "anti-abuse" to "API contract." → `src/proxy.ts`, new `src/lib/api/rate-limit.ts`.
7. **Slack integration** — `M-L`. Highest-value notification channel for our customer base. → `src/app/api/v1/integrations/slack/{install,events,uninstall}/route.ts`, new `notification_channels` table.
8. **Forms v2: conditional logic + file upload + captcha + redirect + payments** — `M`. Pulls our public forms ahead of SmartSuite native (which doesn't ship payments). → `src/components/forms/PublicFormRenderer.tsx`, `src/lib/forms/types.ts`, both new; extend `src/app/forms/[slug]/PublicFormSubmit.tsx`.
9. **Web Push (VAPID)** — `M`. Notifications without a native wrapper. SmartSuite doesn't ship this either via web. → `public/service-worker.js` (push handler), new `/api/v1/push/subscriptions`, integrate with `notifications` table.
10. **Async import jobs + project-import + Airtable importer** — `L`. Migration on-ramp. → `src/lib/jobs/queue.ts`, `src/app/(platform)/console/import/page.tsx`, new transformers under `src/lib/import/transformers/`.

Stretch (not in top 10):

- My Work rollup page at `/me/work` (S) — copy SmartSuite's bucket UI exactly.
- Member Directory (S).
- Cmd-K Power Search (M).
- Auto Number field type (S).
- Conditional Display of Fields in FormShell (M).
- Star/favorite system (S).

## 10. Citations

### Mobile

- https://help.smartsuite.com/en/collections/2756383-smartsuite-mobile-app
- https://help.smartsuite.com/en/articles/13706670-mobile-dashboard-widgets-supported-features-and-limitations-guide
- https://help.smartsuite.com/en/articles/14289912-mobile-document-view
- https://help.smartsuite.com/en/articles/11066617-smartsuite-mobile-chart-widget-display
- https://help.smartsuite.com/en/articles/11205530-mobile-dashboards-grid-view-widget

### Document Designer

- https://help.smartsuite.com/en/articles/6864468-document-designer
- https://help.smartsuite.com/en/articles/9450582-export-to-document-template
- https://help.smartsuite.com/en/articles/8097873-open-document-template-with-a-button

### Forms

- https://help.smartsuite.com/en/articles/6267415-form-view
- https://help.smartsuite.com/en/articles/6526045-sharing-forms
- https://help.smartsuite.com/en/articles/10088624-understanding-form-permissions-in-smartsuite
- https://help.smartsuite.com/en/articles/8265225-creating-connecting-a-smartsuite-form-in-fillout

### Integrations

- https://help.smartsuite.com/en/collections/2511080-integrations
- https://help.smartsuite.com/en/articles/13565082-smartsuite-for-microsoft-365
- https://help.smartsuite.com/en/articles/6092620-automate-your-workflows-with-zapier
- https://help.smartsuite.com/en/articles/6805203-make-triggers-actions
- https://help.smartsuite.com/en/articles/8261840-add-files-from-box-com-to-smartsuite
- https://help.smartsuite.com/en/articles/8264299-add-files-from-dropbox-to-smartsuite
- https://help.smartsuite.com/en/articles/8268281-add-files-from-onedrive-to-smartsuite

### API

- https://help.smartsuite.com/en/articles/4356333-smartsuite-api-overview
- https://help.smartsuite.com/en/articles/4855681-generating-an-api-key
- https://help.smartsuite.com/en/articles/4856710-api-limits
- https://help.smartsuite.com/en/articles/4856995-rest-api-permissions
- https://help.smartsuite.com/en/articles/6464251-paginating-api-request-results
- https://help.smartsuite.com/en/articles/6963760-sorting-and-filtering-records-in-the-rest-api
- https://help.smartsuite.com/en/articles/6458532-metadata-api-documentation
- https://help.smartsuite.com/en/articles/6591047-returning-hydrated-record-values-from-the-smartsuite-api
- https://help.smartsuite.com/en/articles/7842079-uploading-and-downloading-files-from-the-smartsuite-api
- https://help.smartsuite.com/en/articles/7170415-bulk-record-actions-in-the-rest-api
- https://developers.smartsuite.com/docs/intro

### Getting Started / Pro Tips / My Work

- https://help.smartsuite.com/en/collections/2511067-getting-started
- https://help.smartsuite.com/en/collections/3402978-smartsuite-pro-tips
- https://help.smartsuite.com/en/articles/4951176-my-work
- https://help.smartsuite.com/en/articles/6555853-keyboard-shortcuts
- https://help.smartsuite.com/en/articles/6555888-filter-by-current-user
- https://help.smartsuite.com/en/articles/6555945-starring-commonly-accessed-solutions

### Recent product updates (Nov 2025 → Mar 2026)

- https://help.smartsuite.com/en/articles/14645579-product-updates-march-2026-edition
- https://help.smartsuite.com/en/articles/14645570-product-updates-february-2026-edition
- https://help.smartsuite.com/en/articles/14645562-product-updates-january-2026-edition
- https://help.smartsuite.com/en/articles/14645545-product-updates-december-2025-edition
- https://help.smartsuite.com/en/articles/12945568-product-updates-november-2025-edition
- https://help.smartsuite.com/en/articles/12685126-product-updates-october-2025-edition

### LYTEHAUS source paths referenced

- `src/components/FormShell.tsx`
- `src/app/forms/[slug]/PublicFormSubmit.tsx`
- `src/app/(mobile)/m/check-in/CheckInScanner.tsx`
- `src/app/(mobile)/m/gate/scan/GateScanner.tsx`
- `src/lib/api.ts`, `src/lib/auth.ts`
- `src/lib/guides/types.ts`, `src/components/guides/GuideView.tsx`
- `src/lib/import/{csv.ts,log.ts,transformers/}`
- `src/app/api/v1/import/{crew-members,tasks,vendors}/route.ts`
- `src/app/api/v1/me/api-keys/route.ts`
- `src/app/api/v1/webhooks/endpoints/route.ts`
- `public/service-worker.js`, `public/manifest.json`
- `src/app/(personal)/me/security/PasskeyManager.tsx`, `src/app/api/v1/auth/webauthn/*`
