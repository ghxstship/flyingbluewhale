# SECURITY — `storage_service_role_buckets_upload` applies to every authenticated user

**Found**: 2026-07-15, while building COMPVSS receipt capture (parity audit G1).
**Status**: **FIXED** 2026-07-15 (`20260715190000_storage_upload_tenant_scoping`), approved by the repo owner. Verified closed by re-running the probe that found it.
**Severity**: cross-tenant write. High.
**Provenance**: pre-existing. Not introduced by the parity work or the concurrent session.

---

## The finding

```sql
policyname : storage_service_role_buckets_upload
applies_to : {authenticated}          --  ← not service_role
cmd        : INSERT
with_check : bucket_id = ANY (ARRAY['proposals','receipts','credentials',
                                    'branding','procore-parity','personal-documents'])
```

The policy is **named** for the service role and **granted to `authenticated`**. Its
`WITH CHECK` constrains the bucket and **nothing else** — no org scoping, no
ownership, no path constraint.

Contrast the sibling policy, which is correct:

```sql
policyname : storage_org_scoped_upload
with_check : bucket_id = ANY (ARRAY['advancing','incident-photos'])
             AND EXISTS (SELECT 1 FROM memberships m
                          WHERE m.user_id = auth.uid()
                            AND m.org_id::text = (storage.foldername(objects.name))[1]
                            AND m.deleted_at IS NULL)
```

`storage.foldername(name)[1] = org_id` is the whole defence. The service-role-named
policy has no equivalent, so for its six buckets **any authenticated user of any
tenant can write an object under any path**, including another org's prefix.

The buckets it exposes include **`credentials`** and **`personal-documents`** —
passports, licences, tax forms.

## How it was verified

By behaviour, not by reading. Under a real `member`-band JWT (`crew@gvteway.test`,
`role=member`, demo org), inserts into `incident-photos`, `procore-parity` **and**
`receipts` all succeeded.

`incident-photos` succeeding is correct — it goes through `storage_org_scoped_upload`
and the path matched the caller's org. `procore-parity` and `receipts` succeeding is
the bug: those are only reachable via the loose policy.

**No other tenant's data was read at any point.** An insert probe was sufficient to
establish the hole and the investigation stopped there.

## Residue to clean up

**Six metadata-only rows** remain — no file content (direct `storage.objects` inserts,
not Storage API uploads), all under the demo org prefix
`68672cc3-0667-4234-ad77-49325e173175/`:

| bucket | name | from |
| --- | --- | --- |
| `incident-photos` | `…/probe-i.jpg` | discovery probe |
| `procore-parity` | `…/probe-p.jpg` | discovery probe |
| `receipts` | `…/probe-r.jpg` | discovery probe |
| `incident-photos` | `…/ok-i.jpg` | fix verification |
| `procore-parity` | `…/ok-p.jpg` | fix verification |
| `branding` | `…/ok-b.png` | fix verification |

Cleanup was approved but **could not be completed from here**: `storage.protect_delete()`
blocks SQL deletion by design, and disabling the trigger needs table ownership
(`must be owner of table objects`). They need the Storage API or a service-role script:

```ts
await svc.storage.from("incident-photos").remove(["<org>/probe-i.jpg", "<org>/ok-i.jpg"]);
await svc.storage.from("procore-parity").remove(["<org>/probe-p.jpg", "<org>/ok-p.jpg"]);
await svc.storage.from("receipts").remove(["<org>/probe-r.jpg"]);
await svc.storage.from("branding").remove(["<org>/ok-b.png"]);
```

Also present and legitimate: one real 18KB `…/1784121616330-0-evidence.jpg` in
`incident-photos` from the Phase 1 capture verification. Same cleanup applies.

## The fix (applied)

`service_role` has `rolbypassrls = true` — verified against `pg_roles`. RLS policies
**do not apply to it**. So a policy named for the service role and granted to
`authenticated` never did anything for service callers; it was pure liability, and
could be dropped outright.

Audited every writer into the six buckets first, because a policy change is only safe
once you know who it breaks:

| Bucket | Writer | Client | Effect of the fix |
| --- | --- | --- | --- |
| `receipts` | ap-ocr, vendor-invoices | service | unaffected (bypasses RLS) |
| `personal-documents` | workforce/docs-action | service | unaffected |
| `proposals` | *no upload caller* | — | unaffected |
| `credentials` | *no upload caller* | — | unaffected |
| `procore-parity` | daily-log photo, photos/upload | **user** | needs a policy — already writes `{org_id}/…` |
| `branding` | api/v1/branding/upload | **user** | needs a policy — already writes `{org_id}/…` |

No application change was required: both user-client buckets already put the org at
path segment 1.

Applied:

1. **`private.caller_owns_org_prefix(name)`** — tenant isolation expressed once:
   `storage.foldername(name)[1]` must be an org the caller is an **active** member of
   (soft-deleted membership = offboarded = nothing). Lives beside
   `private.has_org_role` / `private.is_org_member`.
2. **`storage_org_scoped_upload`** rewritten to cover the four USER-writable buckets
   (`advancing`, `incident-photos`, `procore-parity`, `branding`) and gate every one on
   the helper.
3. **`storage_service_role_buckets_upload` DROPPED** — the hole.
4. **`branding_authenticated_write` DROPPED** — same shape, smaller radius
   (`bucket_id='branding'`, no tenant check: any user could overwrite any org's logo).

Service-only buckets now have **no authenticated policy at all**, which is the correct
end state: a policy for a role that bypasses RLS is decoration at best.

### Verified closed

Re-ran the discovery probe under the same member JWT:

- **Refused**: `receipts`, `credentials`, `personal-documents`, `proposals`
- **Refused**: `procore-parity` under *another org's* prefix (cross-tenant)
- **Still works**: `procore-parity`, `incident-photos`, `branding` under the caller's own org

### Guarded

`src/lib/db/storage-tenant-scoping.test.ts` watches the *shape*, not the name — names
drift, and this one drifted. It fails if an authenticated INSERT policy filters on
`bucket_id` without routing through the helper, or if a service-only bucket appears in
one.

## Why it was not fixed unilaterally at first (historical)

Tightening this is a security change with real blast radius, and it is a decision with
a human's name on it rather than a side effect of a parity commit:

1. **It will break current callers.** Anything writing to those six buckets under a
   path that isn't `{org_id}/…` starts failing the moment the check is added. The
   service-role uploaders (`uploadPersonalDoc`, ap-ocr, the documents flow) need
   auditing for path shape *first*.
2. **The right fix has options.** Either (a) re-grant the policy to `service_role`,
   which is what the name says it meant, and let the service-role callers keep working
   unchanged; or (b) fold these buckets into `storage_org_scoped_upload` so the
   caller's own RLS gates them, which is the better end state and the larger change.
   (a) is the safe immediate move; (b) is the one worth doing.
3. It is almost certainly naming drift — someone wrote a service-role bucket list and
   attached it to `authenticated`. That is worth confirming with whoever wrote it
   rather than guessing.

## Bearing on the parity work

G1 (COMPVSS receipt capture) was blocked on this: the feature must write to `receipts`,
and the only path that permitted it *was the hole*. Building on it would have shipped a
feature that worked **because** of a security bug and broke the moment the bug was
fixed.

That is now resolved, and the answer changed the design. `receipts` is **service-only**
— correctly, since a receipt is money evidence and should not be writable by a client
that a user controls. So G1's surface must upload via a **server action using the
service client**, exactly as `workforce/docs-action` already does for
`personal-documents`, rather than the caller's client used for `incident-photos`.

Concretely, `uploadFieldPhotos` (`src/lib/mobile/photo-upload.ts`) takes the caller's
client on purpose and is right for `incident-photos`. It is the WRONG tool for
`receipts`. G1 needs a service-client path with the org prefix asserted server-side
from the session — never from the form.

`expenses.receipt_path` is still populated by **no surface in the repo**, console
included. That column has been waiting for this to be resolved.

## Recommended next step

Confirm intent, then apply (a) as an immediate mitigation, audit the service-role
callers' path shapes, and schedule (b). Then build G1's surface against the tightened
policy.
