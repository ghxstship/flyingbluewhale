# ADR-0001: Three-shell topology

**Status:** Accepted
**Date:** 2026-04-16

## Context

The predecessor projects — FlyteDeck (redsealion) and gvteway (opus-one) — made opposite tradeoffs.
FlyteDeck shipped deep feature modules (finance, procurement, AI) in a single web shell.
gvteway shipped three shells (internal console, external portals, mobile PWA) but shallow feature depth.
Neither is complete. We need a single IA applicable to either repo.

## Decision

Adopt six route groups:

- `(marketing)` — public
- `(auth)` — unauthenticated flows
- `(personal)` — `/me` self-service (any authed user)
- `(platform)` — `/console` internal operations
- `(portal)` — `/p/[slug]` external stakeholders, slug-scoped
- `(mobile)` — `/m` field PWA

`(portal)` and `(mobile)` are **separate shells**, not responsive variants. Different layouts, different auth, different offline rules. The `/auth/resolve` endpoint routes users to the correct shell based on persona.

All internal modules use a consistent `(hub)` list/detail/new triad. API is versioned under `/api/v1` with Zod + `apiOk/apiError/apiCreated` helpers.

## Consequences

- Three shells = three layouts to maintain. Accepted cost — the shell distinction is load-bearing for auth, nav, and offline.
- Slug-scoped portal namespace (`/p/[slug]`) prevents accidental leaking of internal data into external views.
- API versioning lets us iterate breaking changes under `/api/v2` later.
- Existing repos must migrate: FlyteDeck gains portals + mobile; gvteway gains marketing + feature depth. See §10 of `docs/ia/01-topology.md`.
