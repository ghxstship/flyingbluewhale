# Competitive Landscape — ClickUp · SmartSuite · Odoo

UI/UX-focused competitive intelligence for the ATLVS audit. Research conducted 2026-06-11 via web search + primary-source fetches. Every claim carries a source and date; unverifiable claims are marked **UNVERIFIED**. Phase 1 of 4 — see `02-internal-audit.md`, `03-parity-matrix.md`, `04-recommendations.md`.

---

## 1. ClickUp

### Recent Releases — 2025–2026

- **ClickUp 4.0 GA — Dec 10, 2025.** Positioned as "Craft & Quality" and "the world's first Converged AI Workspace"; 20M+ users claimed. Headline UX change: **Converged Navigation** — one unified sidebar for tasks, docs, chat/DMs, calendar (source: businesswire.com ClickUp 4.0 press release, 2025-12-10).
- 4.0 also shipped: personalized nav with a **My Tasks hub**, **Teams Hub** (capacity/standups/insights), Calendar & AI Notetaker, AI Planner (source: releasebot.io/updates/clickup + feedback.clickup.com/changelog, 2025-12–2026-06).
- **ClickUp 3.0 deprecated ~March 27, 2026** (source: help.clickup.com 4.0 changelog via search snippet — page 403'd on direct fetch; **partially verified**).
- Stated philosophy shift to "obsessive craft": slower feature velocity, polish and stability first (source: zenpilot.com/clickup-weekly/clickup-weekly-013, 2026-04-10).
- **AI trajectory:** Brain MAX desktop super-app with voice dictation + multi-model switcher (2025-07-07, clickup.com/blog); **Super Agents** — AI teammates that appear as users, take task assignments and DMs (release 4.01, 2026-01-29); **Brain²** announced 2026-05-12 — agentic overhaul with multi-LLM routing, permission-aware retrieval, persistent memory, MCP support; claims 11M+ hosted agents (source: siliconangle.com exclusive, 2026-05-12 — agent count not independently verifiable). AI Cards on dashboards summarize live workspace data in plain language (clickup.com/blog/dashboard-examples, retrieved 2026-06).
- **Views/PM:** custom view icons (3.62, 2025-10-07), Gantt Baselines (4.04, 2026-05-05), granular hourly capacity in Workload view (2026-04-08), Subfolders in beta — a years-old top community request (zenpilot.com, 2026-04-10).
- **Mobile:** 4.0 overhaul — floating Brain button with dictation on every screen, My Tasks rework, claim of "90% of desktop features" on mobile (**UNVERIFIED** — single secondary source).
- **Performance:** 3.0-era RapidViews DB view caching (views 30s → ~1s, clickup.com/performance); "40% load-time improvement for 1,000+ task workspaces" circulates in 2026 reviews — **UNVERIFIED against any primary source**.

### Roadmap — Publicly Announced

(Primary synthesis: ZenPilot partner analysis of ClickUp's published 2026 roadmap, 2026-04-10; Canny board clickup.canny.io.)

- Explicit quality/stability/mobile-polish commitment; engineers "slowing shipping velocity."
- **VibeUp** — natural-language custom app building.
- Brain: agent-driven automated time tracking, external MCP integrations (Salesforce/HubSpot). "Brain now powered by Claude Opus" — **UNVERIFIED on a primary source**.
- Scheduling: native out-of-office capacity reduction, new dependency types (FF/SF/SS), list-level properties, hourly work distribution.
- Reporting: embedded charts in tasks/docs ("promised since 3.0"), user profile attributes (skills, cost rate).
- Top Canny request categories by volume: Hierarchy 4,794 · Docs 2,078 · Fields/Formulas/Statuses 1,869 · Dashboards 1,655 (retrieved 2026-06).

### Recurring Complaints

- **Learning curve / overwhelm** — the dominant G2/Capterra theme: "buttons everywhere… a dizzying array of options"; 2–4-week ramp commonly cited (G2/Capterra, 2025–2026).
- **Notification noise** — floods of irrelevant pings, lost @mentions; roadmap response is admin-set notification defaults.
- **Performance in large workspaces** — perennial; "Make it faster" is a long-lived Canny request; 4.0 early access reported performance "similar to 3.0 on older devices" (dtechsystems.co community roundup, 2025-08-04).
- **4.0 redesign friction** — heavier sidebar, polarizing dark mode, cluttered views tab, mixed old/new UI during staggered rollout (dtechsystems.co, 2025-08-04).
- **Mobile offline gaps** — offline is effectively read-only: no task creation/editing offline; offline voice notes can silently fail; multiple high-engagement Canny threads (feedback.clickup.com, ongoing through 2025).

### View & Dashboard Catalog

16 views (clickup.com/features/views, retrieved 2026-06): List, Board, Calendar, Gantt (dependencies + critical path), Table, Timeline, Workload, Box, Activity, Mind Map, Map, plus page views Docs, Chat, Whiteboards, Forms, Embed. Dashboard cards: Bar/Pie/Line charts from any custom field, Calculation, Portfolio, Embed, Rich Text, AI Cards, Sprint cards (Burndown/Burnup/Velocity/Cumulative Flow). Known limitation: charts only on dashboards and list views — embedding in tasks/docs is roadmap, not shipped.

### Event-Production / Field-Workforce Adjacency

Generic PM templates only (Event Planning, Live Performance Planning use-case page). Workload view + hourly capacity is the closest crew-resourcing analog; Map view the only geo surface. **No** geofenced time clock, shift swaps, credentialing, scan/check-in, asset tracking, or guest-facing portals anywhere in feature pages, help docs, or 2025–26 release notes (absence verified by omission across primary sources reviewed). No offline-first field app — top-voted open Canny request.

---

## 2. SmartSuite

### Recent Releases — 2025–2026

(Primary sources: smartsuite.com/whats-new, monthly blog posts, smartsuite.canny.io/changelog. Note: SmartSuite's monthly posts publish early under the next month's name — dates below are publication dates.)

- **AI Field Agents GA** (2026-03-08): AI assistants embedded in individual fields — analyze record context, generate summaries/classifications/recommendations, trigger-driven runs, optional internet search, attachment context (PDF/CSV/XLSX/images).
- **AI Assist multi-model**: GPT-5.1, Claude Sonnet 4.5, Gemini 3 Pro with intelligent routing (2026-03-08); AI-Powered Trend Analysis over the issues library with a dedicated dashboard (2026-06-09).
- **Forms overhaul** (2026-05): multi-page forms (10 pages), review page, progress bar, linked-record display, Internal Forms mode, enhanced post-submit pages, default values.
- **Dashboards as apps**: Kanban widget with live drag-and-drop (~3,000-card optimization, 2026-06-04); Timeline widget (2026-02-08); dashboard deep links for tabs (2026-02-08); Button Actions on dashboards; scripting widgets that subscribe to Filter Widget state in real time — explicit convergence toward "interactive applications rather than static reports" (2026-01-05).
- **Mobile push for deskless**: mobile Kanban "for field service teams" (2026-06-04), mobile Document view with AI + autosave (2026-03-08), mobile time tracking (2025-10-29), mobile dashboards/grid widgets (2025), conditional tabs on mobile (2025-10-29).
- **Record-page UX**: Record Page Tabs incl. Process/Journey formats with validation counters (2025-07-17); Conditional Fields (Enterprise+, 2025-10-29); field-level comments (2025-07-17); linked-record inline edit with undo/redo (2026-01-05).
- **Homepage redesign** with solution categories, 4 layout modes, workspace branding (2025-07-17).
- **Governance**: SCIM provisioning (2025-11-26), recycle-bin Solution restore (2026-05-07), "View As" permission validation for admins (~2025-03, **partially verified** — search snippet only).

### Roadmap — Public Canny Portal (fetched 2026-06-11)

- **Planned:** MCP server, white labelling (133 votes), **List View** as a new view type (127 votes), test automation, form display logic.
- **In progress:** Server-Side Script Engine, **"Support Larger Datasets"** (direct response to the large-table performance ceiling), forms creating linked records, prefilled forms.
- **Under review:** Document Designer (118 votes), WhatsApp integration (97 votes), sort-column indicators.
- **Business model:** Free plan sunset — removed for new signups 2026-01-01, existing free workspaces locked 2026-07-01; explicit pivot to mid-market/enterprise (help.smartsuite.com free-plan sunset guide).

### Recurring Complaints

- **Mobile app maturity** — slow, buggy; App Store reviews cite forms losing inputs and stale data requiring app restart (thebusinessdive.com 2026; App Store reviews retrieved 2026-06).
- **No real offline mode** — official docs concede saving after returning from offline "is not guaranteed" (help.smartsuite.com, current).
- **Performance with large tables** — record caps are real (Team 5k/table → Enterprise 125k/table); own docs recommend minimizing formulas in large tables; "Support Larger Datasets" is on the roadmap because of it.
- **Learning curve** (#2 G2 concern theme), **formula limitations** (Dec 2025 added a hard 3-level linked-record depth cap), no native desktop app, **no dark theme**, per-user pricing pressure on small teams.
- Overall sentiment remains strongly positive (Capterra 5.0/5 across 26 reviews) — complaints framed as tradeoffs.

### View, Widget & Field Catalog

- **11 view types**: Grid, Card, Kanban, Calendar, Timeline, Map, Chart, Gantt, Dashboard, Form, + Document (2025-11-26). List View not shipped (roadmap).
- **39 documented dashboard widgets** including view-widgets (Grid/Card/Calendar/Kanban/Gantt/Timeline), Pivot Table, Filter, Record Detail/Selector, metrics, scripting (custom code), banners, countdown, embeds (help.smartsuite.com widget collection, fetched 2026-06-11).
- **47 field types** — notable: Status, Checklist, Time Tracking Log, Signature, Dependency, Sub-items, Vote, Color Picker, Duration, Full Name, Address (help.smartsuite.com, fetched 2026-06-11). Max 700 fields/table.

### Event-Production / Field-Workforce Adjacency

Event/association templates and venue-management positioning content; a clear 2025–26 mobile-for-deskless push. **Lacks**: guaranteed offline save (fatal for venue/field connectivity), scan/credentialing/gate workflows, native shift/crew-call constructs, geofenced time clock, and any dedicated external-party portal shell — external access is shared views/forms/dashboards plus permissions (high-confidence inference from absence across marketing site, template gallery, help center as of 2026-06; flagged, not sourced as a statement).

---

## 3. Odoo

### Recent Releases — UI/UX-Relevant

Cadence: one major release per year at Odoo Experience (autumn) + quarterly minors for Online/odoo.sh (odoo.com/page/release-notes).

- **Odoo 17** (~Nov 2023, date **UNVERIFIED** from primary): major back-office redesign — top-center search merging Filter/Group-by/Favorites, dark mode (effectively Enterprise-only — GitHub issues #146779/#144293 document Community absence), PWA install support, frozen list/kanban headers, human-readable numbers (odoo.com/odoo-17-release-notes).
- **Odoo 18** (Odoo Experience, Oct 2–4 2024): readable hand-editable URLs (`/odoo/project/5/tasks`), Gantt redesign with infinite horizontal scroll, mobile search panel, dedicated PWAs for Barcode/PoS/Attendances/Kiosk/Registration Desk/Shop Floor, passkey login (odoo.com/odoo-18-release-notes).
- **Odoo 19** (Sept 2025): **"AI everywhere"** — Ask AI top-bar button, AI agents that learn from documents and act, chat-with-your-database, Draft with AI, real-time meeting transcription, AI web-page generation, and **natural-language search** ("Ask AI Search" converts plain English into an Odoo domain filter). Performance: client-side caching of browsing data + translations, search controls render before data. Views: drag records between list groups, Gantt undo-on-reschedule + smart zoom. Dashboards: blank-canvas creation, fullscreen charts with type switching, global filters in the search bar. CTRL/middle-click record links finally open in new tabs — a long-standing complaint fixed (odoo.com/odoo-19-release-notes, fetched 2026-06-11).
- **19.1 (Jan 2026)**: offline UI muting; chatter filtering; spreadsheet calendar charts/dynamic pivots (odoo.com/odoo-19-1-release-notes).
- **19.2 (Mar 2026)**: **Field Service app discontinued — merged into Planning** (multi-resource shifts, task-linked shifts); offline search of prior queries; project dashboard replaced by profitability reports (odoo.com/odoo-19-2-release-notes).
- **19.3 (May 2026)**: **full offline CRUD on mobile** (create/edit/archive/delete offline; 2 GB allocation documented); swipe-down opens command palette on mobile; Field Service/Planning live technician map + routing optimization; AI agents create records from uploaded instruction files (odoo.com/odoo-19-3-release-notes; odoo.com/documentation/19.0 offline_mode).

### Roadmap

- Odoo Experience 2025 strategic direction: AI integrated into every core app (not an add-on); AI agents configurable in Studio; scaling toward legacy-ERP territory (read replicas, frontend caching, offline). Partner claims of "10x faster / 10,000+ users" are **partner statements, not official** (muchconsulting.com, 2025-10-01).
- **Odoo 20** expected announcement Sept 2026 / release ~Oct 2026; third-party predictions (agentic AI orchestration, AI forecasting) are **UNVERIFIED as official roadmap** (odooskillz.com, 2026-02-16).
- Observable consolidation trend: Field Service → Planning, Remote Work → Employees (19.2) — Odoo is collapsing overlapping apps into fewer surfaces.

### Recurring Complaints

- **Upgrade pain (dominant)**: customizations break on version upgrades; companies stay on outdated versions for years (Capterra reviews through 2026; ventor.tech analysis).
- **Customization complexity / partner dependence** — budget overruns, technical debt detonating at upgrade time.
- **Steep learning curve**, **support quality** complaints (vague responses, outdated tutorials).
- **Mobile UX** — "extremely cluttered interface even if you're simply generating an invoice from your phone"; store apps suffer blank screens/login loops; Odoo itself now recommends the PWA over the store apps (G2 aggregate; odoo.com/documentation/19.0/administration/mobile).
- **Enterprise vs Community gap** — Studio, dark mode, Gantt/Cohort/Map views, dashboards are Enterprise-gated; Community covers ~80% of function but loses the modern UX layer (partner comparisons; exact per-view matrix **partially verified**).
- UX regressions in fast minors — e.g. official-forum thread calling the 19.2 timesheet-timer revamp "a step back in UX friction" (odoo.com/forum, 2026).

### View & Dashboard Catalog (v19)

Official view types (19.0 developer docs): List, Kanban, Calendar, Pivot, Graph, Gantt, Map, Activity, Cohort, Hierarchy. Gantt/Map/Cohort + dashboard drill-down are Enterprise-edition. Dashboards are **spreadsheet-backed** — a dashboard is a published Odoo Spreadsheet with live data sources, refreshed on open; the spreadsheet engine is converging on Google-Sheets-grade BI (radar/geo/calendar charts, dynamic pivots, regex formulas, named ranges, sheet locking — 18.1→19.3 release notes).

### Event-Production / Field-Workforce Adjacency

The strongest of the three competitors here, by far:

- **Events app**: registration, tiered tickets, custom questions, capacities, badge printing (A4/A6/4-up with custom backgrounds), batch ticket/badge printing, **QR-code tickets**, phone-camera badge-scan check-in, Registration Desk PWA (odoo.com/app/events-features). Oriented at conferences/trade shows — no crew advancing, no per-crew credential lifecycle, no production-logistics surface (gap assessment = analyst inference).
- **Planning** (shift scheduling): drag-and-drop Gantt with edit/resize/split, unassigned-shift lane, templates + recurrence, auto-plan, conflict alerts, rich visual state encoding (stripes = draft, triangles = conflict/modified-after-publish), Time Off sync (odoo.com/documentation/19.0 planning). 19.2 added multi-resource shifts and task-linked shifts — directly relevant to crew-call patterns.
- **Timesheets**: one-click timer, offline timer that syncs on reconnect; UX criticized as clunky; 19.2 revamp seen by some as a regression.
- Pre-merge Field Service criticism: "complex and unintuitive UI," limited offline, weak planned-vs-actual costs (research.com 2025; G2).

---

## 4. Cross-Competitor Synthesis

Patterns that matter for the parity matrix and recommendations:

1. **All three are racing to agentic AI as the primary UX surface** (Super Agents/Brain², AI Field Agents, Ask AI everywhere). Table stakes are shifting from "AI chat panel" to "AI that acts on records with permission awareness."
2. **All three are weak offline.** ClickUp: read-only offline, top-voted open request. SmartSuite: no guaranteed offline save. Odoo: only just shipped offline mobile CRUD (May 2026) and its store apps remain the weakest surface. A genuinely offline-first field experience is shared white space.
3. **None has credentialing/scanning/gate operations** except Odoo's conference-grade badge check-in. None has an external-stakeholder portal shell (persona-scoped, branded) — external access is share links and forms.
4. **Dashboards are converging on interactivity** (SmartSuite filter-driven widget apps; Odoo spreadsheet-BI; ClickUp AI Cards). Static metric cards are no longer competitive.
5. **Universal complaint set**: learning curve, notification noise, performance at scale, mobile lag. Competitors are spending 2026 on polish ("Craft & Quality") — density and complexity are recognized liabilities.
6. **Command-K / natural-language search is table stakes**: Odoo has had CTRL+K palette since ≤v16 and now NL search; ClickUp has universal search across connected apps via Brain MAX.

## Could Not Verify (consolidated)

- ClickUp: 3.0 deprecation exact date; "40% load-time improvement"; "90% of desktop features on mobile"; "Brain powered by Claude Opus"; 11M hosted agents; any 2025/2026 LevelUp event.
- SmartSuite: Stripe/Gusto/Shopify integrations "underway"; June+Sept 2025 release-post contents; TrustRadius themes; direct Reddit threads; the scheduling/credentialing/portal absence is inference-from-omission.
- Odoo: Odoo 17 exact release date; command-palette debut version; "10x faster / 10k users" (partner claim); Odoo 20 feature set (third-party prediction); exact Enterprise-vs-Community view matrix; dark mode being strictly Enterprise-only.
- All Reddit attribution across the three is second-hand (no indexed permalinks surfaced); complaint themes rest on G2/Capterra syntheses and community roundups.
