# Runbook — Auth error spike

**What broke.** Sentry is seeing an elevated rate of:

- `unauthorized` 401 envelopes (token expired / invalid)
- `forbidden` 403 from `assertCapability` denials
- `webauthn.verification_failed` events

Any single mode on its own is expected baseline noise. A spike on two
or more simultaneously is the pattern that fires this runbook.

**Who's affected.** Depends on the mode:
- 401 surge — any authed user (session cookie broken).
- 403 surge — single role or single capability (scope via the message).
- passkey failures — authenticator cohort (iOS, Android, 1Password, …).

**How do I confirm.**

```bash
# Events by code in the last 15 min (from structured logs or Sentry)
#   grep -E 'unauthorized|forbidden' /logs | jq .error.code | sort | uniq -c

# Deploy correlation — did a deploy land in the last hour?
vercel list --limit 5 | head

# Were Supabase Auth settings changed (JWT secret rotation, provider config)?
#   Supabase dashboard → Auth → Logs
```

**Stop the bleeding** (first 5 min).

1. **Spike is post-deploy.** Roll back: `vercel rollback`. 90% of auth
   surges are a regression in the auth middleware / session parsing.
2. **Spike aligns with a Supabase auth change.** If someone rotated
   the JWT signing secret, existing sessions are invalid — this is
   expected but users must re-login. Announce in-app and stop rolling.
3. **Passkey failures only.** Check `getRpConfig()` — if `origin` or
   `rpID` was changed, every registered credential's `expectedRPID`
   mismatch will fail verification. Revert.
4. **403s only, single capability.** Someone probably gated a route
   without adding the capability to the role that needs it. Grep
   `assertCapability(session, "<cap>")` and compare to `CAPABILITIES`
   in `src/lib/auth.ts`.

**Root cause.**

- JWT secret rotation without a migration plan
- Bad deploy shipping a new `assertCapability` without the matching
  `CAPABILITIES` entry
- Passkey `rpID` drift (deploying under a new hostname without updating config)
- `updateSession()` matcher accidentally excluded a new route prefix

**How we alert on this.**

- Sentry event rate per error code > 5× 7-day baseline → paging.
- Synthetic probe: a headless browser runs login + `/auth/resolve` every
  5 min; failures 3x in a row → paging.

**Escalation.** Primary: on-call backend. Fallback: julian.clarkson@ghxstship.pro.

**Retro reference.**
- (none yet)
