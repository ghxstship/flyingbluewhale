# Route Inventory

Generated from `scripts/routes.txt`. Every line produces one `page.tsx`.
Re-run `bash scripts/generate-stubs.sh` to materialize new routes after edits; existing files are not overwritten.

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
