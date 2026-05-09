# E2E_BROWSER_VERIFICATION

**Protocol:** E2E-LRP §PRIME DIRECTIVES #3 — "Every assertion is observable in the browser"
**Run:** 2026-05-09 · operator: Claude Opus 4.7 · branch: `claude/naughty-wu-b69201`
**Tooling:** Claude_Preview MCP — `preview_start` (Next.js dev server), `preview_eval`, `preview_snapshot`, `preview_screenshot`, `preview_console_logs`, `preview_network`, `preview_logs`
**Server:** `43759e56-1db1-43b8-9d16-925886547b72` on `http://localhost:3000` (Next.js 16.2.4 Turbopack, ready in 297ms)

> Browser-side verification of every test-fix and every defect surfaced by the harness/static analysis. Required by E2E-LRP because direct DB queries or static greps alone are insufficient — the protocol mandates observable-in-browser proof.

---

## Pre-flight

| Gate                                   | Result                                                               |
| -------------------------------------- | -------------------------------------------------------------------- |
| Worktree node_modules + .env.local     | symlinked from parent repo                                           |
| `.claude/launch.json`                  | already declared `flyingbluewhale-dev` on port 3000                  |
| Existing dev server (PID 29584)        | stopped to free port 3000                                            |
| `preview_start("flyingbluewhale-dev")` | ✅ started; serverId `43759e56...`                                   |
| Cookie consent banner                  | dismissed via `Accept all` button (locator-by-text via preview_eval) |

---

## V-1 — Home CTA confirmed in browser

**Route:** `/`
**Asserts:** post-fix test E2E-D-001 — primary CTA matches `/open the console/i`.

```js
preview_snapshot → element [513] link "Open the Console"
                   element [516] link "Talk to the Studio"
                   element [519] link "Read the Docs →"
```

**Result:** ✅ Hero CTA `Open the Console` rendered + accessible. Test fix matches reality.

---

## V-2 — Pricing tiers confirmed in browser

**Route:** `/pricing`
**Asserts:** post-fix test E2E-D-002 — tier names are `Free / Crew / Production / Festival`.

```js
preview_eval → page text counts:
  Free: 39      Crew: 27       Production: 46     Festival: 16
  Access: 8 (substring "access policies")
  Core: 2  Enterprise: 0  Portal: 30 (product name) Starter: 0
```

**Result:** ✅ All four canonical tiers visible. Old retired names absent (Enterprise=0, Starter=0). Test fix matches reality.

---

## V-3 — Footer headings confirmed in browser

**Route:** `/pricing` (footer is in shared layout)
**Asserts:** post-fix test E2E-D-003 — heading set is `Product / Industries / Resources / Studio / Legal` (NOT `Company`).

```js
preview_eval → footer text contains:
  Product:    true     Industries: true    Resources: true
  Studio:     true     Legal:      true    Company:    false
```

**Result:** ✅ `Studio` heading present, `Company` absent. Test fix matches reality.

---

## V-4 — SSO copy regression visually confirmed (E2E-D-006)

**Route:** `/pricing`
**Asserts:** static-grep finding E2E-D-006 — current code advertises SSO/SAML/OIDC despite UJV R-2's removal.

```js
preview_eval → /pricing page text counts:
  SSO mentions:  10
  SAML mentions: 3
  OIDC mentions: 3
```

**Visual proof:** preview_screenshot captured the comparison table row reading `SSO (SAML / OIDC)` plain-text, sitting under the `SECURITY & COMPLIANCE` header alongside `Immutable audit log`, `Self-expiring file shares`, `SOC-2 attestation pack`, `Custom DPA`, `Data residency`. The DOM walk confirmed:

```
exact_leaf TD: "SSO (SAML / OIDC)" (count=2 — desktop + mobile breakpoints)
```

**Result:** 🔴 **REGRESSION CONFIRMED LIVE.** This is not just static grep — the user-visible /pricing page is advertising SSO/SAML/OIDC as a tier feature in the comparison table. Per memory `feedback_marketing_voice.md` ("Receipts over promises") and per UJV [03_REMEDIATIONS.md §R-2](03_REMEDIATIONS.md), this is brand-claim regression. Won't auto-fix per user-decision policy on brand-sensitive copy.

---

## V-5 — i18n locale cookie defect confirmed in browser (E2E-D-004)

**Route:** `/`
**Asserts:** Spanish locale cookie should flip `<html lang>` to `es`.

```js
// Set cookie + hard reload so SSR re-renders
document.cookie = 'locale=es; path=/; SameSite=Lax';
window.location.href = '/';
// After navigation:
preview_eval → {
  cookies: "...; locale=es",
  lang:    "en",     // ❌ expected: "es"
  dir:     "ltr"
}
```

**Result:** 🔴 **DEFECT CONFIRMED LIVE.** Cookie set + reloaded; SSR did not honor the cookie. The locale-resolution chain in [src/lib/i18n/request.ts:113](../src/lib/i18n/request.ts:113) reads cookie but does not flip the rendered `<html>` attribute. Either the cookie name read in SSR differs (some early-middleware path), or the resolution prefers another source (URL / Accept-Language / DB) that always wins.

---

## V-6 — i18n RTL switch defect confirmed in browser (E2E-D-005)

**Route:** `/`
**Asserts:** Arabic locale cookie should switch `<html dir>` to `rtl`.

```js
document.cookie = 'locale=ar; path=/; SameSite=Lax';
location.reload();
preview_eval → {
  cookie_present: true,
  lang:           "en",     // ❌ expected: "ar"
  dir:            "ltr"     // ❌ expected: "rtl"
}
```

**Result:** 🔴 **DEFECT CONFIRMED LIVE.** Same root cause as V-5.

---

## V-7 — Marketplace public route renders cleanly

**Route:** `/marketplace`
**Asserts:** marketplace canon (0002) public discovery surface working.

```js
preview_eval → {
  url:     "http://localhost:3000/marketplace",
  title:   "Marketplace — Live Production Crew, Talent, RFQs · LYTEHAUS Technologies",
  h1_text: "FIND THE WORK. FIND THE CREW. FIND THE ACT.",
  status:  "rendered"
}
preview_console_logs (level=error) → No console logs.
preview_network (filter=failed) → 1 ABORTED (the navigation away from `/`); zero true failures.
```

**Result:** ✅ Real content, no errors, healthy network.

---

## V-8 — Auth-gated route guards still hold (UJV R-1 verification)

**Routes:** `/me/security`, `/console`, `/p/mmw26-hialeah/guide`, `/api/v1/health`, `/signup`

```js
preview_eval → fetch(..., { redirect: 'manual' }):
  /signup                          → 200 ok (form rendered)
  /me/security                     → 0   opaque redirect (Set-Cookie + 302 to /login; CORS-blocked status read)
  /console                         → 0   opaque redirect (auth-gated)
  /p/mmw26-hialeah/guide           → 200 ok (public KBYG via slug-as-secret)
  /api/v1/health                   → 200 { ok: true, data: { service: "lytehaus-technologies", status: "ok", version: "v1" } }
```

**Result:** ✅ All five guards behave per UJV baseline. UJV R-1 (personal shell `requireSession`) still active. API health endpoint returns the rebranded service identifier `lytehaus-technologies` (confirms LYTEHAUS rebrand successful).

---

## Summary of in-browser proof

| ID  | Verification                                | Browser result                            | Reality             |
| --- | ------------------------------------------- | ----------------------------------------- | ------------------- |
| V-1 | Home CTA `Open the Console`                 | snapshot found link [513]                 | ✅ matches test fix |
| V-2 | Pricing tiers Free/Crew/Production/Festival | counts 39/27/46/16 visible                | ✅ matches test fix |
| V-3 | Footer headings — Studio (not Company)      | `Studio: true, Company: false`            | ✅ matches test fix |
| V-4 | SSO copy regression (E2E-D-006)             | `SSO (SAML / OIDC)` rendered + screenshot | 🔴 confirmed live   |
| V-5 | i18n locale=es ignored (E2E-D-004)          | `lang="en"` despite cookie                | 🔴 confirmed live   |
| V-6 | i18n locale=ar ignored (E2E-D-005)          | `dir="ltr"` despite cookie                | 🔴 confirmed live   |
| V-7 | Marketplace public renders cleanly          | h1 rendered, no console errors            | ✅ healthy          |
| V-8 | Auth gates / API health                     | UJV R-1 holds; service rebrand confirmed  | ✅ healthy          |

**Outcome:**

- 5 ✅ in-browser confirmations supporting the test-fix commits.
- 3 🔴 defects (E2E-D-004, E2E-D-005, E2E-D-006) confirmed live in browser. All deferred for user judgment per `E2E_DEFECT_LOG.md`.
- 0 new regressions discovered during browser walkthrough.

---

## Out of scope for browser verification

- The 5 LDP migration files: schema not applied to any DB; no UI yet exists for `engagement_state`, `production_phase`, `financial_periods`, or `subscriptions`. No browser surface to exercise.
- The 14 composition contract cases (X-1 through X-14): same dependency on schema being applied + new server actions / pages reading the new columns.
- Authenticated flows beyond redirect verification: requires test users in the seed (deferred).
