# Comparison verification runbook

The comparison program is unbiased by construction: every claim about a
competitor derives from their public pages, every page says when it was last
checked, and CI enforces freshness. This runbook is the operational half of
that guarantee — what to do when the guard fires, and how to add or retire an
entry without eroding the discipline.

The guard: `src/lib/marketing/comparison-verification.test.ts`
The data: `src/lib/compare.ts` (legacy roster) + `src/lib/marketing/comparisons-*.json`

## Cadence

- **180 days** is the staleness ceiling (`STALE_DAYS`). Any entry whose
  `lastVerified` is older fails the full vitest suite, which runs in pre-push
  and CI. There is no scheduled sweep to remember: the failure IS the reminder.
- When the guard fires it names the stale slugs. Re-verify only those; do not
  batch-bump dates on entries you did not actually re-check.

## Re-verifying an entry

1. Open the entry's `sources` URLs. If a URL is dead, find the vendor's
   current equivalent page (product page + pricing page is the standard pair)
   and update `sources`.
2. Walk the entry's `rows`/cells against what the vendor currently publishes:
   - A competitor capability you can see on their public pages → `true` with
     honest framing.
   - A claim you cannot ground in their public pages → the cell text is
     **"Not published"**, never `false`-by-assumption and never a guess about
     internal architecture.
   - Our side: never claim console features as live while ATLVS is
     coming-soon; phrase as "Console: coming soon".
3. No pricing numbers in cells — pricing changes faster than the cadence.
4. Bump `lastVerified` to the date you actually checked (YYYY-MM-DD).

## Adding an entry

Every new entry, any category, ships with `lastVerified` + at least 2 https
`sources` on the vendor's real domain. `LEGACY_UNVERIFIED_PIN` is 0 and must
never rise — the grandfather clause closed with the P4 backfill (2026-07-22).

## Retiring an entry

If a vendor cannot be verified to exist (dead domain, no public footprint),
remove the entry rather than fabricating sources, and leave a dated rationale
comment at the removal site. Precedent: the former `onstage` entry, removed
2026-07-22 (`src/lib/compare.ts`).

## Voice rules (apply to every cell and note)

- Never disparage; concede honestly where the competitor is strong (see the
  Flex unlimited-users and Tixr consumer-commerce concessions).
- No em/en dashes, no emoji, no competitor names outside the data files
  (`src/lib/brand` guard enforces the code-side rule).
