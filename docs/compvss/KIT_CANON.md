# COMPVSS Kit Canon — single source of truth

**The COMPVSS Design System kit is the canonical source for everything COMPVSS in this
repo.** When the kit and the code disagree on *look, IA, interaction, naming, or brand*, the
kit wins; the repo owns *data, auth, i18n, offline, and native packaging* (BUILD.md §0). This
doc is the contract: it states the canon, where it lives in code, what was retired, and how to
keep new work aligned.

> Kit reference: the `COMPVSS Design System.zip` export — `README.md`, `BUILD.md`,
> `app.jsx` / `auth.jsx` / `forms.jsx` / `recorddetail.jsx` / `tools.jsx`, and `tokens/`.
> The rebuilt app (2026-06-21) is the implementation of that kit.

## Brand canon
- **Wordmark:** `COMPVSS` (stylized). Real-word spelling `compass` is used **only** for URLs /
  subdomains / bundle ids — never in user-facing copy. (`compvss.atlvs.pro`, `pro.atlvs.compvss`.)
- **Sub-product:** _Site & Venue Operations_ — deskless-workforce-class field/venue workforce ops
  for internal + external orgs. Audience: Crew · Vendors · Talent.
- **Accent:** signal **yellow `#FFC400`** (v8.0 palette-locked, 2026-06-24 — supersedes the
  retired molten-brass amber `#E9A23B`), applied via `data-product="compvss"`. CTAs = yellow
  fill + **dark ink** (`--p-accent-cta-contrast`; bright accents carry a deepened ink for the
  AA focus ring). Defined once in `src/lib/brand.ts` (`PRODUCT_ACCENTS.compvss`) + the `--p-*`
  token layer. **No hardcoded accent hex outside the token layer.**
- **Credential:** the **COMPVSS Rose** — one enduring credential, issued once and carried for
  life; access changes, the Rose does not. Flip-to-QR with a single-use, refresh-on-open token.

## IA / interaction canon
- **Tab model:** `Home · Calendar · Tasks · Onsite · Assets · Inbox · More` (`mobileTabs` in
  `src/lib/nav.ts`). Seven tabs: the kit's original six plus **Onsite**, the GVTEWAY consumer
  live-event tab (design_handoff §2 — now/next set times, find-my-friends, read-only passes)
  added 2026-06-23. One tab set for every crew member — no persona-routed bars.
- **Canonical list header:** the shared **`ActionBar`** (search + icon-only View / Group / Sort /
  Filter cluster) on every list screen, with the views the kit shows for that screen
  (list / board / table / calendar / gallery).
- **Auth + onboarding:** the kit's own flow (`CompvssOnboarding`) — splash → sign up / in →
  verify (OTP) → profile → join org → permissions → welcome → Rose → first assignment, + forgot
  + account pause/archive. **Not** the web `(auth)` screens.

## Naming canon (enforced)
- **Title Case** for all headers / titles / item names / subtitles.
- **Middot `·`** inside headers/labels — never em/en dash (em dashes are fine in sentence-case
  body prose only).
- **Assets = `Category · Type`** from the XPMS catalog (`Radio · Motorola R7`).

## Where the canon lives in code
| Concern | Location |
|---|---|
| Kit primitives | `src/components/mobile/kit/**` (ActionBar, ViewToggle, SwipeRow, DataTable + Filter/Sort, GroupedList, CommentsBlock, RoseCard/RotatingQR/QR, FormScreen + FORMS, RecordDetail, ToolSheet, KIcon) |
| Auth/onboarding | `src/components/mobile/onboarding/**` |
| Kit CSS | `src/app/theme/kit-mobile.css` + `kit-onboarding.css` (scoped under `.mobile-shell` / `.compvss-onboarding`; imported from `theme/index.css`) |
| Tokens / accent | `src/lib/brand.ts` + `--p-*` token layer (`tokens.json` → `atlvs-product.css`) |
| App routes | `src/app/(mobile)/m/**` (49 routes) |
| Nav SSOT | `src/lib/nav.ts` (`mobileTabs`, `mobileSurfaces`) |
| Host rewrite | `src/proxy.ts` (compvss.* → `/m`) |
| Native | `capacitor.config.ts` (`pro.atlvs.compvss`) |

**Rule:** new COMPVSS UI composes from `src/components/mobile/kit/**`. Do not fork kit
primitives or add ad-hoc COMPVSS components elsewhere — extend the kit (props / responsive CSS).

## Retired surfaces — DO NOT reintroduce
The kit rebuild (2026-06-21) deleted the persona-routed role surfaces and `/m/[role]` routing.
**Removed:** `driver`, `gate`, `medic`, `guard`, `shift`, `ros`, `wms`, `safeguarding`,
`wayfind`, `ad`, `tracker`, `learning`, `kudos`, `polls`, `surveys`, `checkin`, `crew`,
`/m/[role]/*`, `settings/role`, `MobileHomeTabs`, `RoleChooser`. Their function folds into the
kit surfaces:
| Retired | Folds into |
|---|---|
| `/m/medic`, `/m/guard` | `/m/incidents` (+ `/m/incidents/new`) |
| `/m/wms` | `/m/inventory` (+ `/m/inventory/scan`) |
| `/m/ros` | `/m/schedule` |
| `/m/shift`, `/m/shift/swap` | `/m/requests` (swaps), `/m/clock` (punch) |
| `/m/kudos`, `/m/polls` | `/m/feed` |
| `/m/learning` | portal crew learning / console workforce courses (not a field surface) |
| `/m/checkin` (meal credit) | `/m/check-in` (scan) |

Cross-shell links from `console`/`portal` into these were repointed accordingly
(2026-06-21 dead-link sweep).

## Alignment status (audit 2026-06-21)
Wordmark ✓ · color/tokens ✓ · marketing positioning ✓ · proxy/subdomain ✓ · types/nav ✓ ·
no duplicate kit components ✓. The only divergence found — 10 dead `/m/*` console/portal
cross-links from the retired surfaces — was fixed in the same sweep. The proxy still carries the
`/m/[role]` grace-window rewrite (harmless; remove once external links are confirmed gone).

## Open follow-ups
- Other-locale i18n sweep for the `m.*` catalog (en is the source/fallback; other locales fall
  back correctly today).
- Native Capacitor permission prompts (the onboarding permissions step persists intent;
  `TODO(native)` marks where the OS prompts wire in).
- Passkey / Bluesky / Limewire SSO (currently honest "Soon").
- Consider renaming `src/components/mobile/kit` → `src/components/compvss` once the web extension
  lands (see `WEB_APP_STRATEGY.md`) — the kit is the COMPVSS design system, not mobile-only.
