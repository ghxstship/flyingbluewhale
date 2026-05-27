# Surface Spec #10 — Member subscription + booking

**Shell:** GVTEWAY (member portal — NEW) + ATLVS (subscriptions admin + bookings ops) + COMPVSS (lightweight — "what am I booked on")
**Route:** /p/[slug]/member (NEW — member portal home) + /console/subscriptions (admin) + /console/subscriptions/[id] (admin detail) + /console/bookings (operator hub) + /console/bookings/{calendar,deals,holds,settlements} (existing sub-routes) + /m/bookings (NEW — assignee bookings)
**Status:** Drafted · awaiting review — stop signal per brief
**Theme:** Bermuda Triangle only. GVTEWAY cyan on member portal, ATLVS pink on console, COMPVSS yellow on /m. Accents via `--org-primary`.

## 1. Data class & lifecycle

| Item                              | Value                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conceptual XPMS class             | **0 EXECUTIVE — Finance** for subscriptions (membership-as-recurring-revenue lives in the executive class per ADR-0004). **2 TALENT** for bookings (artist offers + holds + settlements live in the talent class). Two adjacent classes, one consolidated spec because they share a customer (the Party — a member, a talent, a sponsor) and a payment substrate (Stripe). |
| Subscription lifecycle            | **`subscription_state`** — LDP §8 canonical name, shipped as enum at `0019_usnp_canon_local_parity.sql:53`. 8 states: `PROSPECT → TRIAL → ACTIVE → RENEWED → LAPSED → REACTIVATED                                                                                                                                                                                          | CHURNED → ARCHIVED`. Implementation at `subscriptions.state`per`src/lib/subscriptions.ts`. Per LDP audit §8 stale — table ships and is consumed. Transition log: `subscription_state_transitions` (already shipped per src/lib/subscriptions.ts). |
| Subscription kinds                | `SUBSCRIPTION_KINDS = ['MEMBER', 'RETAINER', 'RECURRING_SPONSOR', 'PLATFORM_PLAN']`. Spec scope = MEMBER + RECURRING_SPONSOR primarily; RETAINER + PLATFORM_PLAN are admin-only and don't need a portal surface.                                                                                                                                                           |
| Booking lifecycle (talent_offers) | `talent_offers.status` per `0002_marketplace_canon.sql:364` — `draft / sent / countered / accepted / contracted / declined / cancelled`. 7 states. Distinct lifecycle from subscriptions — bookings are one-shot deals, subscriptions are recurring.                                                                                                                       |
| Booking adjacent tables           | `availability_slots` (holds + open windows), `settlements` (post-show financial close), `event_milestones` (per-event deadlines), `ticketing_connections` (when ticketing integration is live).                                                                                                                                                                            |
| Per-member entitlements           | New table needed: `subscription_entitlements (subscription_id, entitlement_kind, quota, used)`. Drives "you get 4 priority bookings per quarter" type rules. Out of scope for v1 — flagged in §12.                                                                                                                                                                         |
| Payment substrate                 | Stripe Subscriptions (linked via `subscriptions.stripe_subscription_id`) for recurring; Stripe Checkout / Connect for one-shot bookings (via `/api/v1/stripe/checkout`). Stripe webhook receiver already shipped per CLAUDE.md.                                                                                                                                            |
| Authority docs                    | `src/lib/subscriptions.ts` (canonical SDK), `0019_usnp_canon_local_parity.sql:53` (enum), `0002_marketplace_canon.sql:364` (talent_offers), `src/app/(platform)/console/subscriptions/page.tsx`, `src/app/(platform)/console/bookings/page.tsx`, CLAUDE.md "Marketplace (0002)" section.                                                                                   |

**Two lifecycles, one customer.** A Party (e.g. an artist) can have BOTH a `subscriptions` row (they're a paying member of the org's promoter network) AND `talent_offers` rows (they're booked on specific shows). The surface honors both as facets of the same person.

## 2. SaaS parity targets

Per brief: Stripe Billing customer portal, Equinox member app. Specific patterns:

| Product                        | Specific pattern to match or exceed                                                                                                                                                                   | Why it applies                                                                                                                                                  |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stripe Billing Customer Portal | Self-service portal — member sees plan, billing history (invoices), payment method, upgrade/cancel buttons. Email-link entry, hosted by Stripe. Everything reachable in ≤2 clicks from a single page. | Direct fit for the GVTEWAY member portal. We embed/iframe Stripe's hosted customer portal for billing actions (don't reimplement payment management ourselves). |
| Equinox member app             | "Membership home" — your tier, your perks usage (e.g. "3 of 4 priority bookings used this quarter"), upcoming bookings, suggested next bookings, "manage membership" link to plan changes.            | Direct fit for member portal home. Our perks system doesn't ship in v1 but the chrome should anticipate it.                                                     |
| Resy (membership tier)         | "Priority booking" affordance — your tier gets a chip on every booking-eligible row + an earlier booking window. The tier is felt during the booking flow, not buried in settings.                    | Maps to subscription tier as a first-class chip on bookings + a window-rule (subscriptions can unlock holds N days earlier).                                    |
| Pipedrive (recurring revenue)  | "MRR funnel" — operator-side dashboard showing PROSPECT → TRIAL → ACTIVE conversion + churn. Forecast next-quarter MRR.                                                                               | Operator-side at /console/subscriptions. Spec adds the conversion funnel + MRR rollup as the landing visualization.                                             |
| BeatGig (talent booking)       | "Holds calendar" — venue's holds across upcoming dates with conflict resolution + offer status per hold.                                                                                              | Direct fit for /console/bookings/holds (already partly built) + the booking calendar.                                                                           |

**Rejected references:** Patreon (creator-centric, wrong direction). Substack (publication-shaped). Mindbody (gym/wellness-class-bookings, too specific).

## 3. Primary view (per shell)

### 3.1 GVTEWAY member portal at `/p/[slug]/member` — NEW

**This route does not exist today. It is the marquee deliverable of this surface.**

Member portal home, single page, vertical scroll:

1. **Top: Identity + Plan card**
   - Member name + photo + tier chip ("Premium Member · Active since 2024")
   - Subscription state pill (`<StatusBadge state={subscription.state} />`)
   - Next renewal date with countdown ("Renews May 24")
   - Primary action: "Manage Plan" → Stripe hosted portal session
2. **Perks usage strip** (conditional on entitlements landing) — horizontal cards: each perk with usage progress bar ("3 of 4 priority bookings used")
3. **Upcoming bookings** — vertical card list, each booking with date + venue + status pill. Tap → booking detail surface (reuses Surface #4 patterns for the comment thread).
4. **Booking actions** — "Browse Open Bookings" → public booking listings (when ticketing is live). "Request Hold" → opens a hold-request flow.
5. **Billing history** — last 6 invoices, each with date + amount + status. "View all" → Stripe portal.
6. **Account settings** — name, contact, notification preferences (mirrors `/me/notifications` for the portal context).

Mobile-first by design (GVTEWAY portal is mostly accessed on phone). Single-column vertical stack at all viewport widths.

### 3.2 ATLVS admin at `/console/subscriptions` — Subscription Pipeline

**Primary view: Kanban by `subscription_state`** (8 lanes → 3 super-lanes):

| Super-lane   | Member states                | Operator question                          |
| ------------ | ---------------------------- | ------------------------------------------ |
| **PROSPECT** | PROSPECT, TRIAL              | Who's trialing? Who do we need to convert? |
| **REVENUE**  | ACTIVE, RENEWED, REACTIVATED | Who's paying right now? Total MRR?         |
| **RECOVERY** | LAPSED                       | Who lapsed last month? Win-back outreach.  |
| **GONE**     | CHURNED, ARCHIVED            | Default-collapsed.                         |

Card chrome: party name · plan · MRR (mono) · next renewal · `<StatusBadge state />`.

Above the board: **MRR rollup strip** — Total MRR, Trial MRR (potential), Lapsed MRR (recoverable), Churned this month. Pipedrive funnel pattern.

### 3.3 ATLVS admin at `/console/bookings` — Booking Hub

Already shipped as bespoke landing (MetricCard strip + 3 sections per the discovery probe). Spec polishes:

- Add `<DataViewSwitcher>` allowing: deals (board by talent_offers.status) · calendar (booking calendar) · holds (existing) · settlements (existing).
- Filter chip strip: project · talent · status · venue · date window.
- MetricCards stay; become clickable filters.

### 3.4 COMPVSS at `/m/bookings` — NEW (assignee mobile)

For the talent-as-user: "what am I booked on, when, where". Simple vertical card list of their `talent_offers` where status ∈ (accepted, contracted). Each card: date + venue + project + show time + load-in time. Tap → booking detail.

## 4. Secondary views

| View                  | When operator uses it                                                                                                         | Source                                      | Verdict                                                    |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| `table` (subs)        | Bulk: bulk reactivate / archive / re-tier. Group-by kind.                                                                     | subscriptions                               | **Accept**                                                 |
| `funnel` (subs)       | Conversion funnel view — visual count flow PROSPECT → TRIAL → ACTIVE with conversion %. Operator-side.                        | subscription_state_transitions aggregated   | **Accept**                                                 |
| `cohort` (subs)       | Retention cohort — rows = signup month, columns = N months later, cell = % still ACTIVE. Long-term churn analysis.            | subscription_state_transitions cohort query | **Accept (conditional)** — ships when ≥6mo of data exists. |
| `calendar` (bookings) | The booking calendar — already in spec at `/console/bookings/calendar`. Existing route.                                       | talent_offers + availability_slots          | **Accept**                                                 |
| `timeline` (bookings) | Tour timeline — bars per talent showing booking spans across the year.                                                        | talent_offers                               | **Accept**                                                 |
| `board` (bookings)    | Deal kanban by `talent_offers.status` — already implied by /console/bookings/deals.                                           | talent_offers                               | **Accept**                                                 |
| `map`                 | Reject for subs (members aren't geo). Accept for bookings as a tour-routing view (venues plotted) — secondary, low-frequency. | talent_offers joined with venues            | **Accept (low priority)**                                  |

Allowed sets:

- Subscriptions admin: `["board", "table", "funnel", "cohort"]`. Default `board`.
- Bookings admin: `["calendar", "board", "table", "timeline", "map"]`. Default `calendar`.
- Member portal: no view switcher — single canonical layout.
- COMPVSS `/m/bookings`: no view switcher — vertical card list.

Filter chips (subscriptions):

- State (multi)
- Kind (multi — MEMBER / RETAINER / RECURRING_SPONSOR / PLATFORM_PLAN)
- Tier (multi — when tier column lands)
- Renewing within (preset: 7d / 30d / 90d)
- Cohort month
- Stuck (no transition >Nd)

Filter chips (bookings):

- Status (multi)
- Project (typeahead)
- Talent (typeahead)
- Venue (typeahead)
- Date window
- "Hold expiring within Nd"

Saved views:

- Subs: "Renewing 30d" · "Trial Expiring" · "Lapsed Last Month" · "All Active".
- Bookings: "Open Holds Expiring 7d" · "Pending Countersign" · "Settlement Open".

## 5. Lifecycle visualization

| Element                     | Pattern                                                                                                                                          | Visual                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| Subscription state pill     | `<StatusBadge state={sub.state} />`                                                                                                              | Existing.                         |
| Subscription detail stepper | `<PhaseStepper enum="subscription_state" current={…} onAdvance={…} />` — 8-state arc. Generalized.                                               | Existing primitive (generalized). |
| MRR rollup strip            | New `<MrrStrip>` — Total / Trial / Lapsed / Churn$ this month. Live-updating via subscriptions table aggregation.                                | New component.                    |
| Funnel view                 | New `<SubscriptionFunnel>` — visual stack of state buckets with conversion % between adjacent stages.                                            | New component.                    |
| Cohort table                | Triangle table; cells colored green→red by retention %.                                                                                          | New component.                    |
| Booking offer state pill    | `<StatusBadge state={offer.status} />`                                                                                                           | Existing.                         |
| Member portal tier chip     | `<TierChip kind={subscription.kind} tier={…} />` — pink/cyan/yellow per tier (when tier column lands).                                           | New conditional primitive.        |
| Bridge to Surface #6        | When subscription advances to ACTIVE → create `uis_roles` row with `role_class='member'`, `lifecycle_state='active'`. Cross-surface consistency. | Trigger.                          |

## 6. RBAC affordances

Predicates: `canTransitionSubscription`, `canApproveBooking`, `canCancelMembership` added to `policy.ts`.

| Action                                | Owner | Admin | Manager | Member (portal user) | Treatment                                                                                               |
| ------------------------------------- | ----- | ----- | ------- | -------------------- | ------------------------------------------------------------------------------------------------------- |
| View admin subscriptions / bookings   | ✓     | ✓     | ✓       | —                    | Hidden for member (member sees own portal only).                                                        |
| Open admin subscription detail        | ✓     | ✓     | ✓       | —                    | Hidden for member.                                                                                      |
| Create subscription (admin)           | ✓     | ✓     | ✓       | —                    | Shown manager+.                                                                                         |
| Advance subscription state (manual)   | ✓     | ✓     | ✓       | —                    | Shown manager+; some transitions (CHURNED, ARCHIVED) require reason.                                    |
| Cancel subscription                   | ✓     | ✓     | —       | ✓ (own)              | Owner/admin always; member can self-cancel via Stripe portal (CHURNED transition fires via webhook).    |
| Issue refund                          | ✓     | ✓     | —       | —                    | Owner/admin only.                                                                                       |
| Bookings: create offer / send         | ✓     | ✓     | ✓       | —                    | Shown manager+.                                                                                         |
| Bookings: counter / accept / decline  | ✓     | ✓     | ✓       | ✓ (talent on offer)  | Talent counterpart can accept/decline their own offers via the portal.                                  |
| Bookings: settlement actions          | ✓     | ✓     | ✓       | —                    | Shown manager+.                                                                                         |
| Member portal: view own data          | —     | —     | —       | ✓                    | Shown for the member only (RLS).                                                                        |
| Member portal: manage plan via Stripe | —     | —     | —       | ✓                    | Shown (link out to hosted portal).                                                                      |
| Member portal: book hold              | —     | —     | —       | ✓                    | Shown for ACTIVE/RENEWED members; **disabled-with-tooltip** for TRIAL ("Available on full membership"). |

## 7. Empty / loading / error states

| State                                           | Copy                                                                                                                                                                                                | Visual          |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Empty admin — no subscriptions                  | Title: "No Subscriptions Yet" · Body: "A subscription is a recurring relationship — members, retainers, recurring sponsors. Spin up your first to start the MRR clock." · CTA: "+ New Subscription" | `<EmptyState>`. |
| Empty member portal (member has no data)        | "Your membership is being set up. Check back in a moment — or contact your account manager."                                                                                                        | Centered.       |
| Empty bookings                                  | Existing copy preserved.                                                                                                                                                                            | Existing.       |
| Empty perks usage strip                         | (Conditional render — when no entitlements table data exists, the strip doesn't render.)                                                                                                            | n/a.            |
| Empty MRR strip                                 | All-zero metrics still render with muted styling — operator wants to see the zero state.                                                                                                            | Inline.         |
| Stripe portal session creation fails            | Toast: "Couldn't open the billing portal. {error}. Try refreshing — or contact support."                                                                                                            | Sonner.         |
| Disallowed transition (subscription)            | Toast: "{name} can't move from {fromState} to {toState}. Run it through {intermediate}." Snap-back.                                                                                                 | Sonner.         |
| Booking counter without reason                  | Inline dialog error: "Tell the offerer why you're countering."                                                                                                                                      | Inline.         |
| Stripe webhook arrived for unknown subscription | Logged as Sentry event; no UI surface — admin sees nothing (the orphan webhook fires the alerting pipeline, not the portal).                                                                        | n/a.            |

## 8. Bulk actions, filters, saved views, keyboard nav

| Capability   | Spec                                                                                                                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bulk actions | Subscriptions: Bulk advance state (forward adjacent only) · Bulk-tag tier · Bulk-export CSV · Bulk-archive (owner/admin). Bookings: Bulk-send offer · Bulk-decline · Bulk-export forecast.   |
| Filters      | Chip strip per §4. URL-stateful.                                                                                                                                                             |
| Saved views  | Per §4 defaults. Per-user + org-share.                                                                                                                                                       |
| Keyboard nav | ⌘K (admin): subscription by member name or booking by talent name. `g s` jump to /console/subscriptions, `g b` jump to /console/bookings. Member portal: minimal keyboard nav (touch-first). |

## 9. Mobile / narrow viewport behavior

### 9.1 GVTEWAY member portal — mobile-native by design

Already a vertical single-column scroll. No adaptation needed beyond standard mobile chrome.

### 9.2 ATLVS console at narrow

Subscriptions board → super-lane mode. Bookings calendar → 3-day window mobile. MRR strip wraps to 2×2.

### 9.3 COMPVSS `/m/bookings` — NEW

Vertical card list, mobile-native by design. Push: new booking → `PushKind = "booking_received"`. Status changes on own offer → push.

## 10. Surface composition

| Path                                                                    | Change                                                                                                                                                                                                 |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/app/(portal)/p/[slug]/member/page.tsx`                             | **New.** Member portal home per §3.1. Six-section vertical stack.                                                                                                                                      |
| `src/app/(portal)/p/[slug]/member/billing/route.ts`                     | **New.** Server action creating Stripe billing portal session; redirects to hosted URL.                                                                                                                |
| `src/app/(portal)/p/[slug]/member/holds/new/page.tsx`                   | **New.** Request-hold flow for members.                                                                                                                                                                |
| `src/app/(platform)/console/subscriptions/page.tsx`                     | Rewrite: view resolver (`board` default) + MRR strip + filter chips + saved view selector.                                                                                                             |
| `src/app/(platform)/console/subscriptions/SubscriptionBoard.tsx`        | **New.** KanbanBoard by `subscription_state`, super-lane mode.                                                                                                                                         |
| `src/app/(platform)/console/subscriptions/SubscriptionFunnel.tsx`       | **New.** Conversion funnel view.                                                                                                                                                                       |
| `src/app/(platform)/console/subscriptions/SubscriptionCohort.tsx`       | **New.** Retention cohort table.                                                                                                                                                                       |
| `src/app/(platform)/console/subscriptions/[id]/page.tsx`                | **New.** Subscription detail page — `<PhaseStepper enum="subscription_state">` + plan + billing history + Stripe-linked actions + activity (`<LdpStateTimeline>` on `subscription_state_transitions`). |
| `src/app/(platform)/console/bookings/page.tsx`                          | Extend existing landing: add `<DataViewSwitcher>` + filter chip strip; MetricCards become clickable filters.                                                                                           |
| `src/app/(mobile)/m/bookings/page.tsx`                                  | **New.** Assignee mobile booking list.                                                                                                                                                                 |
| `src/components/subscriptions/MrrStrip.tsx`                             | **New.**                                                                                                                                                                                               |
| `src/components/subscriptions/PlanCard.tsx`                             | **New.** Member portal identity + plan card.                                                                                                                                                           |
| `src/components/subscriptions/BillingHistoryList.tsx`                   | **New.** Member portal invoice list.                                                                                                                                                                   |
| `src/components/bookings/BookingCard.tsx`                               | **New.** Reusable card for member portal upcoming-bookings + /m/bookings.                                                                                                                              |
| `src/lib/db/bookings.ts`                                                | Consolidate booking queries (today inline in /console/bookings/page.tsx).                                                                                                                              |
| `src/lib/stripe.ts`                                                     | Add `createBillingPortalSession(orgId, customerId)` per Stripe docs. Used by /p/[slug]/member/billing.                                                                                                 |
| `src/lib/auth/policy.ts`                                                | Add `canTransitionSubscription`, `canApproveBooking`, `canCancelMembership`.                                                                                                                           |
| `src/lib/push/send.ts`                                                  | Add `PushKind = "booking_received"`, `"subscription_renewing"`, `"subscription_lapsed"`.                                                                                                               |
| `src/lib/nav.ts` `portalNav`                                            | Add `member` persona entry mapping to MEMBER → EXECUTIVE class per `classOfPersona()`. Adds the route to the portal sidebar.                                                                           |
| `supabase/migrations/{next}_subscription_tier.sql`                      | **New (optional).** Add `subscriptions.tier text` if tiered membership is in scope.                                                                                                                    |
| `supabase/migrations/{next}_subscription_entitlements.sql`              | **Deferred to v2.** Out of scope for v1 per Resolution §12 #5.                                                                                                                                         |
| `supabase/migrations/{next}_uis_role_member_link.sql`                   | **New.** Trigger: when subscription advances to ACTIVE, create/update `uis_roles` row with `role_class='member'`, `lifecycle_state='active'`. Cross-surface bridge per Surface #6.                     |
| `supabase/migrations/{next}_phase_advance_policy_subscription_kind.sql` | Extension of unified `phase_advance_policy` table (Surface #2 Resolution #7), `phase_kind='subscription'`.                                                                                             |
| `supabase/migrations/{next}_v_mrr_rollup.sql`                           | **New.** Materialized view: per-org MRR breakdown by state. Refreshes on subscriptions UPDATE.                                                                                                         |

## 11. Acceptance

1. **Member can manage their subscription from the portal in ≤2 clicks.** Open /p/[slug]/member → "Manage Plan" → Stripe hosted portal opens. Cancel → Stripe webhook fires → subscription advances to CHURNED → portal reflects within 30s.
2. **Admin sees MRR rollup live.** /console/subscriptions → MRR strip shows Total MRR; advancing one TRIAL to ACTIVE → strip recomputes within 30s.
3. **Funnel conversion rates render in <500ms** for a 5000-subscription org via the materialized view.
4. **Talent receives push on booking offer.** Admin creates `talent_offers` row → talent's /m/bookings shows new card + push notification.
5. **Subscription → engagement bridge fires.** Subscription advances to ACTIVE → `uis_roles` row exists with the expected shape (visible on Surface #6 pipeline board).

## 12. Resolutions — 2026-05-24

1. **Member portal route prefix — `/p/[slug]/member` or `/me/member`?** **`/p/[slug]/member`.** Reasoning: members are org-scoped (member of the Bay Area Promoter Network, not of the platform). `/me` is platform-personal; member context is org-specific. Slug-scoping is consistent with the rest of GVTEWAY.
2. **Stripe Billing — embed customer portal or build our own?** **Embed (link out to hosted portal session).** Reasoning: payment management is PCI-adjacent; Stripe's hosted portal handles every edge case (decline → retry → recovery email). Building our own = months of work with no upside vs Stripe's polished UI. We render the upgrade _intent_ in our chrome; the actual upgrade happens on Stripe's domain.
3. **Subscriptions and bookings — same surface or split?** **Split routes, one consolidator spec.** Subscriptions = `/console/subscriptions`, bookings = `/console/bookings` — they're administered by different teams (finance vs talent buyer). Member portal home consolidates the _member's view_ of both (upcoming bookings + plan info) but admin-side stays split.
4. **MRR strip — admin only, or also visible to member?** **Admin only.** Members don't want to see your MRR. Member portal shows their own plan + price + renewal, not aggregate metrics.
5. **Entitlements (perks usage) — in scope for v1?** **NO.** New table + new admin UI + new push events + new entitlement-consumption write paths = scope creep. v1 ships the chrome (perks-usage strip section), conditional on entitlement table existing — when no entitlement data exists, the strip doesn't render. Phase 2 follow-up adds the table + admin authoring.
6. **Tier system — flat plans or tiered (e.g. Free / Premium / Pro)?** **Tier column added (optional)** — `subscriptions.tier text NULL`. Render tier chip when populated. Some orgs run one-tier; others run multi-tier. Schema doesn't force the issue.
7. **Subscription → Engagement (Surface #6) bridge — automatic or manual?** **Automatic via trigger.** A member's subscription state IS an engagement state for them with the org; making the operator manually mirror it is the worst of both worlds. Trigger keeps `uis_roles` in sync the same way Surface #6 keeps mirror tables in sync (Resolution #2 there).
8. **Hold-request flow from member portal — what's the path?** **Insert a `availability_slots` row of kind='hold' AND a `talent_offers` row in `draft` state**, fan-out to admin for review. Same data model as admin-side hold creation; UI is slimmer.
9. **Push timing for renewal — when?** Three pushes: 30d before renewal (gentle), 7d before (active), 1d before (immediate). Configurable per-org via `subscription_notification_policy` (mirror the `phase_advance_policy` shape). Member can opt out per-kind in /p/[slug]/member account settings.
10. **`/m/bookings` vs existing `/m/ros` — overlap?** **Distinct.** ROS is per-event cue timing (a stage manager perspective). `/m/bookings` is per-booking confirmation (an artist/contractor perspective). The artist on /m/bookings sees their gig dates; opening one navigates to the cue list (ROS) where they're called.

---

**Phase 2 ready. Pass 1 complete.**
