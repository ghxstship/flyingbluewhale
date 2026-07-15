# SECURITY — `storage_service_role_buckets_upload` applies to every authenticated user

**Found**: 2026-07-15, while building COMPVSS receipt capture (parity audit G1).
**Status**: **OPEN — not fixed.** Deliberately left for a human decision.
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

Three **metadata-only** rows remain (no file content was uploaded — these were direct
`storage.objects` inserts, not Storage API uploads), under the demo org prefix
`68672cc3-0667-4234-ad77-49325e173175/`:

| bucket | name |
| --- | --- |
| `incident-photos` | `…/probe-i.jpg` |
| `procore-parity` | `…/probe-p.jpg` |
| `receipts` | `…/probe-r.jpg` |

`storage.protect_delete()` blocks SQL deletion by design, so they need the Storage API
(or a service-role script) to remove. Harmless, but they should not be left to rot.

## Why it is not fixed here

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

This is why COMPVSS receipt capture (G1) is **not** built yet even though its RLS half
shipped (`20260715150000`, verified). The feature needs to write to `receipts`, and the
only path that currently permits it is the hole. Building on it would have meant
shipping a feature that works *because* of a security bug — and then quietly breaking
the feature when the bug is fixed.

`expenses.receipt_path` is still populated by **no surface in the repo**, console
included. That column has been waiting for this to be resolved.

## Recommended next step

Confirm intent, then apply (a) as an immediate mitigation, audit the service-role
callers' path shapes, and schedule (b). Then build G1's surface against the tightened
policy.
