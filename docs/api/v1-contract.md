# API v1 Contract

## Response envelope

Success:
```json
{ "ok": true, "data": { ... } }
```

Error:
```json
{ "ok": false, "error": { "code": "bad_request", "message": "…", "details": [...] } }
```

## Error codes

| Code           | HTTP |
|----------------|------|
| bad_request    | 400  |
| unauthorized   | 401  |
| forbidden      | 403  |
| not_found      | 404  |
| conflict       | 409  |
| rate_limited   | 429  |
| internal       | 500  |

## Helpers (`src/lib/api.ts`)

- `apiOk(data)` — 200
- `apiCreated(data)` — 201
- `apiError(code, message, details?)` — mapped status
- `parseJson(req, zodSchema)` — parses + validates JSON body or returns 400

## Auth (`src/lib/auth.ts`)

- `getSession()` — returns `Session | null` (stub — wire Supabase SSR here)
- `withAuth(handler)` — runs handler with session or returns 401
- `resolveShell(persona)` — maps persona → `/console | /p | /m | /me`

## Seed endpoints

- `GET /api/v1/health` — liveness
- `GET /api/v1/projects` — list (auth)
- `POST /api/v1/projects` — create (auth + Zod)
- `POST /api/v1/tickets/[id]/scan` — check-in scan (auth + Zod)
- `POST /api/v1/webhooks/stripe` — Stripe webhook receiver
