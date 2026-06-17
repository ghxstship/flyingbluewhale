<!--
  PR template for flyingbluewhale (ATLVS Technologies).
  Keep the description tight; tick what applies. CI (lint · typecheck · unit ·
  e2e) is the hard gate — this checklist is the human reminder for the things
  CI can't infer from a diff alone.
-->

## What & why

<!-- One or two sentences: what this changes and the reason. Link the issue/ticket if there is one. -->

## How to verify

<!-- The commands or steps a reviewer runs to confirm it works. -->

## Checklist

- [ ] `npm run lint` + `npx tsc --noEmit` pass
- [ ] `npx vitest run` passes (and new behavior has coverage)
- [ ] **Nav/routes:** new routes are wired into a `src/lib/nav.ts` export (or added to `EXEMPT` in `scripts/generate-sitemap.mjs` with a reason) — `npm run gen:sitemap` is clean and `docs/ia/SITEMAP.md` is committed
- [ ] **Schema:** new columns follow LDP naming (`*_phase` / `*_state`, never `status`); migrations applied via the Supabase MCP, not hand-edited
- [ ] **Brand/theme:** no retired tokens/fonts; theme changes go through `tokens.json` (`npm run gen:theme`)
- [ ] **URLs:** cross-shell links use `urlFor(...)`; no hardcoded `*.atlvs.pro`
- [ ] Docs/CLAUDE.md updated if behavior or conventions changed

## Notes for reviewers

<!-- Anything out of scope, follow-ups, or areas you want a closer look at. -->
