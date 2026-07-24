# Communications Audit + Remediation — 2026-07-24

Full-lifecycle audit of every communication surface (chat, broadcast,
notifications, mass comms) plus the same-day remediation program. Four
parallel exploration passes (chat / notifications / broadcast / mass comms)
produced the findings; the disposition table records what shipped, what was
a false positive, and what is deliberately deferred.

## The stack in one paragraph

Four delivery channels (bell `notifications` rows, VAPID web push, Resend
email, transient UI) fed by three emitters (`notify()`, `writeInbox[Bulk]`,
direct `sendPushTo/Bulk`). The per-kind preference store is
`notification_preferences.matrix` keyed by the `notification_kind_catalog`
taxonomy — as of this audit it is the ONE store (the retired
`ui_state.notifications` per-event store is no longer read anywhere).
Push delivery remains architecturally mobile-first: the service worker
registers only on the compvss shell, so studio/portal recipients get
bell + email, not push.

## Shipped (this program, commits 27ffce42 · 9c87ba22 · 8119c5cc · +B1)

| # | Item | What changed |
|---|------|--------------|
| A1 | Unified chat send | `src/lib/db/chat-send.ts` behind console/mobile/portal composers: every send stamps the sender's read cursor and fans out bell+push (kind `chat`) to other members; `@Display Name` mentions notify with mention framing. Previously only the portal send notified anyone. |
| A2 | Kind-complete push | `marketplace` + `onboarding` kinds added (catalog migration `20260724152000`, all five mirror legs); roster onboarding reminder no longer bypasses the opt-out matrix; `src/lib/push/kind-required.test.ts` fails the build on any future kindless call site. |
| A3 | Honest announcement audiences | One shared audience mapping (`src/lib/db/announcements.ts`) for fan-out AND feed reads. contractors/vendors no longer blast every member; `/m/feed` filters by viewer audience + project/team membership and writes read receipts (read_count now reflects the mobile audience); portal standalone announcements are project-scoped per ADR-0008. |
| A4 | Advance funnel honesty | Skipped sends (no `RESEND_API_KEY`) stay `queued` with the skip frozen in `render_snapshot`; skipped-only runs land the batch `failed` with an explicit note. The board can no longer claim mail that was never sent. |
| A5 | Marketplace decision notifications | Applicants (interview/booked/pass) and open-call submitters (shortlisted/awarded/rejected, incl. the Book chain) get bell+push via the `marketplace` kind. Talent offers moved off the inbox-only `talent_offer` kind; `InboxKind` collapsed to `PushKind`. |
| B1 | Survey + poll takers | `/m/surveys`, `/m/surveys/[surveyId]`, `/m/polls` — the first code paths that INSERT `survey_responses` / `poll_votes`. Anonymous surveys write `respondent_id NULL`; `closes_at` gates submission and is now settable in the studio composers. |
| B2 | Real email signals | `/api/v1/webhooks/resend` (svix-verified, `RESEND_WEBHOOK_SECRET`) maps delivered/opened/bounced/complained onto the advance funnel by `render_snapshot.resend_id`. Async bounces finally reach the board. Pixel-open and portal-open are deliberately the same funnel state. |
| B3 | Guides + deliverables notify | Guide publish/update fans out to project members (idempotent per guide); `guide_views` table + read receipts on both renderers + per-persona view counts in the CMS. Deliverable `approved`/`delivered` notifies the submitter from the canonical transition route. |
| B4 | Saved-search evaluator | `evaluateSavedSearches()` on the worker tick: gig/talent_call/rfq streams diffed since `last_checked_at`, `match_count` finally written, alerts honor `alert_email`/`alert_push`. Directory kinds (talent/crew/vendor) are stamped-checked but never alerted — "new since last check" has no meaning for a profile directory. |
| C1 | One preference store | `notify-resolver` reads `notification_preferences.matrix` (keyed via `NOTIFY_EVENT_PUSH_KIND`, which moved into the resolver). A user's per-kind Email switch now actually mutes `notify()` emails. Defaults preserved: in_app ON; email ON for notify events when no explicit cell exists. |
| C2 | System B triage | `/studio/comms/channels/[id]` renders party display names instead of raw uuids; `src/lib/messaging/queries.ts` docblock marks the stack planning-only. |
| C3 | Bulk casting invite v1 | `/studio/marketplace/postings/[id]/invite`: multi-select the claimed org roster, fan out bell+push+email with the public gig link. Idempotent per (invitee, posting). |

## False positives found during remediation

- **"Portal has no notification bell"** — wrong. `WorkspaceChrome` renders
  `NotificationsBell` unconditionally and the portal layout mounts the
  chrome for every authenticated session. The audit pass grepped only
  `(portal)/` and missed the shared chrome.
- **"Bell rows can be lost to the org_id NOT NULL constraint"** — already
  fixed by migration `20260610020000` (org_id nullable; org-less rows
  surface in the user-scoped bells only).
- **"notify() push is dead"** — fixed 2026-07-15; the map-based design is
  now also what keys in_app/email gating (C1).

## Deliberately deferred (each needs an owner decision or its own program)

1. **Chat message edit/delete on System A** — needs `edited_at`/`deleted_at`
   columns + UI affordances on three shells. System B has the columns;
   adopting them is part of the System B decision below.
2. **Chat System B adoption-or-retirement** — the five-table stack
   (`message_channels`, `messages`, mentions/reactions/receipts) is
   planning-only today. Either migrate System A onto it (inheriting
   threads/edit/receipts) or drop the satellite tables. Destructive either
   way; not a same-day call.
3. **Channel browse/join + roster management** — RLS deliberately blocks
   self-join (ADR-0008 Am.5 closed a real DM-reading hole); a browse
   surface needs an is_room_admin-backed add-member UI first.
4. **Chat attachments** — a concurrent session shipped the storage bucket +
   policies (`20260724131547`); composer wiring is theirs, not duplicated
   here.
5. **Announcement scheduling/expiry + required-ack** — wants `scheduled_at`
   / `expires_at` columns and the KB `must_read_acks` pattern; product call
   on ack-chasing.
6. **Survey close automation + reminders + results export** — `closes_at`
   now gates and is settable; auto-close on the worker tick, non-responder
   chase, and CSV export are follow-ups.
7. **Studio/portal push** — the service worker is compvss-only by design
   (other shells actively unregister to protect scope). Console channels
   are bell + email. Registering a push-only SW on `app.*` is a deploy-risk
   change that should ship alone.
8. **Distinct portal-open funnel state** — the enum treats email-open and
   portal-open as one `opened`; splitting needs an enum migration and board
   copy. The Resend webhook (B2) makes the current state honest enough.
9. **Advance-engine generalization** — reusing the recipient/render-
   snapshot/ledger funnel for day sheets, guide blasts, and deliverable
   distribution. The right long-term shape; kit-sized.
10. **Email default asymmetry** — `notify()` events email default-ON,
    push-path kinds default-OFF (`fanOutEmail`). C1 gave both one store and
    one switch; flipping either default is a product decision that changes
    real delivery volume.

## Notes for future sessions

- The kind taxonomy now has FIVE mirror legs: `PushKind` union,
  `NOTIF_KINDS`, `notification_kind_catalog` view, `KIND_EMAIL_LABEL`,
  `PUSH_KIND_TIER`. The compile-level `Record<PushKind, …>` guards catch
  the last two; `notification-kind-mirror.test.ts` + `kind-required.test.ts`
  catch the rest.
- `NOTIFY_EVENT_PUSH_KIND` lives in `src/lib/notify-resolver.ts` (re-exported
  from `notify.ts`). Mapping an event there is what creates its per-kind
  switch across ALL channels — push, and now in_app/email gating too.
- Prod env prerequisites for full effect: `RESEND_API_KEY` (sends),
  `RESEND_WEBHOOK_SECRET` (delivery signals), `JOB_WORKER_TOKEN` cron
  (chase ladder + saved-search alerts).
