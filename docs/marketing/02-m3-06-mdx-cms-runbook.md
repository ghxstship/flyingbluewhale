# M3-06 — Blog + Changelog CMS migration runbook

**Status:** deferred behind a product decision, not behind engineering
capacity. This runbook documents the chosen architecture + the exact
shape of the migration so whoever picks it up tomorrow doesn't
re-litigate the choices.

---

## What's in place today

- **Blog posts** live in `src/lib/blog.ts` as TypeScript objects. One
  file, hand-edited, covered by types but not by tests.
- **Changelog entries** live in `src/lib/changelog.ts`, same shape.
- **Index pages** (`src/app/(marketing)/blog/page.tsx`,
  `/changelog/page.tsx`) read the arrays directly.
- **Detail pages** (`/blog/[slug]/page.tsx`) render a subset of block
  types (`p`, `h2`, `h3`, `ul`, `code`). No MDX support.

## Why migrate

1. **Editorial velocity.** Every blog post today requires a TypeScript
   edit + PR. Operators and marketing should be able to ship a post
   without a deploy.
2. **Content richness.** The bespoke block types are a limited subset
   of what MDX gives for free — components inside the prose, typed
   shortcodes, imported images.
3. **Reusability.** Product screenshots, data viz, and interactive
   demos embedded in posts are trivial in MDX and painful in the
   current object graph.

## The chosen stack

**MDX + file-system-backed routing, no external CMS.**

- **Why MDX, not Sanity / Contentful:** we want content in Git. Every
  post is a PR, reviewable, revertable, and deployable alongside the
  code that renders it. A headless CMS adds infra, a separate auth
  story, editorial-UI risk, and a new line item on the budget.
- **Why file-system, not contentlayer:** contentlayer's maintenance is
  slowing; the Next 16 compatibility window is uncertain. Native MDX
  with `@next/mdx` + a simple frontmatter parser covers 95% of the
  need with zero upstream risk.

## Concrete migration plan

### 1. Directory shape

```
content/
├── blog/
│   ├── 2026-04-19-ai-for-production.mdx
│   ├── 2026-04-12-row-level-security.mdx
│   └── _template.mdx
└── changelog/
    ├── 2026-04-19-h3-tranche.mdx
    ├── 2026-04-18-marketing-header-m1.mdx
    └── _template.mdx
```

Filenames are dated + slugged; the date is the source of truth for
`publishedAt`. Frontmatter carries the rest.

### 2. Frontmatter schema (Zod-validated at build time)

```mdx
---
title: "Row-level security: our 14-table proof"
slug: "row-level-security"
author: "Julian Clarkson"
publishedAt: 2026-04-12
tags: ["security", "architecture"]
excerpt: "How we proved RLS holds across 14 tables without trusting code."
heroImage: "/blog/rls-hero.png"
---

## The problem

MDX body goes here, with components available inline…
```

Validator in `src/lib/content/mdx-schema.ts`; a unit test asserts every
file in `content/blog/**` parses cleanly. Build fails loudly on invalid
frontmatter.

### 3. Dependencies

```bash
npm install @next/mdx @mdx-js/react @mdx-js/loader \
            remark-gfm remark-frontmatter remark-mdx-frontmatter \
            rehype-slug rehype-autolink-headings
```

Wire `@next/mdx` into `next.config.ts`; add `mdx` to `pageExtensions`
ONLY for the `/content` tree (not global).

### 4. Loader

`src/lib/content/loader.ts` walks `content/blog/*.mdx` + `content/changelog/*.mdx`
at build time, parses frontmatter, and exports typed arrays:

```ts
export const blog: BlogPost[] = await loadBlog();
export const changelog: ChangelogEntry[] = await loadChangelog();
```

Since the loader runs at build, it's zero-runtime-cost for visitors.

### 5. Page refactors

- `/blog/page.tsx` — swap the hardcoded import for `{ blog }` from the
  loader.
- `/blog/[slug]/page.tsx` — render via `<MDXRemote source={post.body} />`
  + a component registry (`<Callout>`, `<Figure>`, `<CodeTabs>`).
- Same for changelog.
- `generateStaticParams()` enumerates the file-system so every post
  pre-renders.

### 6. Changelog auto-draft from conventional commits

Separate, lower-stakes: a GitHub Action runs on tag push, parses
`git log --format=%s` for commits since the previous tag, groups by
`feat:` / `fix:` / `perf:` / etc., and opens a PR with a draft
`content/changelog/<date>-<tag>.mdx`. Humans edit + merge.

## Acceptance

- Every current blog post + changelog entry migrated to MDX (there
  are ~8 blog posts and ~6 changelog entries; a morning of work).
- Build passes on an invalid frontmatter file.
- Unit test validates every file's frontmatter via Zod.
- `generateStaticParams` covers every file.
- `_template.mdx` in each directory documents the required
  frontmatter for the next author.
- A PR-only editorial workflow is documented in `CONTRIBUTING.md`.

## Rollback

If the migration sees a regression (build slow, FOUC on MDX hydrate,
etc.), revert the PR — the old `src/lib/{blog,changelog}.ts` arrays
stay in Git until the migration PR is squashed. Thirty-minute rollback.

## Estimated engineering cost

- Core migration: 4–6 hours.
- Per-post MDX conversion: 15 minutes × ~14 files = 3.5 hours.
- Changelog auto-draft action: 2 hours.
- Documentation + `_template.mdx` scaffolding: 1 hour.

**Total:** ~1 focused day.

## Unblock gate

The one remaining question: **do we keep the custom block types
(`{ kind: "callout" }`, etc.) as MDX components, or drop to pure
MDX/Markdown?** Pure MDX is simpler; keeping the custom types
preserves any bespoke rendering we've invested in.

Recommendation: **pure MDX + a small set of canonical components**
(`<Callout>`, `<Figure>`, `<CodeTabs>`, `<Definition>`) defined in
`src/components/mdx/`. Reserves the door to bespoke block types
without baking them in from day 1.

Once that call is made, the migration is unblocked.
