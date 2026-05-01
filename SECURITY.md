# Security Policy

## Supported Versions

The `main` branch tracks production. Only the current `main` HEAD receives
security fixes. Earlier tags / preview deployments are not maintained.

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security reports.

Email: `security@ghxstship.io`
PGP: on request from the same address

What to include:

- The component affected (URL, route, or file path)
- Steps to reproduce (curl / HTTP capture preferred)
- Impact assessment (what an attacker could do)
- Whether you've publicly disclosed

What to expect:

- Acknowledgement within **48 hours**
- Severity triage within **5 business days** using CVSS 3.1
- Critical / High issues: a fix or mitigation deployed within **14 days**
- Moderate / Low issues: rolled into the next planned release
- Public disclosure (with credit, opt-in) after the fix ships

## Scope

In scope:

- The deployed `flyingbluewhale.app` web app + its `/api/v1/*` endpoints
- The Supabase Postgres schema in `supabase/migrations/**`
- Edge functions in `supabase/functions/**`
- Authentication, authorization, RLS, and audit-log integrity

Out of scope:

- Denial of service via volumetric attacks (rate limiting + Vercel /
  Supabase platform protections handle that layer)
- Findings on third-party services (report directly to them)
- Best-practice / hardening suggestions without a concrete impact
- Self-XSS, missing security headers on the marketing site that don't
  affect authenticated routes
- Vulnerabilities in development-only or local-only code paths

## Hall of Fame

Researchers who report valid issues will be credited here (opt-in) with a
link of their choice once the fix ships.
