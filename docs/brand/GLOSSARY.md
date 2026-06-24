# Glossary — ATLVS Technologies

Terms of art across the platform: the production trade vocabulary the floor uses, the four
products, and the ATLVS-specific schema concepts. Author copy with these words — they are
how producers search and how the platform earns trust. Definitions are sourced from
`CLAUDE.md` and the live schema; if this file and `CLAUDE.md` disagree, `CLAUDE.md` wins.

## The brand

- **ATLVS Technologies** — the company; the brand name visitors see in marketing, console
  chrome, and OG cards. The legal/text form is `ATLVS Technologies`.
- **A T L V S** — the visible brand mark, rendered with literal spaces in JSX (matching the
  `G H X S T S H I P` parent treatment). Always carries `aria-label="ATLVS Technologies —
  home"` so screen readers don't spell it letter-by-letter.
- **GHXSTSHIP** — the parent / master brand. The house accent (the default for any
  non-product, ecosystem-marketing surface) is ATLVS volcanic red `#E23414`.
- **flyingbluewhale** — the engineering repo nickname only. Never appears in any URL, email,
  identifier, or copy.
- **apex domain** — `atlvs.pro`. The whole platform lives under it: marketing, auth, `/me`,
  public proposals/offers, and the three app subdomains.

## The products

- **ATLVS** (volcanic red `#E23414`, the `/studio`) — _Experiential Productions: ERP × CRM ×
  PM._ The superset operator console: Sales & CRM plus executive Project / Program / Venue /
  Design / Estimating / Governance / Production / Finance / Procurement / Asset & Logistics
  management.
- **COMPVSS** (signal yellow `#FFC400`, the `/m` field PWA) — _Site & Venue Operations._
  Offline-first deskless-workforce field/venue ops for internal and external orgs.
- **GVTEWAY** (blue `#2563EB`, the `/p` portal + `/marketplace`) — _Public Interface &
  Marketplace._ Every public/engagement surface: tickets, stores, directory, jobs,
  peer-to-peer, RFPs, plus the host & commerce console.
- **LEG3ND** (molten orange `#ED6A1E`, the `/studio/legend/*` surface) — _Knowledge · LMS ·
  Resources_ on the XPMS 2.0 protocol: the knowledge base, courses, certifications, the
  signage library, the XMCE compliance engine, and Safety. Wordmark `L E G 3 N D`, the `3`
  in accent.

## Production trade vocabulary

- **advancing** — in this codebase, the unified per-project, per-individual catalog
  fulfillment lifecycle. Everything assignable from the master catalog to a party — tickets,
  credentials, catering, radios, tools, equipment, uniforms, travel, lodging, vehicles — is
  an `assignments` row. **Never** financial cash advances.
- **run-of-show (ROS)** — the minute-by-minute running order of a show: cues, segments, and
  who calls what, in sequence. Backed by `run_of_shows`.
- **call time** — the time a person is required on site for their role.
- **load-in** — moving gear, scenery, and rigging into a venue and building the show.
- **load-out** — striking the build and clearing the venue after the show.
- **day-of** — the show day itself; the live operational window.
- **settlement** — the post-show financial reconciliation: revenue, costs, splits, and final
  payout. A "9-day settlement" means closing the books nine days after the show.
- **manifest** — the authoritative list of who/what is expected: the ticket manifest, the
  travel manifest, the crew manifest.
- **rider** — the contractual list of an artist's or vendor's technical and hospitality
  requirements. A project-document deliverable, not a per-person assignment.
- **set times** — the scheduled performance windows per act across stages.
- **credential / accreditation** — a physical or digital access pass scoping where a person
  may go (zones) and when. Issued via `assignments` (catalog kind `credential`) with a
  `credential_assignment_details` sibling (access level, expiry, parent badge).
- **gate scan** — scanning a credential or ticket token at an access point. Resolved through
  `assignment_scan_codes` and logged as an `assignment_events` scan row with a result
  (accepted / duplicate / voided / not_found / expired / wrong_zone).
- **deskless** — a workforce that does not work at a desk (crew, stagehands, security,
  drivers). COMPVSS is the deskless field surface; the schema avoids any vendor-specific
  framing.
- **boarding pass / Know-Before-You-Go** — the per-role event guide a participant receives.
  One `event_guides` row per project × persona, rendered role-scoped in the portal and field
  app.

## XPMS & the WBS

- **XPMS** — the Experiential Production Management System, the conceptual protocol (v2.0)
  ATLVS implements. See `docs/XPMS_TO_ATLVS_MAPPING.md` for the conceptual ⇄ implementation
  translation.
- **atom** — the smallest priced/managed unit of work in the XPMS WBS (`xpms_atoms`). An
  assignment may tie to an atom via `assignments.atom_id`.
- **URID** — the unique resource identifier for a catalog atom in the LEG3ND Catalog (priced
  atoms / URIDs).
- **cost center** — one of the 10 XPMS 2.0 departments (0000 Executive … 9000 Technology),
  the canonical budget structure. Never generic `CC-*` placeholders.
- **master catalog item** — an org-scoped reusable inventory SKU (`master_catalog_items`).
  Every `assignments` row references one; free-form one-offs author a catalog row first.

## The eight lifecycles (LDP)

Per the Lifecycle Decomposition Protocol, new schema-bearing columns are named `*_phase`
(sequential macro arc) or `*_state` (cyclical operational). **`status` is banned in new
tables.** The eight canonical lifecycles and their ATLVS column homes:

- **`xpms_phase`** — the project macro arc (on `projects`).
- **`production_phase`** — the fabrication build arc (`fabrication_orders`).
- **`ual_state`** — asset movement (`asset_movements`).
- **`fulfillment_state`** — the shared doc/advance + physical-asset state machine, on both
  `deliverables` and `assignments` (renamed from `deliverable_state` in migration 0061).
- **`uis_lifecycle_state`** — engagement, per Party × Project × channel (`uis_roles`).
- **`letter_state`** — the engagement-document arc on `offer_letters` (DRAFT … COUNTERSIGNED
  / ACTIVE / SUPERSEDED / VOIDED).
- **`accounting_period_state`** — accounting-period open/close (`accounting_periods`).
- **`subscription_state`** — subscription billing (`subscriptions`).

## Platform architecture

- **shell** — one of six route groups; three are full layouts: `(marketing)`, `(auth)`,
  `(personal)`, `(platform)` (`/studio`), `(portal)` (`/p`), `(mobile)` (`/m`).
- **slug authorization boundary** — in the portal, the `/p/[slug]/...` slug is the
  authorization boundary: it scopes which org/project a portal user may see. Always reach
  cross-shell URLs through `urlFor(shell, path)` — never hardcode the apex or concat
  prefixes.
- **persona** — the role a session resolves to (artist, media, delegation, crew, guest,
  vendor, …). Portal routes are `/p/[slug]/<persona>`; the guide auto-scopes to the viewer's
  persona via `mapSessionToGuidePersona()`.
- **per-org pricing** — marketplace economics are org-scoped: `orgs.marketplace_enabled` and
  `orgs.marketplace_take_rate_bps` set the take rate in basis points per org. Default booking
  terms are 60% deposit / 40% balance on load-in.
- **RLS** — row-level security, enforced on every table. Canonical helpers:
  `is_org_member(org_id)` and `has_org_role(org_id, roles[])`.
- **fulfillment_state** — the assignment/deliverable state machine: `briefed → draft →
  submitted → in_review → approved → delivered` (+ `revision_requested`, `rejected`); the
  physical/ticket arc adds `issued → transferred → redeemed`, plus `expired`, `voided`,
  `returned`. Legal transitions live in `NEXT_FULFILLMENT_STATES`.
