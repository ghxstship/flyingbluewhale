# SITEMAP — Auth

> **GENERATED FILE — do not hand-edit.** Regenerate with
> `npm run gen:sitemap`. This is the per-shell slice of the cross-shell
> SSOT `docs/ia/SITEMAP.md` (same legend: ● nav · ○ linked · ⚠ orphan ·
> · exempt) — derived from `src/app/**/page.tsx` reconciled against
> `src/lib/nav.ts`. Runtime health for every route below is exercised by
> `e2e/sitemap-crawl.spec.ts` (`npm run e2e:crawl` / the `route-health`
> workflow).

**Nav source:** marketing header auth links + token flows
**Routes:** 14 — ● 2 nav · ○ 0 linked · ⚠ 0 orphan · · 12 exempt

## 🔗 Dangling nav hrefs (0)

_None — every Auth nav href resolves to a page._

## Full inventory

<details><summary><code>accept-invite</code> · 1 route</summary>

· `/accept-invite/[token]`

</details>

<details><summary><code>forgot-password</code> · 1 route</summary>

· `/forgot-password`

</details>

<details><summary><code>login</code> · 1 route</summary>

● `/login`

</details>

<details><summary><code>magic-link</code> · 2 routes</summary>

· `/magic-link`
· `/magic-link/[token]`

</details>

<details><summary><code>mfa</code> · 2 routes</summary>

· `/mfa/challenge`
· `/mfa/recovery`

</details>

<details><summary><code>onboarding</code> · 1 route</summary>

· `/onboarding/org`

</details>

<details><summary><code>reset-password</code> · 2 routes</summary>

· `/reset-password`
· `/reset-password/[token]`

</details>

<details><summary><code>signup</code> · 1 route</summary>

● `/signup`

</details>

<details><summary><code>sso</code> · 1 route</summary>

· `/sso/[provider]`

</details>

<details><summary><code>verify-email</code> · 2 routes</summary>

· `/verify-email`
· `/verify-email/[token]`

</details>
