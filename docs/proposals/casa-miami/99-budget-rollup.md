# Casa Spotify Miami — Cross-Tier Budget Rollup (XPMS v08)

**Producer of Record:** Tigre Sound System × G H X S T S H I P
**Scope:** Year-one sample slate — all four event tiers
**Canon:** XPMS Universal Budget Template v08 · all figures from [budget_model.py](budget_model.py)
**Reconciliation:** every tier's six axis cuts (Department · Phase · Discipline · Tier · XYZ · Line Type) verified to reconcile to its Scope subtotal and Grand Total. Run `python3 budget_model.py` to re-verify.

> This document rolls the four tier instances into one operator-grade financial picture for Spotify LATAM: what a full year of Casa programming costs, where the money sits across the XPMS axes, which vendors and crew repeat (and therefore where rate leverage exists), and how the cashflow lands across the year.

---

## Slate Totals

| Tier    | Event Class                   |        Scope |          Fee | Contingency |   Allowance |      Markup |        Total |
| ------- | ----------------------------- | -----------: | -----------: | ----------: | ----------: | ----------: | -----------: |
| T1      | Small (Silvana-class)         |      $26,350 |      $14,000 |      $2,635 |          $0 |      $4,515 |  **$47,500** |
| T2      | Medium (Rawayana-class)       |      $83,700 |      $22,000 |      $6,696 |      $4,000 |     $11,604 | **$128,000** |
| T3      | Large (Under Argentino-class) |     $155,226 |      $36,000 |     $12,418 |     $10,000 |     $14,356 | **$228,000** |
| T4      | XL (Calle Casa-class)         |     $252,364 |      $58,000 |     $20,189 |     $20,000 |     $34,447 | **$385,000** |
| **All** | **Slate**                     | **$517,640** | **$130,000** | **$41,938** | **$34,000** | **$64,922** | **$788,500** |

**Reading the columns.** Scope is real work (the only thing the phase curve sums). Fee is the producer's compensation, collected on the draw schedule. Contingency is the in-scope variance reserve (~8% of Scope; T1 carries 10% as a small-event buffer). Allowance is named placeholders for not-yet-specified scope (grows with tier ambiguity — $0 at T1, $20K at the open-brief T4). Markup is pass-through margin on third-party rentals/services.

---

## By Department — Across All Tiers (Scope)

| Department      |          T1 |          T2 |           T3 |           T4 |        Total | % of Slate Scope |
| --------------- | ----------: | ----------: | -----------: | -----------: | -----------: | ---------------: |
| Executive       |        $850 |      $2,400 |       $5,000 |       $9,000 |  **$17,250** |             3.3% |
| Creative        |      $4,500 |      $9,000 |      $17,000 |      $28,000 |  **$58,500** |            11.3% |
| Talent          |      $1,800 |      $6,500 |      $14,000 |      $26,000 |  **$48,300** |             9.3% |
| Marketing       |          $0 |          $0 |           $0 |           $0 |       **$0** |             0.0% |
| Build           |      $6,800 |     $13,930 |      $29,060 |      $46,360 |  **$96,150** |            18.6% |
| Production      |      $4,200 |     $18,680 |      $36,410 |      $55,600 | **$114,890** |            22.2% |
| Operations      |      $3,600 |     $10,590 |      $21,756 |      $36,404 |  **$72,350** |            14.0% |
| Experience      |      $3,200 |      $9,000 |      $16,000 |      $26,000 |  **$54,200** |            10.5% |
| Hospitality     |      $1,400 |     $11,600 |      $12,000 |      $17,000 |  **$42,000** |             8.1% |
| Technology      |          $0 |      $2,000 |       $4,000 |       $8,000 |  **$14,000** |             2.7% |
| **Total Scope** | **$26,350** | **$83,700** | **$155,226** | **$252,364** | **$517,640** |             100% |

**Operator read.** Production (22%) + Build (19%) = 41% of all scope — the technical/physical envelope is where Casa programming money concentrates, and where house infrastructure (capex) most reduces per-event cost. Marketing is $0 across the board by design: Spotify owns audience + media; Tigre × GHXSTSHIP delivers rooms and capture, not campaigns.

---

## By Phase — Across All Tiers (Scope)

| Phase           |          T1 |          T2 |           T3 |           T4 |        Total | % of Slate Scope |
| --------------- | ----------: | ----------: | -----------: | -----------: | -----------: | ---------------: |
| Discovery       |          $0 |          $0 |           $0 |       $1,800 |   **$1,800** |             0.3% |
| Design          |      $4,500 |      $9,000 |      $17,000 |      $28,000 |  **$58,500** |            11.3% |
| Advance         |      $2,050 |      $7,400 |      $13,800 |      $23,600 |  **$46,850** |             9.1% |
| Procurement     |      $1,700 |     $19,050 |      $34,100 |      $51,000 | **$105,850** |            20.4% |
| Build           |      $5,300 |     $10,400 |      $22,400 |      $43,000 |  **$81,100** |            15.7% |
| Install         |      $5,200 |     $11,395 |      $19,950 |      $28,350 |  **$64,895** |            12.5% |
| Operate         |      $7,405 |     $25,065 |      $45,920 |      $73,694 | **$152,084** |            29.4% |
| Close           |        $195 |      $1,390 |       $2,056 |       $2,920 |   **$6,561** |             1.3% |
| **Total Scope** | **$26,350** | **$83,700** | **$155,226** | **$252,364** | **$517,640** |             100% |

**Operator read.** Operate (29%) + Procurement (20%) dominate — show-day labor/FX and committed long-lead rentals are the two biggest exposure points. **Procurement is the committed-cost gate**: once those POs/deposits clear (Phase 4), ~20% of scope is locked and non-cancellable, which is exactly why XPMS isolates it as its own phase. Discovery is non-zero only at T4, where the community-partner MOU is genuine pre-design spend.

---

## By Discipline — Across All Tiers (Scope)

| Discipline          |          T1 |          T2 |           T3 |           T4 |        Total | % of Slate Scope |
| ------------------- | ----------: | ----------: | -----------: | -----------: | -----------: | ---------------: |
| Live Entertainment  |      $4,890 |     $25,080 |      $46,910 |      $74,500 | **$151,380** |            29.2% |
| Experiential        |      $3,030 |      $9,100 |      $19,600 |      $35,600 |  **$67,330** |            13.0% |
| Fabrication         |      $6,800 |     $13,930 |      $29,060 |      $46,360 |  **$96,150** |            18.6% |
| Construction        |          $0 |          $0 |           $0 |           $0 |       **$0** |             0.0% |
| Interior Design     |      $3,170 |      $5,200 |       $7,700 |      $11,400 |  **$27,470** |             5.3% |
| Procurement         |      $1,395 |      $3,590 |       $6,256 |       $9,720 |  **$20,961** |             4.0% |
| Broadcast & Content |      $1,410 |      $3,300 |       $8,500 |      $14,800 |  **$28,010** |             5.4% |
| Corporate & Brand   |      $1,450 |      $3,400 |       $6,900 |      $11,100 |  **$22,850** |             4.4% |
| Hospitality & F&B   |      $2,000 |     $13,100 |      $14,800 |      $22,200 |  **$52,100** |            10.1% |
| Festival & Touring  |      $2,205 |      $7,000 |      $15,500 |      $26,684 |  **$51,389** |             9.9% |
| **Total Scope**     | **$26,350** | **$83,700** | **$155,226** | **$252,364** | **$517,640** |             100% |

**Operator read.** Construction is $0 across the slate — the Casa is plug-and-play (per the brief's MiMo/Sanctuary plan), so all physical work is Fabrication (scenic/temporary), never Construction (permanent/structural). That single fact is the strongest argument for the proposed venue: every event dollar goes to the experience, not the building.

---

## Cashflow — If Spotify Runs the Full Slate in One Year

Using the live-event 60/40 draw on each event, billed to event dates spread across the year:

| Event                      | Deposit (60%) on Execution | Balance (40%) 5 biz days pre-load-in |
| -------------------------- | -------------------------: | -----------------------------------: |
| Silvana Estrada (Oct)      |                    $28,500 |                              $19,000 |
| Rawayana (Nov)             |                    $76,800 |                              $51,200 |
| Under Argentino (Sep)      |                   $136,800 |                              $91,200 |
| Calle Casa (Dec, Art Week) |                   $231,000 |                             $154,000 |
| **Slate**                  |               **$473,100** |                         **$315,400** |

**Total annual program: $788,500.** Deposits ($473,100) fund procurement + talent advance + shop labor ahead of each spend curve; balances ($315,400) clear before each load-in. No two balances collide if events are spaced (the proposed Sep / Oct / Nov / Dec cadence spreads them cleanly).

---

## Repeating Vendors & Crew — Where Rate Leverage Lives

The same vendors and key crew recur across tiers. Booking the slate (not one-off events) is the lever for volume rates — a real argument for Casa as an always-on program rather than ad-hoc rentals (per the brief's stated goal of replacing costly ad-hoc venue rentals).

| Resource                           | T1  | T2  | T3  | T4  | Leverage                                 |
| ---------------------------------- | :-: | :-: | :-: | :-: | ---------------------------------------- |
| Tigre Shop (scenic/build)          |  ●  |  ●  |  ●  |  ●  | In-house — margin retained, not paid out |
| Off Duty Officers Miami (security) |  ●  |  ●  |  ●  |  ●  | Annual MSA → preferred rate              |
| Star Medical (BLS)                 |  ●  |  ●  |  ●  |  ●  | Annual standby contract                  |
| Casa Bacchus Bars                  |  ●  |  ●  |  ●  |  ●  | Volume bar program                       |
| Studio Sólido (capture)            |  ●  |  ●  |  ●  |  ●  | Slate content-capture retainer           |
| 4Wall / PRG (lighting)             |  ○  |  ●  |  ●  |  ●  | Frame rental agreement                   |
| EVS / Sound Image (audio)          |  ●  |  ●  |  ●  |  ●  | Frame rental agreement                   |
| Niche Event Rentals (furniture)    |  ●  |  ●  |  ●  |  ●  | Standing account                         |
| Andrea Roldán (Producer)           |  ●  |  ●  |  ●  |  ●  | Consistent show caller across slate      |

● engaged · ○ backup/optional. **Recommendation:** convert the four recurring core vendors (security, medical, bar, capture) to annual MSAs after the first event clears — typical 8–15% rate improvement on the back three events, dropping straight into Markup or back to Spotify as savings.

---

## How the Numbers Were Derived (Auditability)

Every figure in this package is computed by [budget_model.py](budget_model.py), which holds each line item tagged across all six v08 axes and asserts:

1. Each rollup cut (Department, Phase, Discipline, Tier, XYZ) sums exactly to that tier's Scope subtotal.
2. Scope + Fee + Contingency + Allowance + Markup equals the tier's Grand Total.
3. No line is double-classified (Scope rows are Scope-only; reserves are additive).

```
python3 budget_model.py          # prints verification + per-department breakdown
python3 budget_model.py --emit   # regenerates the _fragments/*.md budget blocks
```

If a number changes, change it in the model and re-emit — never hand-edit a budget table in a tier doc. This is the same discipline as the v08 template's formula-driven Summary sheet: the line items are the source of truth; the rollups are derived.

---

## Tier Selector — Quick Reference for Spotify

| If the moment is…                             | Tier                               |    Budget |  Cap | Signature move                    |
| --------------------------------------------- | ---------------------------------- | --------: | ---: | --------------------------------- |
| One artist, one room, deep connection         | [T1](01-tier-1-small-template.md)  |     <$50K |   80 | The room goes silent and listens  |
| A tour stop's after — top fans, late night    | [T2](02-tier-2-medium-template.md) |  $50–150K |  200 | The after that beats the show     |
| A scene's first U.S. landing, campaign launch | [T3](03-tier-3-large-template.md)  | $150–250K |  300 | Three acts, one cultural argument |
| The city takes the Casa over                  | [T4](04-tier-4-xl-template.md)     |    $250K+ | 350+ | Spotify hands over the keys       |

> _From Discovery to Close. Four tiers, one house, one budget language._
