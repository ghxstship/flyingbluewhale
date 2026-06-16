# Marketing / Auth / Personal page inventory

Inventory of every `page.tsx` under `src/app/(marketing)/`, `src/app/(auth)/`, `src/app/(personal)/`, and the root-level (non-route-group) pages directly under `src/app/`. One bullet per distinct route; `[slug]`/`[id]`/`[handle]`/`[token]` children collapsed under their parent where natural. i18n: the marketing shell is locale-aware via `getRequestT()` + `hreflang` alternates; full localized home variants exist at `/es-ES` and `/pt-BR`.

# Marketing (public)

- `/` — Home: ATLVS ecosystem (ATLVS · COMPVSS · GVTEWAY · LEG3ND) overview, industries, XPMS phases, FAQ, CTAs. i18n via `getRequestT`, hreflang to `/es-ES` + `/pt-BR`. **CRUD/interactive:** read-only (CTA links only).
- `/es-ES` — Spanish localized marketing home variant. **CRUD/interactive:** read-only.
- `/pt-BR` — Brazilian-Portuguese localized marketing home variant. **CRUD/interactive:** read-only.
- `/about` — Company / about page. Static, pre-rendered. **CRUD/interactive:** read-only.
- `/ai` — AI capabilities landing; lists AI use-cases linking to `/ai/[slug]`. **CRUD/interactive:** read-only.
- `/ai/[slug]` — Individual AI use-case detail page. **CRUD/interactive:** read-only.
- `/alternatives` — "Alternatives to X" index. **CRUD/interactive:** read-only.
- `/alternatives/[competitor]` — Long-form narrative alternatives page per competitor. **CRUD/interactive:** read-only.
- `/blog` — Blog index (ISR, 5-min revalidate). **CRUD/interactive:** read-only.
- `/blog/[slug]` — Blog post detail (ISR). **CRUD/interactive:** read-only.
- `/brand-kit` — Brand kit landing hub. **CRUD/interactive:** read-only.
- `/brand-kit/foundations` — Brand foundations reference (color, type, tokens). **CRUD/interactive:** read-only.
- `/brand-kit/logo-kit` — Logo/wordmark reference + downloads. **CRUD/interactive:** read-only (download links).
- `/careers` — Careers / open-roles page. Static. **CRUD/interactive:** read-only.
- `/changelog` — Product changelog. Static. **CRUD/interactive:** read-only.
- `/community` — Community hub index. **CRUD/interactive:** read-only.
- `/community/[slug]` — Community resource/post detail. **CRUD/interactive:** read-only.
- `/compare` — Competitor comparison index (ISR). **CRUD/interactive:** read-only.
- `/compare/[competitor]` — Side-by-side comparison vs a named competitor (ISR). **CRUD/interactive:** read-only.
- `/contact` — Contact / sales page. **CRUD/interactive:** contact form (name/email/company/scale `<select>`) — plain `method="post" action="mailto:sales@atlvs.pro"` (no server action); plus `mailto:` links.
- `/customers` — Customer / case-study index, filterable by industry label. **CRUD/interactive:** read-only.
- `/customers/[slug]` — Case-study detail (reads from DB). **CRUD/interactive:** read-only.
- `/demo` — Demo landing; lists demo personas (`DEMO_PERSONAS`) + booking CTA. **CRUD/interactive:** read-only (CTA links).
- `/demo/[persona]` — Persona-scoped demo page (static-generated per persona). **CRUD/interactive:** read-only.
- `/docs` — Documentation landing. Static. **CRUD/interactive:** read-only.
- `/features` — Features index (ISR). **CRUD/interactive:** read-only.
- `/features/[module]` — Per-module feature page. **CRUD/interactive:** read-only.
- `/features/[module]/[industry]` — Programmatic module×industry SEO feature farm. **CRUD/interactive:** read-only.
- `/glossary` — Glossary index (terms from `@/lib/marketing/glossary`, categorized). **CRUD/interactive:** read-only.
- `/glossary/[slug]` — Glossary term detail. **CRUD/interactive:** read-only.
- `/guides` — Guides index (ISR). **CRUD/interactive:** read-only.
- `/guides/[slug]` — Guide article detail (ISR). **CRUD/interactive:** read-only.
- `/help` — Help center landing. Static. **CRUD/interactive:** read-only.
- `/integrations` — Integrations directory (static catalog `@/lib/marketing/integrations`, categorized). **CRUD/interactive:** read-only.
- `/integrations/[slug]` — Integration detail. **CRUD/interactive:** read-only.
- `/integrations/partners` — Partner integrations directory (reads DB). **CRUD/interactive:** read-only.
- `/integrations/partners/[slug]` — Partner integration detail (reads DB). **CRUD/interactive:** read-only.
- `/integrations/submit` — Submit-a-partner-integration form. **CRUD/interactive:** server action (`submitPartnerIntegration`) inserts into `partner_integrations`.
- `/integrations/submit/thanks` — Post-submit confirmation. **CRUD/interactive:** read-only.
- `/legal/dpa` — Data Processing Addendum. **CRUD/interactive:** read-only.
- `/legal/privacy` — Privacy policy. **CRUD/interactive:** read-only.
- `/legal/sla` — Service Level Agreement. **CRUD/interactive:** read-only.
- `/legal/terms` — Terms of Service. **CRUD/interactive:** read-only.
- `/partners` — Partner program landing. **CRUD/interactive:** read-only.
- `/press` — Press / media page. **CRUD/interactive:** read-only.
- `/pricing` — Pricing tiers (Free/etc., i18n tier copy). Static. **CRUD/interactive:** read-only.
- `/roadmap` — Public product roadmap (quarters × in_flight/next/exploring). **CRUD/interactive:** read-only (no voting).
- `/solutions` — Solutions index (ISR). **CRUD/interactive:** read-only.
- `/solutions/atlvs` — ATLVS solution page (ISR). **CRUD/interactive:** read-only.
- `/solutions/compvss` — COMPVSS solution page (ISR). **CRUD/interactive:** read-only.
- `/solutions/gvteway` — GVTEWAY solution page (ISR). **CRUD/interactive:** read-only.
- `/solutions/[industry]` — Per-industry solution page (ISR). **CRUD/interactive:** read-only.
- `/status` — Platform status / service health board (per-service operational/degraded/outage). **CRUD/interactive:** read-only (static state, no live incident feed).
- `/teams` — Teams / by-role index. **CRUD/interactive:** read-only.
- `/teams/[role]` — Per-role team page. **CRUD/interactive:** read-only.
- `/templates` — Template gallery index, categorized. **CRUD/interactive:** read-only.
- `/templates/[slug]` — Template detail. **CRUD/interactive:** read-only.
- `/tools` — Free tools hub (links to calculators). **CRUD/interactive:** read-only.
- `/tools/capacity-calculator` — Venue capacity / max-occupancy calculator (interactive `CapacityCalculator` client component). **CRUD/interactive:** client-side calculator (inputs → computed result; no persistence).
- `/tools/per-diem-calculator` — Crew/talent per-diem travel-allowance calculator (interactive `PerDiemCalculator` client component). **CRUD/interactive:** client-side calculator (no persistence).

## Marketplace (public discovery — `(marketing)/marketplace/*`)

Anon-readable discovery surfaces driven by `public_*` Supabase views. List pages support filtering; inquire/apply/submit pages write via server actions.

- `/marketplace` — Marketplace hub linking to all discovery sub-surfaces. **CRUD/interactive:** read-only.
- `/marketplace/agencies` — Agency directory (`public_agency_directory`). **CRUD/interactive:** read-only.
- `/marketplace/agencies/[handle]` — Agency profile detail. **CRUD/interactive:** read-only.
- `/marketplace/agencies/[handle]/inquire` — Contact/inquiry form for an agency. **CRUD/interactive:** server action `submitMarketplaceInquiry` → inserts `marketplace_inquiries` (via shared `InquirePanel`).
- `/marketplace/crew` — Crew directory (public crew view). **CRUD/interactive:** read-only.
- `/marketplace/crew/[handle]` — Crew profile detail. **CRUD/interactive:** read-only.
- `/marketplace/crew/[handle]/inquire` — Crew inquiry form. **CRUD/interactive:** server action → `marketplace_inquiries`.
- `/marketplace/talent` — Talent directory / EPK roster (public talent view). **CRUD/interactive:** read-only.
- `/marketplace/talent/[handle]` — Talent EPK detail. **CRUD/interactive:** read-only.
- `/marketplace/talent/[handle]/inquire` — Talent inquiry form. **CRUD/interactive:** server action → `marketplace_inquiries`.
- `/marketplace/vendors` — Vendor directory (public vendor view). **CRUD/interactive:** read-only.
- `/marketplace/vendors/[handle]` — Vendor profile detail. **CRUD/interactive:** read-only.
- `/marketplace/vendors/[handle]/inquire` — Vendor inquiry form. **CRUD/interactive:** server action → `marketplace_inquiries`.
- `/marketplace/gigs` — Public job board (`public_job_board`), filterable (location etc.). **CRUD/interactive:** read-only (filters).
- `/marketplace/gigs/[slug]` — Gig/job posting detail. **CRUD/interactive:** read-only.
- `/marketplace/gigs/[slug]/apply` — Job application form. **CRUD/interactive:** server action `applyToGig` → inserts `job_applications`.
- `/marketplace/calls` — Open calls / casting list (`public_open_calls`). **CRUD/interactive:** read-only.
- `/marketplace/calls/[slug]` — Open call detail. **CRUD/interactive:** read-only.
- `/marketplace/calls/[slug]/submit` — Open-call submission form (dup-guarded, one live submission per user). **CRUD/interactive:** server action `submitToCall` → inserts `open_call_submissions`, redirects to `/me/submissions`.
- `/marketplace/rfqs` — Public RFQ marketplace (`public_rfq_marketplace`). **CRUD/interactive:** read-only.
- `/marketplace/rfqs/[slug]` — RFQ detail. **CRUD/interactive:** read-only.
- `/marketplace/rfqs/[slug]/inquire` — RFQ inquiry form. **CRUD/interactive:** server action → `marketplace_inquiries`.
- `/marketplace/calendar` — Event calendar of on-sales + announce milestones (`public_event_calendar`). **CRUD/interactive:** read-only.
- `/marketplace/store` — GVTEWAY commerce storefront product grid (DB-backed). **CRUD/interactive:** server action `addToCart` (writes `store_cart_items`).
- `/marketplace/store/[slug]` — Store product detail with variant picker. **CRUD/interactive:** add-to-cart form (`AddToCartForm` → `addToCart`).
- `/marketplace/store/cart` — Shopping cart review + checkout. **CRUD/interactive:** cart line edit/remove (`CartItemRow`) + `CheckoutButton`; reads current cart.

# Auth

All auth screens render under the `(auth)` shell (`AuthShell`/`AuthCard`). Most page files are thin servers delegating to client form components; OAuth/SSO via `OAuthButtons`.

- `/login` — Sign in. **CRUD/interactive:** `LoginForm` — password sign-in (`signInWithPassword`), OAuth/SSO buttons, links to `/forgot-password` and `/magic-link`.
- `/signup` — Create account. **CRUD/interactive:** `SignupForm` — `signupAction` (email/password `signUp`) + OAuth buttons; links to login.
- `/forgot-password` — Request password reset email. **CRUD/interactive:** `ForgotPasswordForm` (`resetPasswordForEmail`).
- `/reset-password` — Set a new password after reset-token verification. **CRUD/interactive:** `ResetPasswordForm` (`updateUser` password).
- `/reset-password/[token]` — Token-landing variant that verifies the reset OTP/token. **CRUD/interactive:** `verifyOtp` flow → password set.
- `/magic-link` — Request a magic sign-in link. **CRUD/interactive:** `MagicLinkForm` (`signInWithOtp` email).
- `/magic-link/[token]` — Magic-link consume/verify landing. **CRUD/interactive:** `verifyOtp` (magiclink) → session.
- `/verify-email` — Post-signup "confirm your email" screen with resend. **CRUD/interactive:** `VerifyEmailScreen` (resend confirmation; reads `?email`).
- `/verify-email/[token]` — Email-confirmation token consume landing. **CRUD/interactive:** `verifyOtp` (email) → verifies + session.
- `/accept-invite/[token]` — Accept an org invitation. **CRUD/interactive:** `AcceptInviteForm` — accepts invite, joins org (server `AcceptInvite` action).
- `/sso/[provider]` — SSO entrypoint; initiates OAuth handshake for google/github/azure/apple/linkedin_oidc (404s on unsupported). **CRUD/interactive:** `signInWithOAuth` redirect (no form).
- `/mfa/challenge` — Two-factor verification step (TOTP) after password; redirects to enroll if no verified factor. **CRUD/interactive:** `MfaChallengeForm` + actions (`challenge`/`verify`/`enroll`).
- `/onboarding/org` — Post-auth org creation for users without a real org. **CRUD/interactive:** `OnboardingOrgForm` (server action creates org; reads `?name`).

# Personal (/me)

Authed self-service shell. All read `requireSession()` + Supabase; degrade gracefully when Supabase unconfigured.

- `/me` — Personal dashboard; role-adaptive card grid with live counts (offers, applications, etc.). **CRUD/interactive:** read-only (navigation hub).
- `/me/profile` — Edit personal profile (avatar, name, public handle, EPK link). **CRUD/interactive:** `FormShell` + server action (updates profile, `public_handle`).
- `/me/settings` — Account settings (density, locale, timezone). **CRUD/interactive:** `updateSettings` server action; `ThemeToggle`.
- `/me/settings/appearance` — Color mode + density picker. **CRUD/interactive:** `ThemeToggle` + `DensityToggle` (client, persisted via theme axes; no server action).
- `/me/preferences` — Notification + theme/locale preferences. **CRUD/interactive:** `savePreferencesAction` server action.
- `/me/privacy` — Privacy & data controls: export data, cookie consent, delete account (30-day grace). **CRUD/interactive:** `PrivacyControls` (client; export/delete/consent actions).
- `/me/security` — Security overview: password change + 2FA enrollment status. **CRUD/interactive:** password update + 2FA/TOTP entry points.
- `/me/security/two-factor` — Manage TOTP two-factor (enroll/verify, factors). **CRUD/interactive:** server actions (`enroll`/verify TOTP).
- `/me/notifications` — Notification preference matrix (per-kind toggles). **CRUD/interactive:** `FormShell` + server action saving the preference matrix.
- `/me/notifications/inbox` — In-app notification inbox. **CRUD/interactive:** server action (mark-read / accept).
- `/me/notifications/push` — Web-push subscription management. **CRUD/interactive:** `PushToggle` (subscribe/unsubscribe).
- `/me/organizations` — List org memberships + roles/tiers. **CRUD/interactive:** read-only.
- `/me/applications` — My job applications list (marketplace). **CRUD/interactive:** mutation present (withdraw-type action); filterable.
- `/me/applications/[applicationId]` — Application detail (stage/status). **CRUD/interactive:** read-only.
- `/me/submissions` — My open-call submissions list. **CRUD/interactive:** mutation present (withdraw).
- `/me/submissions/[submissionId]` — Submission detail. **CRUD/interactive:** read-only.
- `/me/offers` — Talent booking offers with state machine. **CRUD/interactive:** server actions — accept / decline / counter offer.
- `/me/inquiries` — Marketplace inquiries I've sent/received. **CRUD/interactive:** read-only (list).
- `/me/availability` — Booking availability calendar / slots. **CRUD/interactive:** server actions (manage availability slots).
- `/me/reviews` — Reviews received + written. **CRUD/interactive:** read-only (list).
- `/me/reviews/new` — Write a review for a counterpart booking/transaction. **CRUD/interactive:** server action (create review).
- `/me/talent` — Self-managed talent EPK editor (publish toggle, public handle). **CRUD/interactive:** server actions (edit/publish EPK, `public_handle`).
- `/me/crew` — Self-managed crew profile editor (public profile toggle/handle). **CRUD/interactive:** server actions (edit/publish crew profile).
- `/me/saved-searches` — Saved marketplace searches. **CRUD/interactive:** server actions (create/delete saved search).
- `/me/tickets` — My ticket/credential assignments (`listMyAssignments`). **CRUD/interactive:** read-only (data table).

# Root

Public/standalone routes directly under `src/app/` (no route group). Most `[token]` pages are public, unauthenticated, cookie-gated document surfaces.

- `/api-docs` — REST API reference rendered from the OpenAPI 3.1 registry (`buildOpenAPI`). **CRUD/interactive:** read-only (generated reference).
- `/forms/[slug]` — Public form renderer for a published form definition (schema-driven fields). **CRUD/interactive:** `PublicFormSubmit` + server action `submitFormAction` (inserts a submission).
- `/proposals/[token]` — Public proposal viewer (block-rendered) with signature block + view analytics. **CRUD/interactive:** `SignatureBlock` (e-sign / accept) + view tracking; share-link token resolution.
- `/proposals/heat` — Hard-coded "Miami HEAT × Agora" pop-up activation demo proposal (`HeatProposalView`). **CRUD/interactive:** read-only demo (static showcase).
- `/offer/[token]` — Public offer-letter viewer; cookie-gated by access code. **CRUD/interactive:** server actions — accept / decline / countersign (signature); links to MSA signer if active.
- `/msa/[token]` — Public Master Service Agreement document viewer; cookie-gated by access code. **CRUD/interactive:** `SignForm` server action (sign / countersign MSA).
- `/share/[token]` — Public unauthenticated share-link landing (viewer/commenter); verifies + consumes share token. **CRUD/interactive:** mostly placeholder — renders a "shared resource" card for resource types whose public renderer isn't wired yet (`share_links` is a primitive); token verify/consume only.
