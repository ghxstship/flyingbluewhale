# GVTEWAY (portal) — Connecteam-parity audit

Date: 2026-05-11
Scope: `src/app/(portal)/p/[slug]/<persona>/*` — 18 personas, 91 pages.
Source: Connecteam taxonomy as applied to COMPVSS (`docs/runbooks/connecteam-ops.md`).

## Audience translation

Connecteam targets internal deskless workforce. GVTEWAY targets EXTERNAL
counterparts of an internal org — delegates, vendors, sponsors, guests,
press, talent agents. Not every Connecteam feature maps; some
internal-workforce primitives (kudos, badges, time-clock geofence) have
no portal-side analogue.

## Persona × Concern grid

✓ present · ◐ partial · ✗ absent · — n/a

| Persona     |          Updates feed          |    Chat    |    Surveys    |   Doc vault   | Notifs | Directory |     Tasks      |   Avail    | Training |
| ----------- | :----------------------------: | :--------: | :-----------: | :-----------: | :----: | :-------: | :------------: | :--------: | :------: |
| artist      |               ✗                |     ✗      |       ✗       |   ◐ riders    |   ✗    |     ✗     |  ◐ advancing   |     ✗      |    ✗     |
| athlete     |               ✗                |     ✗      |       ✗       |       ✗       |   ✗    |     ✗     |   ✓ requests   |     ✗      |    ✓     |
| client      |               ✗                | ✓ messages |       ✗       |    ✓ files    |   ✗    |     ✗     | ✓ deliverables |     —      |    ✗     |
| crew        |               ✗                |     ✗      |       ✗       |       ✗       |   ✗    |     ✗     |  ✓ call-sheet  |     ✗      |    ✗     |
| delegation  |               ✗                |     ✗      |       ✗       |       ✗       |   ✗    |     ✗     |    ✓ cases     | ◐ ratecard |    ✗     |
| guest       |               ✗                |     ✗      |       ✗       |       ✗       |   ✗    |     ✗     |   ✓ tickets    |     —      |    —     |
| hospitality |               ✗                |     ✗      |       ✗       |       ✗       |   ✗    |     ✗     |  ✓ itinerary   |     —      |    —     |
| media       |               ✗                |     ✗      |       ✗       |       ✗       |   ✗    |     ✗     |  ◐ pressconf   |     —      |    —     |
| sponsor     |               ✗                |     ✗      |       ✗       |   ✓ assets    |   ✗    |     ✗     | ✓ activations  |     —      |    —     |
| stakeholder |               ✗                |     ✗      |       ✗       |       ✗       |   ✗    |     ✗     |       ✗        |     —      |    —     |
| vendor      |               ✗                |     ✗      |       ✗       | ✓ submissions |   ✗    |     ✗     |     ✓ POs      |  ✓ avail   |    ✓     |
| vip         |               ✗                |     ✗      |       ✗       |       ✗       |   ✗    |     ✗     |  ✓ itinerary   |     —      |    —     |
| volunteer   |               ✗                |     ✗      | ◐ application |       ✗       |   ✗    |     ✗     |   ✓ schedule   |     ✗      |    ✓     |
| producer    |               ✗                |     ✗      |       ✗       |       ✗       |   ✗    |     ✗     |       ✗        |     ✗      |    ✗     |
| promoter    |               ✗                |     ✗      |       ✗       |       ✗       |   ✗    |     ✗     |       ✗        |     —      |    —     |
| guide       | ✓ shared boarding-pass content |     —      |       —       |       —       |   —    |     —     |       —        |     —      |    —     |
| overview    |       ✓ project overview       |     —      |       —       |       —       |   —    |     —     |       —        |     —      |    —     |
| apply       |           — (intake)           |     —      |       —       |       —       |   —    |     —     |       —        |     —      |    —     |

## Top observations

- Every persona has _some_ persona-specific content (advancing, itinerary,
  POs, etc.) but the **org-broadcast surfaces** present in COMPVSS
  (announcements feed, notifications inbox) have **zero adoption** in
  the portal.
- Only `client/messages` has a chat surface. Vendor and sponsor would
  benefit from an org-rep DM thread.
- Document vault exists where it must (vendor submissions, sponsor
  assets, client files) but is **inconsistent** — artist riders, media
  credentials, delegation visa docs lack a unified vault view.
- Tasks exist as persona-specific surfaces (deliverables, POs,
  activations) — no unified "what do I owe" inbox.
- Producer / Promoter / Stakeholder personas are essentially empty.

## Recommended actions (ordered by impact)

1. **`/p/[slug]/<persona>/updates`** — portal-wide announcements feed
   reusing the `announcements` schema. Each portal recipient sees
   broadcasts where audience matches their persona/role. Net new code:
   ~80 LOC of server component reading `announcements` filtered by a
   new `portal_audience` column (one-line schema addition). Highest
   impact because right now there's no way for ops to push a "load-in
   moved 30 min earlier" notice through the portal.

2. **`/p/[slug]/<persona>/inbox`** — unified notifications surface per
   persona, reading `public.notifications` filtered to the caller. Net
   new code: ~50 LOC. The notifications table already exists; the
   portal just doesn't surface it.

3. **Vendor / Sponsor DM with org rep** — extend the chat schema
   (`chat_rooms` already supports `room_kind='direct'`) to mount a
   1:1 thread between the portal user and their primary account-manager
   on the org side. Net new code: ~120 LOC + an "AM relationship" link
   table or reuse of `project_members.role='collaborator'`.

4. **Producer / Promoter / Stakeholder persona buildout** — these three
   pages currently render a near-empty index. Identify what each
   persona actually needs to do (likely: see contract status, approve
   payouts, review final settlement). Out of session scope — needs
   product-side roadmap input.

5. **Unified document vault widget** — extract the existing vendor /
   sponsor / client doc surfaces into a shared `<PortalDocVault>`
   primitive that any persona index page can mount. Cuts duplication
   and gives artist/media/delegation a docs surface without bespoke
   work each time.

Stub remaining: `crew/advances` — addressed in this session as a
per-individual production-advancing view. "Advancing" means the full
catalog assignable to a person — credentials, catering, radios, tools,
equipment, uniforms, travel, lodging, vehicles, plus rider/spec
deliverables when they're owned by an individual. Shared
`deliverables` table + `deliverable_state` lifecycle (advancing →
fulfillment → tracking) gated by the new `assignee_id` column from
migration 0049. One source of truth, three platforms. Never financial
cash advances.

## Out of scope (not Connecteam analogues for the portal)

- Kudos / recognition — internal-team primitive; doesn't translate.
- Badges — same reasoning.
- Time-clock geofence — vendors don't punch in through GVTEWAY.
- Polls — could ship if there's a use case (e.g. sponsor preference
  poll on activation locations), but no immediate ask.
- Onboarding flows — partly covered by per-persona content already;
  could formalize into a new-hire-style stepper later.
