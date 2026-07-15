# Shipping main — state as of 2026-07-15 13:30

Written by the session tasked with validating main before a push. **main was not
pushed.** Push = prod deploy. This is what is true, what got fixed, and what is
still in the way.

## The headline

Committed main at `69732c81` passes the full gate, verified on a **clean
checkout in an isolated worktree** (`dirty=0`), not the working tree:

| Gate                   | Result                                  |
| ---------------------- | --------------------------------------- |
| `npx tsc --noEmit`     | exit 0, zero output                     |
| `npm test`             | exit 0 — 142 files, 1550 tests          |
| `npm run build`        | compiled successfully, route manifest emitted, 0 errors |
| `gen:sitemap:check`    | exit 0 — up to date                     |
| `gen:ia-map --check`   | exit 0 — up to date                     |

`npm test` went from **5 failures to 0** during this session.

**This result is for committed main ALONE.** It does not survive the in-flight
work landing. Re-run the gate after the tree settles.

## Why it is still not shippable

1. **Phase B is not finished.** 13 `from("workforce_members")` reads across 11
   files remain in committed main. See "The grep that lies" below.
2. **The tree is in flight** — 52 modified, 28 untracked files across ~5
   sessions. Regenerating an SSOT or rebasing against it is unsafe.
3. **origin's 2 commits are not integrated** (`8dd7eb89`, `a84da8d3` — approval
   RLS + atomic decision RPC). Rebasing 72 commits under five sessions'
   uncommitted edits is destructive; wait.
4. **The scope carries a breaking change** that must be surfaced explicitly
   before push, not inferred from an older "go ahead".

## The grep that lies

The ship checklist greps `workforce_member_id`. That is the **join key**, and it
is clean. The **table** readers are a different set:

```sh
# WRONG — reads 0, because the repoint is uncommitted in the working tree
grep -rn 'from("workforce_members")' src

# RIGHT — reads 13, across 11 files
git grep 'from("workforce_members")' main -- src
```

The gap between "committed" and "what's in the tree" cost another session its
whole day: it read the working tree, concluded the repoint had landed, and
rebuilt work that partly existed and partly didn't. **When validating a deploy,
grep the ref, never the tree.**

The uncommitted repoint is *not* a mechanical rename — the large files carry a
new separation/reinstate feature depending on an untracked
`src/lib/db/separation.ts`, an untracked migration, and an "ADR-0015 Addendum
2". One file has a mangled edit artifact (a comment spliced between `await` and
its call). It needs its owner or a full review, not adoption.

### Ordering is load-bearing

`supabase/migrations/20260715220000_retire_workforce_members.sql` (committed on
`claude/infallible-leakey-5365a2`, deliberately **unapplied**) drops
`shifts.workforce_member_id` and the `workforce_members` table. PostgREST errors
on a select for a column that does not exist, so **migration-before-deploy** takes
down the volunteer portal, call sheets and the operations schedule. The
repointed code reads `crew_member_id`, which Phase A already added, so it is
forward-compatible: **deploy first, migrate second.** Check the *deployed ref*
before applying.

## Landed this session

| Commit     | What                                                          |
| ---------- | ------------------------------------------------------------- |
| `c809cfb6` | Phase B join keys — 7 sites + a dead `Shift` type              |
| `cba5c090` | soft-delete canon — 5 reference reads annotated, 1 stale grant ratcheted |
| `694923ab` | ia-lint + xpms-portal-mapping unstuck (also unblocks kit-28's merge) |
| `aa865041` | `/m/wallet` → `/m/pass` — a live 404 on the COMPVSS home screen |
| `69732c81` | ia-model.json regenerated against committed main               |

Two of those guards were red for reasons that were **not defects**:
`xpms-portal-mapping` asserted `vendor ? 3 : 2` after Amendment 6 deliberately
split crew too; `ia-lint`'s regex matched the words "nothing here" inside a
**code comment** in a server action that renders no JSX.

The Phase B join-key fix is **latent, not observable**: `shifts.crew_member_id`
is null on all 16 rows, exactly as `workforce_member_id` was. Those surfaces
still render empty — they rendered empty before too. What changed is that they
now read the column a populated roster will write to.

## Traps worth keeping

**Never regenerate an SSOT against the dirty tree.** The generators read the
filesystem. Main's working-tree `ia-model.json` had baked in
`/studio/settings/capabilities` — a route that exists only in uncommitted work.
Regenerate in a clean worktree at the target commit, then copy the artifact
across and commit path-scoped.

**`database.types.ts` is worse.** `cb967058` regenerated from a snapshot taken
*between* two migrations and silently reverted three type blocks; latent for
hours. Diff for **deletions** before committing, and typecheck the **commit** in
an isolated worktree — the working tree's uncommitted regen masks a missing type
and makes a broken commit look green.

**Sessions clear each other's git index.** `src/app/layout.tsx` was staged by
another session and got swept into an unrelated commit here despite only two
files being staged. Use `git commit -- <paths>`; it commits those paths
regardless of the index.

**A red guard is cover for everything that lands after it.** soft-delete-canon
was red on someone else's file, so a session attributed it once and stopped
reading — then shipped four unguarded reads into that same red test across four
commits. Re-read the offender list on every run.

**Exit codes.** `npm run build &` reports the wrapper's exit, not the build's.
Piped `tsc`/`test` mask theirs. Check the log, not the code.

**Stale `.next` lies.** `tsc` reported 3 errors from `.next/types/validator.ts`
referencing routes a concurrent session had renamed. A tree with no `.next`
typechecks clean.

## Open items

Tracked as tasks #1–#6. In dependency order: finish Phase B table readers (#1) →
land the unmerged branches (#6) and the incidents soft-delete fix (#5) → rebase
onto origin and re-run the gate (#2) → ship notes with the breaking change (#3),
then explicit user confirmation.
