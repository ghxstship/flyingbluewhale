# Pricing recommendation — ATLVS ecosystem (for consideration)

Status: **RECOMMENDATION — no pricing code changed** · 2026-07-22
Grounding: the live tier table (Free $0 / Crew $49 / Production $199 / Festival
custom, per org), the 10-competitor workforce comparison research (all
per-user or per-user-band pricing), the ratified COMPVSS-first GTM, and the
owner's app ownership canon (LEG3ND 0000 · ATLVS 1000-3000 · COMPVSS
4000-6000 · GVTEWAY 7000-9000).

---

## 0 · The one inconsistency to resolve first

The rebuilt marketing surface (home FAQ, /compvss, comparison pages, llms.txt)
now says **"per-organization pricing, unlimited users"** and hammers "crew are
never seats" as the wedge against every per-seat competitor. The live tier
table caps Free at 3 users and Crew at 10. Either the copy weakens or the
structure honors the promise. **This recommendation resolves it structurally:
people are never the meter, on any tier. Projects and volume are.**

## 1 · Principles

1. **Per-org stays.** It is the single sharpest wedge in the category: every
   workforce competitor bills per user, so a 400-crew load-in week repriced
   them and doesn't reprice us. The comparison pages already argue this.
2. **Meter the production, not the people.** Gate tiers on active projects,
   portal credentials, and capability depth. Surge headcount is the moment we
   look best; never bill it.
3. **LEG3ND is never a paywall.** The hub (0000 Executive: org setup, brand,
   codes, positions, locations, knowledge) ships with every tier including
   Free. It is the on-ramp that creates correctly-configured orgs; taxing it
   throttles the funnel.
4. **Apps arrive as bundle value, not SKU sprawl.** One org subscription; new
   apps raise the value of existing tiers at GA (with one Console add-on and
   one Ecosystem bundle, below) rather than fragmenting into per-app bills.
5. **GVTEWAY monetizes flow, not seats.** Ticketing/marketplace takes a
   transaction share (`marketplace_take_rate_bps` already exists in schema);
   its buyer/guest surfaces stay free to enter.
6. **Fair by design:** seasonal pause, honest overage-as-upgrade-nudge (never
   surprise bills), nonprofit/education discount, annual = 2 months free.

## 2 · Recommended tier table (COMPVSS era, effective now)

| | **Free** | **Crew** $59/org/mo | **Production** $249/org/mo | **Festival** custom (floor ~$1,000/mo annual) |
|---|---|---|---|---|
| People | **Unlimited members** | **Unlimited** | **Unlimited** | **Unlimited** |
| Active projects | 1 | 3 | Unlimited | Unlimited |
| Portal credentials / project | 100 | 2,000 | 10,000 | Custom |
| LEG3ND hub (brand, codes, positions, locations, catalogs, templates, knowledge, academy) | ✅ full | ✅ full | ✅ full | ✅ + white-label |
| COMPVSS field ops (shifts, clock, incidents, punch, custody, gate scan) | ✅ | ✅ | ✅ | ✅ |
| Finance capture (expenses, mileage, timesheets) | ✅ | + invoicing, budgets, POs | + procurement, Stripe Connect payouts | + multi-entity |
| Advancing | Read | 16 deliverable types | Full packets + merge engine | Full |
| AI assistant | — | Fair-use | Fair-use, higher cap | Custom |
| Proposals + e-sign, KBYG guides | — | — | ✅ | ✅ |
| Multi-org, SSO, custom roles, SOC-2 pack, DPA, SLA, CSM | — | — | — | ✅ |
| Support | Community | Email | Priority + onboarding | Dedicated CSM |

Changes vs today: Free 3-users → **1 project, unlimited people** · Crew
$49→$59 with 10-users → **3 projects, unlimited people** · Production
$199→$249 (absorbs AI + unlimited already promised) · Festival gains a stated
floor so sales conversations anchor.

**Why these numbers clear the market and the margin:**
- A 15-person crew on the cheapest per-user competitor runs ~$38-90/mo and
  climbs linearly; Crew at $59 is flat and wins from ~12 people up, while a
  5-person shop paying $59 vs ~$15-25 per-seat is buying the production record
  (incidents, punch, custody, gate), which no per-seat scheduler carries.
- A 40-crew mid-size org runs ~$180-360/mo per-seat before overtime modules;
  Production at $249 is flat, unlimited, and includes finance + AI.
- Per-seat production suites (rental/booking class) commonly land $39-50 per
  power user: 10 office users ≈ $400-500/mo. Production undercuts while the
  field tier is included, not an add-on.
- COGS discipline: the meters that actually track cost (credentials issued,
  AI fair-use, storage) scale with tier price; unlimited PEOPLE is cheap
  (RLS rows), unlimited CREDENTIALS is not — hence the per-project credential
  ladder.

## 3 · When ATLVS and GVTEWAY reach GA

| Motion | Price | Rationale |
|---|---|---|
| **Console add-on** (ATLVS: 1000-3000 workflows — creative, talent, marketing + full ERP/CRM/PM) | +$200/org/mo on Crew or Production | One add-on, not per-module SKUs; below the cost of one office hire's per-seat stack |
| **Ecosystem bundle** (all four apps, everything unlocked below Festival) | $399/org/mo (intro $349 for waitlist members) | Bundle > sum-of-parts psychology; the waitlists built this cycle get the honest early price |
| **GVTEWAY commerce** (7000-9000: ticketing, marketplace, hospitality flows) | No subscription for organizers below Festival; **2.5% + $0.79 per paid ticket/order** platform fee, take-rate configurable per org for Festival deals | Undercuts mainstream ticketing fee stacks; schema already carries per-org take-rate; keeps guest surfaces free |
| **LEG3ND certifications at scale** (institutions) | Stays included per-org; Festival adds bulk issuance + verification API | The `for-institutions` surface exists; monetize institutional volume, never individual learners |

## 4 · Use-case fit

| Use case | Tier | Monthly | The math that sells it |
|---|---|---|---|
| Solo op / side project | Free | $0 | Full hub + field app, 1 project. No credit card |
| 8-25 person crew company | Crew | $59 | Per-seat rivals cross $59 at ~12 heads and keep climbing |
| Production co, 30-80 crew, multiple shows | Production | $249 | Flat through surge weeks; finance + AI included |
| Venue/arena, many events, house + show crews | Production | $249 | Unlimited projects = unlimited event records |
| Festival / OCOG / touring at scale | Festival | Custom ≥ ~$1,000 | Multi-org, SSO, SLA, white-label, custom credential volume |
| Agency running client orgs | Festival (multi-org) | Custom | Per-client sub-orgs under one commercial frame |
| University / nonprofit | Any paid | −30% | Standing discount; education industry page feeds this |

## 5 · Fairness mechanics (retention > extraction)

- **Seasonal pause**: any paid org can pause to $19/mo (data + read access
  retained, no writes). Productions are seasonal; punishing the off-season
  churns exactly the orgs that would return.
- **Overage = nudge**: crossing a credential/project cap prompts an upgrade
  with a 14-day grace window. Never a surprise invoice line.
- **Annual**: 10 months' price (2 free). **Waitlist honesty**: ATLVS/GVTEWAY
  waitlist members get the intro Ecosystem price for their first year.
- **Grandfathering**: existing Crew ($49) and Production ($199) orgs keep
  their price for 12 months post-change, announced plainly.

## 6 · What this needs before implementation

1. Owner sign-off on the numbers (this doc is a recommendation only).
2. Copy/table update in the pricing catalog + tier gates in entitlements
   (user caps removed, project/credential meters added where enforced).
3. The comparison pages' pricing rows stay honest automatically (they assert
   only "per organization, unlimited users" — which this structure makes true
   on every tier).
