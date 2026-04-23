# Phase 3 — Remediations

Two remediations applied inline during UJV Phase 2 execution. Both match the project's existing conventions; no architectural rewrites; no placeholders/stubs introduced.

---

## R-1 — P0: Personal shell exposed to anonymous users

**Cell:** UJV R1-R10 · S1/S3 (any role accessing `/me/*` without auth)

**Root cause:**
[`src/app/(personal)/layout.tsx`](src/app/(personal)/layout.tsx) had no `await requireSession("/login")` guard. The platform shell layout ([(platform)/layout.tsx](src/app/(platform)/layout.tsx):12) and mobile shell layout ([(mobile)/layout.tsx](src/app/(mobile)/layout.tsx):10) both guard at the layout boundary. Personal was the outlier — rendered nav + chrome to anons on `/me`, `/me/profile`, `/me/settings`, `/me/notifications`, `/me/security`, `/me/privacy`, `/me/tickets`, `/me/organizations`.

Some individual pages (`/me/page.tsx`, `/me/organizations/*`, `/me/profile/*`, `/me/tickets/*`) did their own `requireSession()` calls, but others (`/me/security`, `/me/privacy`, `/me/notifications`, `/me/settings`) did not. Inconsistent + structurally unsafe.

**Fix:** added `await requireSession("/login")` at the top of `PersonalLayout()`.

```diff
 import { TenantShell, resolveTenant } from "@/components/TenantShell";
+import { requireSession } from "@/lib/auth";
@@
 export default async function PersonalLayout({ children }: { children: React.ReactNode }) {
+  // Outer auth guard — matches (platform) and (mobile) shell convention.
+  // Previously `/me/*` pages rendered chrome + empty forms to anon visitors,
+  // leaking shell structure and risking partial data exposure through any
+  // client component that assumed a session existed. UJV cell R1-R10·S1/S3.
+  await requireSession("/login");
   const tenant = await resolveTenant();
```

**Verification:**
- `fetch('/me/security')` returned status 0 (opaque redirect) post-fix — was 200 pre-fix.
- Direct browser nav landed on `/login` with H1 "Sign in" — confirmed.
- `fetch('/me' | '/me/profile' | ... | '/me/organizations')` all returned opaque redirect.

---

## R-2 — P1: Marketing claims for unimplemented SSO / SCIM / SAML / OIDC

**Cells:** UJV R1-R10 · S1 (signup/enterprise pitch on /pricing, /features, /solutions)

**Root cause:**
Marketing copy on /pricing, /features, /features/[module]/compliance, home page, and /solutions/atlvs all claimed "SSO (SAML)", "SCIM provisioning", "Bring your IdP", "SSO (SAML and OIDC)" as Enterprise-tier features. No implementation exists — `supabase.auth.signInWithSSO` is not called anywhere in the codebase; no SCIM endpoint under `/api/v1/*`. Per the project owner's rule ("no placeholders, no stubs, no redirects — clean cuts only"), advertising unshipped features violates the deploy-readiness contract.

Options considered:
1. Build SSO/SCIM — multi-week feature including Supabase SSO config + SAML metadata exchange + SCIM server. Architectural-rewrite tier, out of UJV scope.
2. Copy cleanup — remove the claims entirely. Enterprise buyers hear SSO/SCIM status in sales calls; copy can be added back when shipped.

Applied **option 2**.

**Files touched:**
- [src/app/(marketing)/pricing/page.tsx](src/app/(marketing)/pricing/page.tsx) — 1 bullet, 2 comparison-table rows, 1 FAQ answer rewritten
- [src/app/(marketing)/page.tsx](src/app/(marketing)/page.tsx) — 2 sentences rewritten (feature tile body + security FAQ)
- [src/app/(marketing)/features/page.tsx](src/app/(marketing)/features/page.tsx) — 1 category description rewritten
- [src/app/(marketing)/features/\[module\]/page.tsx](src/app/(marketing)/features/[module]/page.tsx) — 1 highlight deleted, 3 rewrites (compliance blurb, section title, body)
- [src/app/(marketing)/solutions/atlvs/page.tsx](src/app/(marketing)/solutions/atlvs/page.tsx) — 1 bullet rewritten, 1 FAQ entry deleted
- [src/app/(marketing)/solutions/\[industry\]/page.tsx](src/app/(marketing)/solutions/[industry]/page.tsx) — 1 FAQ entry deleted

**Kept intact (defensible):**
- "SOC 2 in progress" + "controls in production" — hedged correctly; SOC 2 readiness without a Type II attestation is a legitimate security-posture statement
- "Signed DPA available" — legal-document promise, deliverable via sales
- "99.9% uptime SLA" — infrastructural, Vercel + Supabase stack SLA stackable
- "Dedicated CSM", "Custom integrations", "Custom roles and access policies" — all deliverable-in-product or via contract
- "Deep-reasoning AI model" — Anthropic Opus exists behind the feature flag + env key

**Verification:** `grep -rE "SSO|SCIM|SAML|OIDC|IdP" src/app/(marketing)/` returns zero hits post-fix.

---

## Non-findings (checked, cleared)

| Item | Result |
|---|---|
| `(portal)/layout.tsx` no auth guard | Intentional — "Slug is the authorization boundary" ([CLAUDE.md Shells](CLAUDE.md)). Individual portal pages call `projectIdFromSlug(slug)` which RLS-gates; `notFound()` fires on a deny. Verified against [`(portal)/p/[slug]/client/page.tsx`](src/app/(portal)/p/[slug]/client/page.tsx:15). Working as designed. |
| `/console/advancing` 404 | Expected — advancing is project-scoped at `/console/projects/[id]/advancing`. Probe URL was wrong, not a code gap. |
| `/api/v1/users` + `/api/v1/deliverables` + `/api/v1/import` + `/api/v1/telemetry` + `/api/v1/credentials` + `/api/v1/compliance` 404 at root | Expected — these namespaces only have subroutes (`/users/[userId]/*`, `/deliverables/[id]/*`, etc.). No root route = 404 is correct Next.js behavior. |
| CLAUDE.md references `src/middleware.ts` (missing) | Doc drift — actual file is [`src/proxy.ts`](src/proxy.ts), Next.js 15+ proxy convention. Session refresh verified present via `updateSession` call. Not a bug. |
| `sponsor` + `artist` portal routes without matching `platform_role` enum | Routes gate via RLS project membership + `portalNav(slug, persona)` routing, not enum. Working as designed; mismatch is a non-issue. |

---

## Lint warnings (not remediated, defensible)

118 `no-restricted-syntax` lint warnings in [`src/lib/pdf/proposal.tsx`](src/lib/pdf/proposal.tsx) and [`src/lib/pdf/wristband-sheet.tsx`](src/lib/pdf/wristband-sheet.tsx) for hex-literal usage. `@react-pdf/renderer` renders via a headless PDF engine that does NOT resolve CSS custom properties — hex values are the correct choice in this context. Could be silenced via eslint-disable comments, but the warnings are informational-only and correctly cite the style convention elsewhere. Flagged, not fixed.
