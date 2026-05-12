# SmartSuite Parity 04 — Solutions, Permissions, Collaboration, Account

Research date: 2026-05-04
Scope: SmartSuite collections "Solutions", "Collaborating in SmartSuite", "Account", plus the canonical `Managing Solution Permissions` article.
Codebase reference: `flyingbluewhale` (FLYTEHAUS Technologies) at commit `71a40e4`.

---

## 1. Executive Summary

The biggest parity gaps, ranked roughly by impact:

1. **No "solution" / sub-space concept.** SmartSuite Workspace → Solution → Application → Record is a 4-level hierarchy. FLYTEHAUS has Org → Project → Resource (effectively 3 levels), and Project is a domain entity, not a generic container. There is no template / blueprint primitive for spinning up a project.
2. **Permission model stops at org + project.** SmartSuite has 6 record-level roles (Full / Editor / Contributor / Assignee / Commenter / Viewer) per Solution, plus Team-based assignment, plus field-level locks. We have 4 platform roles + 5 project roles; both are coarse, with no "Assignee-only" or "Commenter" tier and no field-level RLS. ([SmartSuite][p1])
3. **No first-class generic comments.** Annotations (`annotations` table) cover flag/note/comment/tag polymorphically but no UI surfaces it as the canonical "comment thread" pattern, no rich text, no attachments, no reactions, no resolve/reopen UX. SmartSuite Conversations have all of these. ([SmartSuite][c1])
4. **No @mentions infrastructure.** No mention tokens, no team mentions, no notification fan-out from a mention. Only the annotations `assigned_to` carries a user reference. ([SmartSuite][m1])
5. **No presence / "who's viewing" / live updates.** SmartSuite shows real-time avatars, edited-field highlights, and per-second update broadcasting. We have nothing equivalent (Supabase Realtime is in the stack but not wired). ([SmartSuite][rt])
6. **No notification preferences fan-out engine.** Per-event channel matrix exists in `user_preferences.ui_state.notifications` (UI only) but no resolver actually consults it before inserting into `notifications`. Email/Slack/Push channels are unimplemented.
7. **No SAML / OIDC enterprise SSO, no SCIM, no enforced 2FA.** Only social OAuth (`google`, `github`, `azure`, `apple`, `linkedin_oidc`) via Supabase Auth. Passkeys exist (`webauthn_challenges`) but TOTP is "Disabled" in the UI. SmartSuite ships SAML+OIDC+SCIM+IP-allowlist on Enterprise. ([SmartSuite][sso], [SmartSuite][scim], [SmartSuite][ip])
8. **No public/guest share links with expiry or password.** Portal access is by org membership + `/p/[slug]` boundary. SmartSuite's Solution sharing supports per-link expiry, password, and link-type (view / edit). ([SmartSuite][share])
9. **No record-level activity timeline UX.** `audit_log` exists and many tables write to it, but there is no per-record "history" panel like SmartSuite's clock-icon side drawer. ([SmartSuite][hist])
10. **No event-log export.** SmartSuite Enterprise streams JSON to S3 for SIEM integration. We have `audit_log` but no publisher. ([SmartSuite][evt])

---

## 2. Solution / Workspace Model

### SmartSuite

- **Workspace** = top-level tenant (the billable entity). One user can belong to many workspaces. ([SmartSuite][multi])
- **Solution** = a "comprehensive organizational container" inside a workspace, holding one or more Tables (= Applications). Solutions can be **created from scratch, duplicated, packaged, or installed from a Template** (industry blueprint).
- **Solution Templates** + **Solution Packaging** = portable, shareable, reusable bundles.
- **Solution Guides** = embedded documentation per solution.
- **Tables** can be moved between Solutions, hidden, duplicated, deleted.

### FLYTEHAUS today

- `orgs` (= Workspace) — `src/lib/auth.ts`, `supabase/migrations/20260416_000001_identity_tenancy.sql`.
- `projects` — closest to a Solution but is a domain noun (it's a production gig), not a generic container. No "create project from template" flow.
- The IA splits into route groups (`/console`, `/p/[slug]`, `/m`) by audience, not by sub-space. There is no nested "many solutions per org" container.
- Only one `template`-shaped concept exists: `deliverable_templates` (per advancing item) and `email_templates` (per send) — both narrow.
- Project shell sub-modules (Operations, Finance, People, etc.) live as fixed nav entries in `src/lib/nav.ts#platformNav`. There is no per-tenant "solution palette" — every org sees the same module taxonomy.

### Gap

| Concept                | SmartSuite                 | FLYTEHAUS                                  | Gap                       |
| ---------------------- | -------------------------- | ------------------------------------------ | ------------------------- |
| Tenant root            | Workspace                  | `orgs`                                     | Same                      |
| Sub-container          | Solution (n per workspace) | `projects`                                 | Domain-locked, no generic |
| Application            | Table (n per solution)     | Each module table                          | Hard-coded in schema      |
| Template               | Solution Template gallery  | None                                       | Missing                   |
| Packaging              | Export/import a Solution   | None                                       | Missing                   |
| Cross-solution roll-up | "My Work" aggregator       | `console/action-items`, `me/notifications` | Partial                   |

The cleanest mapping is **Org → Project → Module** but we'd need (a) a `templates` table at org or platform scope to clone projects from, (b) a "module enable/disable" gate per project so different gig types render different IA, (c) a cross-project "My Work" view in `(personal)/me`.

---

## 3. Permissions Matrix

### SmartSuite layers

System role (workspace) → Solution role → Application role → Record-level role → Field-level lock. Source: `Managing Solution Permissions`. ([SmartSuite][p1], [SmartSuite][roles])

**System roles:** Administrator, Solution Creator, General User, Guest.

**Solution-level:** three modes — All Members Full Access (default) · Team-Specific Access · Advanced Permissions.

**Advanced Permissions roles** (per user or per team):

| Role        | C   | R (own)       | R (others)      | U (own)       | U (others)    | D        | Comment |
| ----------- | --- | ------------- | --------------- | ------------- | ------------- | -------- | ------- |
| Full Access | yes | yes           | yes             | yes           | yes           | yes      | yes     |
| Editor      | yes | yes           | yes (read-only) | yes           | no            | own only | yes     |
| Contributor | yes | yes           | no              | own only      | assigned only | own only | yes     |
| Assignee    | no  | assigned only | no              | assigned only | no            | no       | yes     |
| Commenter   | no  | yes           | yes             | no            | no            | no       | yes     |
| Viewer      | no  | yes           | yes             | no            | no            | no       | no      |

When a user has multiple grants, "highest level" wins. **Solution Managers** override everything within their solution. Team-of-managers is supported.

### FLYTEHAUS today

| Layer           | Implementation                                                                                                                                                                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tenant          | `memberships(org_id, user_id, role)` with enum `platform_role` = `owner / admin / manager / member` (v2 in `20260504_000001_role_system_v2.sql`); legacy v1 had 10 personas (`owner/admin/controller/collaborator/contractor/crew/client/viewer/community/developer`). |
| Capability gate | `CAPABILITIES` map in `src/lib/auth.ts` — UI gating + 403 envelopes.                                                                                                                                                                                                   |
| Project         | `project_members(project_id, user_id, role)` with `project_role` = `lead / editor / contributor / viewer / vendor`. Helpers: `is_project_member()`, `has_project_role()` in v2 migration.                                                                              |
| Record          | None. RLS gates at org or project scope only.                                                                                                                                                                                                                          |
| Field           | None.                                                                                                                                                                                                                                                                  |
| Team            | None. No Teams concept.                                                                                                                                                                                                                                                |
| Guest           | `persona = 'guest'` is a routing fallback for users with only the `demo` membership. There is no per-resource guest grant.                                                                                                                                             |

### Gap

- **No "Commenter" or "Assignee-only"** — closest FLYTEHAUS analog is `viewer` (read all) or `vendor` (locked to one project). Neither matches Commenter, neither matches "can edit only assigned records".
- **No Teams** — RLS expressions check `auth.uid()`, never a group membership.
- **No field-level RLS** — Postgres RLS is row-only. Field locks would require column-grants (DB-managed) or app-layer gates per column.
- **Multi-grant precedence** is implicit in our model (capabilities are role-based, not stacked).
- **Solution Manager** equivalent exists implicitly: `owner/admin` get `*`; manager gets the working set. There is no per-project elevation that doesn't propagate to the org.

### RLS patterns we'd need

```sql
-- Record-level role table (analog of SmartSuite Solution Permissions)
create table record_grants (
  resource_table text not null,
  resource_id    uuid not null,
  principal_kind text not null check (principal_kind in ('user','team')),
  principal_id   uuid not null,
  role           record_role not null,  -- full | editor | contributor | assignee | commenter | viewer
  granted_by     uuid references users(id),
  expires_at     timestamptz,
  primary key (resource_table, resource_id, principal_kind, principal_id)
);

-- Helper used in every table policy
create function record_role_for(t text, id uuid)
returns record_role language sql stable as $$
  select max_role from (
    select role::int as max_role
      from record_grants
     where resource_table = t and resource_id = id
       and ((principal_kind = 'user' and principal_id = auth.uid())
         or (principal_kind = 'team' and principal_id in (select team_id from team_members where user_id = auth.uid())))
  ) g;
$$;
```

We'd then layer this **below** `is_org_member()` / `has_org_role()` so org-admins still bypass.

---

## 4. Sharing / External Collaboration

### SmartSuite

- **Solution sharing** via Solution Permissions panel — invites tied to email + role.
- **Shared Views** and **Forms** — public links scoped to a single view; subject to IP allowlist if configured. ([SmartSuite][ip])
- **Guests** — unlicensed (or partly-licensed) users with access only to records they're assigned. `solution_grant_permission` is logged in the event log. ([SmartSuite][evt])
- **Communication Center** lets you email a contact directly from a record without changing access. ([SmartSuite][cc])

The provided article set didn't cover password-protected or expiring share links explicitly, but `Shared Views and Forms` are listed in the IP-restrictions article as scoped link types ([SmartSuite][ip]).

### FLYTEHAUS today

- **Portal shell** at `/p/[slug]/<persona>` — slug is the auth boundary; portal users still need a `memberships` row in the org backing that slug.
- **Custom domains** for portals: `org_domains` table (`supabase/migrations/20260425_000031_settings_completion.sql`). Verifies via TXT or CNAME. UI: `src/app/(platform)/console/settings/domains/`.
- **Invites** (`invites` table + `src/app/(auth)/accept-invite/`) — pending → accepted, 7-day expiry, role-stamped at invite time.
- **No ad-hoc public link** — every external view requires a real authenticated user with an `invite` → `memberships` row.
- **No password-protected link**. **No per-link expiry** (only invite expiry).

### Gap

| Feature                        | SmartSuite                     | FLYTEHAUS                          | Gap     |
| ------------------------------ | ------------------------------ | ---------------------------------- | ------- |
| Email invite to existing space | yes                            | yes (`invites`)                    | Same    |
| Public unauthenticated link    | yes (Shared Views/Forms)       | no                                 | Missing |
| Link expiry                    | yes                            | invite-level only                  | Partial |
| Link password                  | yes (implied via Shared Views) | no                                 | Missing |
| Per-link role                  | yes                            | invite role only                   | Partial |
| Guest access (record-scoped)   | yes                            | no                                 | Missing |
| Custom domain for portal       | yes                            | yes (`org_domains`)                | Same    |
| External email-from-record     | yes (Communication Center)     | partial (proposal_portal triggers) | Partial |

---

## 5. Collaboration Features

| Feature                                | SmartSuite                                                                    | FLYTEHAUS                                                                                                                                              | File / Table                                                |
| -------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| Comments on a record                   | yes — per-record thread, rich text, attachments ([SmartSuite][c1])            | partial — `annotations.kind='comment'` is generic, only used inside `console/annotations`; per-record threading scaffolded but not surfaced everywhere | `supabase/migrations/20260504000003_annotations_system.sql` |
| @mentions of users                     | yes — typeahead `@`, inline tokens, opens member directory ([SmartSuite][m1]) | no                                                                                                                                                     | n/a                                                         |
| @mentions of teams                     | yes — fans out to all team members                                            | no Teams concept                                                                                                                                       | n/a                                                         |
| Reactions                              | yes — one emoji per user per comment ([SmartSuite][react])                    | no                                                                                                                                                     | n/a                                                         |
| Threaded replies                       | flat (one level) ([SmartSuite][c1])                                           | yes (`annotations.parent_id`)                                                                                                                          | `annotations`                                               |
| Assign comment as task                 | yes — Open / Assigned / Resolved ([SmartSuite][assign])                       | yes — `annotations.assigned_to`, `linked_task_id`, `status` (open/acknowledged/resolved/dismissed)                                                     | `annotations`                                               |
| Resolve / reopen                       | yes ([SmartSuite][assign])                                                    | yes (status enum)                                                                                                                                      | `annotations`                                               |
| Following a record                     | yes — bell icon, in-app + email ([SmartSuite][follow])                        | partial — `annotation_watchers`; nothing for tasks/projects/etc.                                                                                       | `annotation_watchers`                                       |
| Activity timeline (per record)         | yes — clock icon side panel ([SmartSuite][hist])                              | partial — `audit_log` writes are extensive but no UI panel                                                                                             | `audit_log`                                                 |
| Real-time updates                      | yes — second-level broadcast ([SmartSuite][rt])                               | not wired (Supabase Realtime available)                                                                                                                | n/a                                                         |
| Presence (who's viewing)               | yes — avatars + field highlights ([SmartSuite][pres])                         | no                                                                                                                                                     | n/a                                                         |
| Cell-level conflict surfacing          | yes (highlights)                                                              | no                                                                                                                                                     | n/a                                                         |
| Notifications panel                    | yes — All / Unread / @mentioned / Assigned tabs ([SmartSuite][notif])         | partial — `notifications` table; UI in `me/notifications` is a preferences matrix, not an inbox                                                        | `notifications`                                             |
| Per-event channel preferences          | not detailed                                                                  | yes (UI only) — `EVENTS` × `CHANNELS` matrix in `me/notifications/constants.ts` (`email/in_app/slack/push`)                                            | `user_preferences.ui_state.notifications`                   |
| Mobile push                            | implied (mobile app)                                                          | unimplemented (`push` is a placeholder channel)                                                                                                        | n/a                                                         |
| Email digest                           | not detailed                                                                  | no                                                                                                                                                     | n/a                                                         |
| Mute / snooze                          | not detailed                                                                  | no                                                                                                                                                     | n/a                                                         |
| In-record email (Communication Center) | yes ([SmartSuite][cc])                                                        | partial — `proposal_portal` and `offer_letter_activity` log emails out, no inbound sync                                                                | various                                                     |
| Member directory                       | yes — handbook with skills/birthdays/teams ([SmartSuite][dir])                | partial — `console/people` for crew/people but no rich profile, no team facets                                                                         | `src/app/(platform)/console/people/`                        |

Headline: **the polymorphic `annotations` table is structurally close to SmartSuite Conversations** — but it's wired only to one console route. The org has no shared "comment-everywhere" UI primitive, no mention tokens, no reactions, no real-time broadcast.

---

## 6. Account / Admin Features

| Feature                   | SmartSuite                                                 | FLYTEHAUS                                                                                   | Source                                                    |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Workspace branding (logo) | yes ([SmartSuite][brand])                                  | yes — `orgs.logo_url`, `orgs.branding`, `safeBranding()`                                    | `console/settings/branding/`                              |
| Accent color / theme      | not detailed                                               | yes — `branding.accentColor`, `accentForeground`, `og`, `hero`, `favicon`                   | `BrandingForm.tsx`                                        |
| Custom domains (portal)   | yes (Enterprise)                                           | yes — `org_domains` (txt/cname verification)                                                | `20260425_000031_settings_completion.sql`                 |
| White-label product name  | not detailed                                               | yes — `orgs.name_override`                                                                  | `branding/page.tsx`                                       |
| Plans & billing           | yes ([SmartSuite][plans])                                  | yes — Stripe webhook + checkout, `tier` enum on `orgs`                                      | `src/lib/stripe.ts`, `/api/v1/webhooks/stripe`            |
| Multi-workspace per user  | yes ([SmartSuite][multi])                                  | yes — `memberships` is many-to-many, `getSession()` picks "real-org" preference             | `src/lib/auth.ts`                                         |
| Workspace usage stats     | yes                                                        | partial — `usage_events` table, no UI                                                       | `20260418_000020_usage_events.sql`                        |
| File storage limits       | yes (per plan)                                             | tier-based but not enforced at upload                                                       | n/a                                                       |
| Working days / holidays   | yes ([SmartSuite][work])                                   | no global setting                                                                           | n/a                                                       |
| Member directory          | yes ([SmartSuite][dir])                                    | partial — `console/people`                                                                  | `src/app/(platform)/console/people/`                      |
| Teams                     | yes (max 100, with @TeamName) ([SmartSuite][teams])        | no                                                                                          | n/a                                                       |
| Member roles assignment   | yes (Admin / Solution Creator / General / Guest)           | yes (4-role enum after v2)                                                                  | `20260504_000001_role_system_v2.sql`                      |
| SSO — SAML                | yes (Enterprise/Signature) ([SmartSuite][sso])             | no                                                                                          | n/a                                                       |
| SSO — OIDC                | yes (Enterprise/Signature) ([SmartSuite][sso])             | partial — Supabase social providers (`google`, `azure`, `apple`, `linkedin_oidc`, `github`) | `src/app/(auth)/sso/[provider]/page.tsx`                  |
| 2FA — TOTP                | yes — Google Auth, MS Auth, Duo, Authy ([SmartSuite][2fa]) | UI says "Disabled"; not implemented                                                         | `me/security/page.tsx`                                    |
| 2FA — SMS                 | yes (mentioned)                                            | no                                                                                          | n/a                                                       |
| Passkeys / WebAuthn       | not mentioned                                              | yes — `webauthn_challenges` table, `PasskeyManager.tsx`                                     | `src/lib/webauthn.ts`                                     |
| Enforced 2FA per role     | yes ([SmartSuite][2fa])                                    | no                                                                                          | n/a                                                       |
| SCIM provisioning         | yes (Okta, Entra, PingFed) ([SmartSuite][scim])            | no                                                                                          | n/a                                                       |
| IP restrictions           | yes (Enterprise/Signature) ([SmartSuite][ip])              | no                                                                                          | n/a                                                       |
| Audit / event log         | yes — JSON to S3 in near real-time ([SmartSuite][evt])     | yes — `audit_log` table + viewer (`console/settings/audit/AuditLogViewer.tsx`)              | `audit_log`                                               |
| Event log export to SIEM  | yes (S3 → Splunk/Datadog/Sentinel) ([SmartSuite][evt])     | no publisher                                                                                | n/a                                                       |
| API tokens                | yes (per plan limits)                                      | yes — `api_keys` table, `verifyApiKey()`, PAT bearer auth                                   | `src/lib/api-keys.ts`                                     |
| Webhooks                  | yes                                                        | yes — `webhook_endpoints`, `webhook_deliveries`                                             | `20260420_000027_webhooks_and_notifications_triggers.sql` |
| Workspace deactivation    | yes                                                        | no UI; cascades exist on `orgs` deletion                                                    | n/a                                                       |

---

## 7. Top 10 Implementation Recommendations

Ranked by **impact ÷ effort**. S = ≤1 day, M = ≤1 week, L = ≤1 sprint, XL = multi-sprint.

### #1 — Generic `<CommentThread>` primitive on top of `annotations` (M)

The schema is already there. Build one Client Component, wire it into the four highest-traffic detail pages first (project, deliverable, ticket, daily-log). Adds rich text, attachments via `signed_url`, optimistic insert.

- New file: `src/components/collab/CommentThread.tsx`
- New action: `src/lib/actions/annotations.ts` (`addComment`, `resolveComment`, `reopenComment`).
- Reuses: `annotations`, `annotation_watchers`, `notifications`, `audit_log`. ([SmartSuite][c1])

### #2 — `@mentions` parser + notification fan-out (M)

Markdown extension that recognises `@username` / `@team-slug`, stores resolved IDs in `annotations.metadata.mentions[]`, and inserts a `notifications` row per mention.

- New file: `src/lib/collab/mentions.ts`.
- DB: extend `annotations_notify()` trigger to read `new.metadata->'mentions'`. ([SmartSuite][m1])

### #3 — Notifications inbox UI (S)

Today `me/notifications` is a _preferences_ page; SmartSuite's bell-icon UI is a feed. Reuse the existing `notifications` table; build All / Unread / @mentioned / Assigned tabs.

- New page: `src/app/(personal)/me/notifications/inbox/page.tsx`.
- Reuses: `notifications` table (already org+user scoped). ([SmartSuite][notif])

### #4 — Notification preferences resolver (S)

Wire the existing matrix in `user_preferences.ui_state.notifications` into a server-side `shouldNotify(userId, event, channel)` helper, and call it before inserting into `notifications` or sending email. Currently the matrix is read-only.

- New file: `src/lib/notify-resolver.ts` (extend `src/lib/notify.ts`).
- Touches: every place `insert into notifications` runs (annotations trigger, webhooks).

### #5 — Real-time presence + record updates via Supabase Realtime (M)

Subscribe to a per-record `presence` channel and broadcast cursor + user. Render avatars in `<RecordHeader>`. This is the single feature most likely to "feel SaaS-grade."

- New file: `src/components/collab/Presence.tsx`.
- Uses Supabase channel `presence:{table}:{id}`. ([SmartSuite][pres], [SmartSuite][rt])

### #6 — TOTP 2FA + enforcement per role (M)

Supabase Auth supports MFA factors (`auth.mfa.enroll`). The UI already shows "Disabled" — flip it on, add enrollment flow in `me/security`, add `orgs.require_2fa_for` jsonb gate in `proxy.ts`. WebAuthn is already live so this just adds the second factor.

- New: `src/app/(personal)/me/security/two-factor/`.
- Touches: `proxy.ts` (post-login gate). ([SmartSuite][2fa])

### #7 — Per-record activity drawer (S)

`audit_log` is dense and well-populated; SmartSuite surfaces it as a side panel keyed on (table, id). Build `<ActivityDrawer table={...} id={...}>` reading `audit_log` filtered by `target_table`/`target_id`.

- New file: `src/components/collab/ActivityDrawer.tsx`.
- Reuses: `audit_log`. ([SmartSuite][hist])

### #8 — Teams primitive + team mentions + team-scoped grants (L)

Adds `teams(org_id, slug, name)` and `team_members(team_id, user_id, role)`, plus `team_id` columns on `record_grants` (see #9). Lets `@team-slug` mentions fan out, lets `assigned_to` accept a team. Unlocks the Teams-based Solution Permissions mode.

- New migration: `2026MMDD_teams.sql`.
- New helpers: `is_team_member(team_id)`, `auth_team_ids()`. ([SmartSuite][teams])

### #9 — `record_grants` table for SmartSuite-style record-level roles (L)

Six-role enum (`full / editor / contributor / assignee / commenter / viewer`), polymorphic `(resource_table, resource_id)`, principal `(user|team)`, optional `expires_at`. Layer **below** existing org-admin bypass so owners still have superpowers. Pair with field-level locks via app-layer gates (Postgres column privileges are too blunt).

- New migration: `2026MMDD_record_grants.sql`.
- New helpers: `record_role_for(table, id)`, `can_record(table, id, op)`.
- Touches: every RLS policy that wants to honor record-level grants. ([SmartSuite][p1])

### #10 — Public share links with expiry + password (M)

New table `share_links(id, org_id, resource_table, resource_id, role, expires_at, password_hash, max_uses, uses)`. Token-based unauth route at `/share/[token]`. Lets a producer hand a one-off "view-only proposal" link without provisioning a portal user. Bonus: makes Shared Views possible in the future. ([SmartSuite][share])

### Bonus — Event log publisher to S3 / Datadog (L, Enterprise tier only)

Pg trigger or hourly job that streams `audit_log` rows as JSON into a tenant-scoped S3 prefix. Pure plumbing; sells itself to security-buyer personas. ([SmartSuite][evt])

### Bonus — SAML SSO via WorkOS or Supabase Auth SAML (XL)

Supabase Auth supports SAML SSO (`sso.providers`). Wire `accept-invite` and `auto_provision_membership` to the SAML attribute claims. Gate behind `tier ∈ {enterprise}`. ([SmartSuite][sso], [SmartSuite][scim])

---

## 8. Citations

[p1]: https://help.smartsuite.com/en/articles/4770333-managing-solution-permissions
[roles]: https://help.smartsuite.com/en/articles/4797910-managing-user-roles-in-smartsuite
[c1]: https://help.smartsuite.com/en/articles/4752873-conversations
[assign]: https://help.smartsuite.com/en/articles/4752895-assign-resolve-reopen-comments
[react]: https://help.smartsuite.com/en/articles/4756011-reactions-to-comments
[m1]: https://help.smartsuite.com/en/articles/4752876-mentions
[notif]: https://help.smartsuite.com/en/articles/4752877-notifications
[follow]: https://help.smartsuite.com/en/articles/4752884-following-unfollowing-a-record
[rt]: https://help.smartsuite.com/en/articles/4763647-real-time-updates
[pres]: https://help.smartsuite.com/en/articles/4752887-who-s-viewing-a-record
[hist]: https://help.smartsuite.com/en/articles/4855582-record-activity-history
[cc]: https://help.smartsuite.com/en/articles/6971532-communication-center
[dir]: https://help.smartsuite.com/en/articles/4752879-member-directory
[brand]: https://help.smartsuite.com/en/articles/4793500-customizing-your-smartsuite-workspace-logo
[teams]: https://help.smartsuite.com/en/articles/4793454-introduction-to-teams
[multi]: https://help.smartsuite.com/en/articles/4793246-can-i-have-multiple-smartsuite-workspaces
[work]: https://help.smartsuite.com/en/articles/4789979-working-days
[plans]: https://help.smartsuite.com/en/articles/4789240-smartsuite-plans-features-and-pricing
[sso]: https://help.smartsuite.com/en/articles/6267261-configuring-single-sign-on-sso
[2fa]: https://help.smartsuite.com/en/articles/9163772-two-factor-authentication
[scim]: https://help.smartsuite.com/en/articles/12738919-configuring-scim
[ip]: https://help.smartsuite.com/en/articles/9278341-ip-restrictions
[evt]: https://help.smartsuite.com/en/articles/12739039-event-log-publication
[share]: https://help.smartsuite.com/en/collections/2709053-smartsuite-solutions

Article URLs (in citation order):

- Managing Solution Permissions — https://help.smartsuite.com/en/articles/4770333-managing-solution-permissions
- Managing User Roles — https://help.smartsuite.com/en/articles/4797910-managing-user-roles-in-smartsuite
- Conversations — https://help.smartsuite.com/en/articles/4752873-conversations
- Assign / Resolve / Reopen Comments — https://help.smartsuite.com/en/articles/4752895-assign-resolve-reopen-comments
- Reactions — https://help.smartsuite.com/en/articles/4756011-reactions-to-comments
- @Mentions — https://help.smartsuite.com/en/articles/4752876-mentions
- Notifications — https://help.smartsuite.com/en/articles/4752877-notifications
- Following / Unfollowing — https://help.smartsuite.com/en/articles/4752884-following-unfollowing-a-record
- Real-Time Updates — https://help.smartsuite.com/en/articles/4763647-real-time-updates
- Who's Viewing a Record — https://help.smartsuite.com/en/articles/4752887-who-s-viewing-a-record
- Record Activity History — https://help.smartsuite.com/en/articles/4855582-record-activity-history
- Communication Center — https://help.smartsuite.com/en/articles/6971532-communication-center
- Member Directory — https://help.smartsuite.com/en/articles/4752879-member-directory
- Workspace Logo — https://help.smartsuite.com/en/articles/4793500-customizing-your-smartsuite-workspace-logo
- Introduction to Teams — https://help.smartsuite.com/en/articles/4793454-introduction-to-teams
- Multiple Workspaces — https://help.smartsuite.com/en/articles/4793246-can-i-have-multiple-smartsuite-workspaces
- Working Days — https://help.smartsuite.com/en/articles/4789979-working-days
- Plans & Pricing — https://help.smartsuite.com/en/articles/4789240-smartsuite-plans-features-and-pricing
- Configuring SSO — https://help.smartsuite.com/en/articles/6267261-configuring-single-sign-on-sso
- Two-Factor Authentication — https://help.smartsuite.com/en/articles/9163772-two-factor-authentication
- Configuring SCIM — https://help.smartsuite.com/en/articles/12738919-configuring-scim
- IP Restrictions — https://help.smartsuite.com/en/articles/9278341-ip-restrictions
- Event Log Publication — https://help.smartsuite.com/en/articles/12739039-event-log-publication
- Solutions collection (root) — https://help.smartsuite.com/en/collections/2709053-smartsuite-solutions
- Collaborating collection (root) — https://help.smartsuite.com/en/collections/2698973-collaborating-in-smartsuite
- Account collection (root) — https://help.smartsuite.com/en/collections/2701964-account
