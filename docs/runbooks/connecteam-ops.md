# Connecteam-parity ops runbook

Ops for the COMPVSS feature set added in migrations 0046–0048
(announcements, chat, surveys, polls, courses, time-off, recognition,
badges, personal docs, onboarding, geofence-validated time clock).

## VAPID — Web Push enablement

Generated 2026-05-11 (rotate periodically):

```
Public  : BB9dcZAoiR2XtPaou85Cv8lpPjRQyhAjxIm3uUE4Bv4F6GEDXCSy8F-8bVk4cFnOlJUoDTfh_2dt9BUtdvvIsBg
Private : Y_4iTjQbQBbM5Vfzh-zK7vbkj_P67AJB3pBxWUmtdic
Subject : mailto:ops@lytehaus.live
```

Set on **Vercel → Project → Settings → Environment Variables** (apply to
Production + Preview + Development):

| Variable                       | Value                      |
| ------------------------------ | -------------------------- |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | _public key above_         |
| `VAPID_PUBLIC_KEY`             | _public key above_         |
| `VAPID_PRIVATE_KEY`            | _private key above_        |
| `VAPID_SUBJECT`                | `mailto:ops@lytehaus.live` |

Regenerate locally with `npx web-push generate-vapid-keys`. Existing
push subscriptions invalidate on rotation — users will re-enroll via
`/m/settings` → Push Notifications.

## Realtime publications

The `RealtimeRefresh` island (mounted on `/m/feed` and
`/m/inbox/[roomId]`) needs these tables published. Already applied
2026-05-11 via SQL:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recognition_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_swaps;
```

If you add a new realtime island, ALTER PUBLICATION its target table
the same way (verify via Dashboard → Database → Publications).

## Storage RLS

Migration 0045 enforces org-folder scoping on `storage.objects`. Applied
2026-05-11 via MCP — confirmed live with:

```sql
SELECT polname FROM pg_policy WHERE polrelid = 'storage.objects'::regclass;
-- expect: storage_org_scoped_read, storage_org_scoped_upload,
--         storage_service_role_buckets_upload (plus pre-existing)
```

`/m/docs` uploads write to `personal-documents` bucket via service-role
in `src/app/(mobile)/m/docs/actions.ts`; downloads mint 5-min signed
URLs via the same client.

## Test users — demo org

Re-roled 2026-05-11 in `68672cc3-0667-4234-ad77-49325e173175`:

| Role    | Email                    | Password           |
| ------- | ------------------------ | ------------------ |
| owner   | `performer@gvteway.test` | `CompvssTest2026!` |
| admin   | `admin@gvteway.test`     | `CompvssTest2026!` |
| manager | `mgmt@gvteway.test`      | `CompvssTest2026!` |
| member  | `crew@gvteway.test`      | `CompvssTest2026!` |

Plus seed fixtures (Demo PTO policy + 60h balance per user, Site Safety
101 course assignment per user, "Welcome to COMPVSS" announcement,
"Which day works best?" live poll).

To reset/rotate passwords (requires Supabase MCP):

```sql
UPDATE auth.users
SET encrypted_password = crypt('NewPassword!', gen_salt('bf', 10)),
    updated_at = now()
WHERE email = '<address>';
```

## Smoke harnesses

```bash
npm run dev &
# wait ~30-60s for /login to compile
node scripts/compvss-smoke.mjs         # 188 page renders (47 × 4 roles)
node scripts/compvss-actions-smoke.mjs # 28 mutation checks (7 × 4 roles)
```

Both write JSON reports to stdout; the page-render report also lands at
`/tmp/compvss-smoke-results.json` for offline inspection.

## Auto-badge on course pass

When `courses.completion_badge_id` is set, the `submitQuiz` server
action on `/m/learning/[courseId]` inserts a `badge_awards` row on pass
and pushes a notification. Configure via the **Completion Badge**
section on `/console/workforce/courses/[courseId]`.

## Time-off balance reconciliation

Admin approval at `/console/workforce/time-off` calls the SECURITY
DEFINER RPC `approve_time_off_request(uuid, uuid, text)` which
atomically decrements `time_off_balances.balance_hours` and bumps
`used_ytd_hours`. Denials don't touch the balance. The action falls back
to a plain UPDATE if the RPC is missing (e.g. on a branch DB without
0048).
