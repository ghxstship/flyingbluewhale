# flyingbluewhale

Unified production platform scaffolded against the optimized IA shared with FlyteDeck (redsealion) and gvteway (opus-one).

## Shell topology

```
src/app/
├── (marketing)/   Public, SEO-indexed
├── (auth)/        Unauthenticated + invite/token flows
├── (personal)/    Self-service account area (/me)
├── (platform)/    Internal operations console (/console)
├── (portal)/      External stakeholder workspaces (/p/[slug])
├── (mobile)/      Field PWA (/m)
└── api/v1/        Versioned API
```

See [docs/ia/01-topology.md](docs/ia/01-topology.md) for the full IA, [docs/ia/02-route-inventory.md](docs/ia/02-route-inventory.md) for the route list, [docs/api/v1-contract.md](docs/api/v1-contract.md) for the API contract, and [docs/decisions/ADR-0001-three-shell-topology.md](docs/decisions/ADR-0001-three-shell-topology.md) for the rationale.

## Scripts

```
npm install
npm run dev        # next dev
npm run build
npm run typecheck
npm run lint

bash scripts/generate-stubs.sh   # materialize new routes.txt entries
```

## Project-specific notes for AI agents

See [CLAUDE.md](CLAUDE.md).
