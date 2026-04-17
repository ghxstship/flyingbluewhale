# ADR-0001: Three-Shell Topology

**Status:** Accepted  
**Date:** 2026-04-16  
**Decision Makers:** Platform Architecture Team

## Context

The platform serves multiple distinct user personas — internal operations teams, external stakeholders (artists, vendors, clients, sponsors, guests), and field operations crews. Each persona has fundamentally different:

- **Navigation patterns** — sidebar console vs. top-bar portal vs. bottom-tab mobile
- **Auth requirements** — org-scoped vs. project-scoped vs. unauthenticated
- **UX constraints** — desktop-first vs. mobile-first vs. offline-first
- **Data boundaries** — cross-project vs. slug-scoped vs. geo-verified

## Decision

Adopt a **three-shell topology** using Next.js App Router route groups:

1. **`(platform)`** — Internal operations console (`/console/*`) with sidebar navigation, org-scoped auth, and full feature depth.
2. **`(portal)`** — External stakeholder workspaces (`/p/[slug]/*`) with top-bar layout, project-scoped auth, and persona-specific views.
3. **`(mobile)`** — Field PWA (`/m/*`) with bottom tab bar, offline-first architecture, and camera/geo permissions.

Plus supporting shells:
- **`(auth)`** — Unauthenticated flows
- **`(personal)`** — Self-service account area (`/me/*`)
- **`(marketing)`** — Public, SEO-indexed, no auth

## Consequences

### Benefits
- Each shell has its own layout, middleware isolation, and navigation pattern
- Route groups carry no URL segment — clean URLs without layout coupling
- External portals never leak internal navigation
- Mobile shell can be deployed as standalone PWA with its own manifest scope

### Trade-offs
- More layout files to maintain (one per shell)
- Shared components must be parameterized for cross-shell use
- URL restructuring from the legacy flat pattern requires 308 redirects
