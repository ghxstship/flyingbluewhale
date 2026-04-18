# purge-deleted-accounts

Daily cron worker that finalizes account deletion 30 days after the user
requests it via `/api/v1/me/delete`.

## Deploy

```bash
supabase functions deploy purge-deleted-accounts --no-verify-jwt
supabase secrets set PURGE_TOKEN="$(openssl rand -hex 32)"
```

## Schedule

Use Supabase pg_cron or an external scheduler that POSTs to:

```
https://<project>.functions.supabase.co/purge-deleted-accounts
Headers:
  x-purge-token: <PURGE_TOKEN>
```

Recommended: 03:00 UTC daily.

## Behavior

- Selects every `public.users` row where `deleted_at <= now()`.
- Deletes the public.users row (CASCADE removes memberships + user-scoped rows).
- Calls `auth.admin.deleteUser()` to remove the auth.users row.
- Returns counts of purged + failed.

## Recovery window

If a user signs in within 30 days (between deletion request and purge),
`/api/v1/me/restore` (TODO) should clear `deleted_at` and undo the email
scrub. Until then, contact support manually.
