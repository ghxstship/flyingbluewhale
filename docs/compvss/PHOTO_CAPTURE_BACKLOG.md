# COMPVSS photo capture — backlog

What is left after the geotag / capture-honesty / offline work of 2026-07-15
(commits `a7a1a204` → `abb0eee1`, plus `20260715220000`). Written at handoff, so
read it as a snapshot: verify against the code before trusting any line.

The through-line of every item below is the same defect class this work kept
finding: **the app reporting success while keeping nothing usable.** A photo
counter that counted nothing; photos uploaded and rendered nowhere; a HEIC no
reviewer could open; a form that advertised a file field it could never
accept. Each was silent. When picking work off this list, prefer the item
where the product currently lies.

---

## 1. Verify the whole loop on a real phone — **do this first**

Nothing here has been exercised in a browser. Every claim is unit tests and
reasoning. The offline path especially:

> airplane mode → shoot → submit → confirm "queued" → reconnect → confirm the
> log lands **with its photos and their geotags**.

Also worth a pass: the geotag chip on `/m/incidents/new` (deny location, confirm
it says "No location" and still files), and an iOS library pick (confirm HEIC
arrives as an openable JPEG).

Why it never happened: Next refuses a second dev server in one directory, and
another agent's server owned the port all session. Killing theirs mid-flight
wasn't worth it.

## 2. Offline queueing stops at the daily log

`lib/offline/photo-blobs` is generic, but only `/m/daily-log/new` is wired to
it. **Incidents, lost & found, handover and market still fail outright with no
signal** — the safety-critical surface is the one still missing. Those four go
through `FormScreen` + a direct server action, with no queue at all.

Two known limits of the current design, inherited from `queue.ts`:

- **Replay only drains while the form is mounted.** A queued log syncs when the
  crew member next opens that form, not in the background. `<SyncBanner>` shows
  the count, so it isn't silent — but nobody should call this "offline-first"
  yet.
- **A permanently-failing row blocks its channel.** `flush` stops on the first
  failure to preserve ordering. That's deliberate upstream; worth knowing.

## 3. Three form specs are mounted nowhere

`maintenance`, `expense` and `post` declare photo fields and no route renders
them. Their persistence targets already exist (`maintenance_jobs.photos`,
`expenses.receipt_path`), so these are wiring jobs, not builds. They're
allow-listed in `capture-honesty.test.ts` (`UNMOUNTED_PHOTO_SPECS`) — mounting
one means deleting it from that list, and the guard then enforces the rest.

**`expense.file` is unblocked as of today.** The self-sufficiency manifest still
blocks it on the storage hole; that hole is closed (`cb967058` +
`73911b79`). See §6.

## 4. `project_photos` geotag — a product call, deliberately not made

`project_photos.lat/lng` exist and `/studio/photos/upload` still doesn't write
them. That was on purpose: a desktop browser's fix records where the *uploader*
is — the office, hours later — not where the photo was taken. Writing that into
a column reviewers would trust is worse than leaving it null.

It only makes sense if that surface is used on-site on a tablet. If it is, reuse
`lib/geo/position` + the `geotag` opt-in and it's a small change.

## 5. Guard has a known hole, documented rather than hidden

`capture-honesty.test.ts` §"photos that are stored can be looked at" checks per
**bucket**, not per surface. A new writer pointed at a bucket someone else
already renders passes while its own photos go unseen — which is exactly how
handover shipped (`procore-parity` was already signed by the studio daily-log
page). Tracing column → reader would catch it, but the readers take photos as
props rather than querying, so there's no honest static path. **A human still
has to ask "and where does this show up?"**

## 6. Coordination hazards left in the tree

- **The upload policy was fixed twice, concurrently.** Two sessions each closed
  the same `storage_service_role_buckets_upload` hole. The second fix
  (`20260715190000_storage_upload_tenant_scoping`, the better one — a named
  `caller_owns_org_prefix()` helper + its own guard) DROP/CREATEd the policy and
  silently dropped `listing-photos`, breaking `/m/market` uploads in prod for
  ~half an hour. Restored by `20260715220000` and added to that file's array so
  a replay keeps it.
- **That migration file has diverged from the database.** It creates
  `storage.caller_owns_org_prefix`; the installed helper is
  `private.caller_owns_org_prefix`. Re-applying the file will move the helper
  and rewrite the policy. Not wrong, but know it before running it.
- **Migration timestamp collisions are the norm**, not the exception: three
  files share `20260715190000`, three share `210000`. Applied versions are
  MCP-assigned so the DB is fine; only local sort order is ambiguous.
- **`forms` bucket** now exists (`20260715210000_forms_bucket`) with **no insert
  policy, deliberately** — those uploads are service-client only. Don't "fix"
  its absence.

## 7. Smaller, real

- **HEIC on Chrome desktop stays HEIC.** `downscaleImage` always transcodes HEIC
  now, but only where a decoder exists (Safari). Chrome has none, so `loadImage`
  throws and we upload the original — deliberately, since a file we can't
  convert is still evidence. The bucket allowlist keeping `image/heic` is what
  makes that fallback land instead of fail. Server-side transcode is the real
  answer if it ever matters.
- **`marketplace_listings.photos` carries null coordinates by design.** Listing
  photos are not geotagged: recording where a crew member's personal property is
  would be surveillance dressed as metadata. Don't "fix" the nulls.
- **The ArrayBuffer choice in `photo-blobs` has an expiry date** (Safari 17 /
  July 2026). It exists only because of WebKit's Blob-in-IDB bug tail. Re-test;
  Blob would be a smaller memory footprint. If capture ever grows to video or
  RAW, that module must be **replaced**, not extended — video has to stream.
