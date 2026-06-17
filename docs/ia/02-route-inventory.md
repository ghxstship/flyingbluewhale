# Route Inventory

> **⚠️ SUPERSEDED (2026-06-17).** The single source of truth for the route
> surface is now **[`SITEMAP.md`](./SITEMAP.md)** — generated from the live
> filesystem reconciled against `src/lib/nav.ts` (`npm run gen:sitemap`). It
> covers all 1,084 page routes + API handlers and flags nav orphans. The
> route-group→prefix table below is retained as a quick reference; everything
> else (route lists) lives in `SITEMAP.md`. Reconciliation plan:
> [`SITEMAP_RECONCILIATION.md`](./SITEMAP_RECONCILIATION.md).

Routes are materialized from `scripts/routes.txt` via
`bash scripts/generate-stubs.sh` (idempotent; existing files are not overwritten).

## Route groups → URL prefixes

| Group       | URL prefix  | Purpose                                      |
|-------------|-------------|----------------------------------------------|
| (marketing) | `/`         | Public, SEO, unauthenticated                 |
| (auth)      | `/`         | Login, signup, invites, tokens               |
| (personal)  | `/me`       | Self-service account (any authed user)       |
| (platform)  | `/console`  | Internal operations console                  |
| (portal)    | `/p/[slug]` | External stakeholder workspaces              |
| (mobile)    | `/m`        | Field PWA                                    |

## Not in app tree

- `src/app/auth/resolve/route.ts` — role-based shell router (POST from login form; GET as redirect target).
- `src/app/api/v1/*` — versioned API, Zod-validated, `withAuth`-guarded.
