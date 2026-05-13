---
name: validate
description: Run the canonical zero-tolerance validation suite — typecheck, lint, test, production build, brand SSOT sweep, URL canon, LDP naming, unsafe casts. Use when the user asks to validate the codebase, before pushing to main, or as a daily cleanliness gate. Auto-fixes typecheck/lint/test/build blockers; asks before editing canonical violations.
---

# Validate — Zero-Tolerance Validation Suite

Run the full pre-deploy validation on the current branch. Surface every failure with `file:line`. Auto-fix safe blockers; ask before editing canonical violations.

## Pre-flight

Run gates in parallel where independent. Sequence below.

## Gates

### 1. Branch state

```bash
git status --short
git rev-parse HEAD
git rev-parse origin/main
git log --oneline -3
```

Pass criteria: clean working tree (or changes intentional). On a worktree branch, HEAD === origin/main is the goal per the trunk-based convention.

### 2. Typecheck

```bash
npm run typecheck
```

Pass criteria: zero errors. Pre-existing errors in unrelated files (Supabase generated-types drift, etc.) still count — surface them with `file:line`.

### 3. Lint

```bash
npm run lint
```

Pass criteria: zero errors, zero warnings. Watch for Next.js `no-assign-module-variable`, unused imports, a11y regressions.

### 4. Test

```bash
npm run test
```

Pass criteria: every suite passing. Canon-enforcing suites that fail are real findings:

- `src/app/design-system.test.ts` — hand-rolled brand/danger buttons (use `<Button variant="primary"|"danger">`)
- `src/app/no-as-any.test.ts` — `as any` in production code
- `src/lib/ldp-naming-canon.test.ts` — new `*_status` columns banned (use `*_phase` or `*_state`)
- `src/app/url-canon.test.ts` — hardcoded `https://atlvs.pro` outside SSOT files

### 5. Production build

```bash
npm run build
```

Pass criteria: "Compiled successfully". This is what Vercel runs and is stricter than typecheck alone.

### 6. Brand SSOT sweep

```bash
grep -rIE "flytehaus|FLYTEHAUS|F L Y T E H A U S" src/ docs/ reports/ 2>/dev/null | grep -vE "memory/"
```

Pass criteria: zero hits. Historical snapshots in research docs (`docs/research/`) are exempt only if explicitly anchored to a commit hash.

### 7. URL canon sweep

```bash
grep -rIE "https?://(www\.)?atlvs\.pro" src/ 2>/dev/null | grep -vE "lib/(brand|seo|urls)\.ts|lib/urls\.test\.ts|app/url-canon\.test\.ts"
```

Pass criteria: zero hits. Use `urlFor()` from `@/lib/urls` or `SITE.baseUrl` from `@/lib/seo`. The four allowlisted SSOT files are where the literal is allowed.

### 8. LDP naming check

```bash
grep -nEH "^\s*status " supabase/migrations/00[5-9]*.sql 2>/dev/null
```

Pass criteria: zero hits in recent migrations. Schema-bearing columns must be `*_phase` (sequential macro arc) or `*_state` (cyclical operational) per `LIFECYCLE_DECOMPOSITION_PROTOCOL.md`.

### 9. Unsafe casts sweep

```bash
grep -rIEn "\bas any\b" src/ 2>/dev/null | grep -v "\.test\." | grep -v "^[^:]*:[0-9]*:\s*//"
```

Pass criteria: zero hits in production code. The `as string` / `as number` casts in `src/lib/msa/mutations.ts` (nullable NSCB fields) are canonical per the `LooseSupabase` pattern — these are fine.

## Report format

```
| Gate | Result |
|---|---|
| Branch state | ✅/❌ description |
| Typecheck | ✅ 0 errors / ❌ N errors |
| Lint | ✅ 0 / ❌ N |
| Vitest | ✅ N/N / ❌ N failing |
| Production build | ✅ / ❌ failure |
| Brand SSOT | ✅ 0 / ❌ N hits |
| URL canon | ✅ 0 / ❌ N hits |
| LDP naming | ✅ 0 / ❌ N forbidden columns |
| Unsafe casts | ✅ 0 / ❌ N `as any` |
```

## Fix protocol

- **Typecheck / lint / test / build blockers**: auto-fix and report what changed.
- **Canonical violations** (brand drift, URL canon, LDP naming, unsafe casts): list findings with `file:line`, propose minimal fix, ask before editing.

## References

- `CLAUDE.md` — brand canon + lifecycle protocol
- `src/lib/{seo,brand,urls,i18n/config}.ts` — SSOT files
- `src/app/{design-system,no-as-any,url-canon,ldp-naming-canon}.test.ts` — enforcement suites
- Memory: `feedback_validation_protocol.md` — durable user preference for this discipline
