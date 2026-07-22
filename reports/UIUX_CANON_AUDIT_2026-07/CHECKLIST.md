# UI/UX canonization audit — shared checklist (2026-07-22)

Every lane report audits its files against these canons. Findings cite
path:line, class ID (below), the canon rule, a suggested remediation, effort
(S/M/L), and user-visible risk. Repeated patterns are deduped: one finding
row + the full file list. Read-only audit; no remediation in this phase.

## Classes
- **TYPE** Typography: bare h1-h4 on the --p-fs ramp; NO hand-set `text-Nxl font-bold tracking-tight`; .hed-*/.eyebrow/.ps-body|lead|small|caption; faces per MONUMENT v8.0 (Bebas h1/h2 via ramp, Anton display+metrics ONLY, Hanken body/h3/h4, Space Mono eyebrows/IDs, IBM Plex Mono data); 11px floor; tabular-nums in .ps-table cells + .ps-id + metric values.
- **TOKEN** Color: no raw hex/rgb/hsl in JSX or tailwind arbitrary values outside sanctioned spots (page-scoped brand moments documented as such); surfaces/text/borders from --p-*; accents via data-product ownership; semantic tones via --p-{success,warning,danger,info}(-text); charts via --chart-*; retired vocab (--bg, --surface, --accent, --org-*, .badge-*) must not reappear.
- **GRID** Spacing/radius/elevation: 4px grid (--p-* / --k-* density); radii --p-r-md/--p-r-xl (modals/sheets xl); elevation --p-elev-xs..2xl; flag off-grid px literals in classes/styles (repo canon: some off-grid font/radius values are NOT violations — check docs/compvss decisions before flagging COMPVSS kit values).
- **COMP** Component vocabulary: Button/.ps-btn variants (incl. --cta) over ad-hoc; Input/.ps-input (+--sm/--lg); Badge → .ps-badge--{ok,warn,danger,info,neutral,accent}; StatusBadge/StatusChip/DueDateBadge for states; .ps-table numeric/--sticky/--zebra; EmptyState (teaches first action); Skeleton family + loading.tsx; Card/MetricCard; FormShell + useActionState State shape; native <select className="ps-input"> in server forms, Radix Select only in controlled clients, Combobox for async.
- **PAT** Interaction patterns: filter pills = context field NEVER status (status = row badge + drawer + board columns); list honesty (no fabricated counts); every list row opens a real detail; DataView/NormalizedList/OpsLedgerConfig on COMPVSS; ModuleHeader + PlatformTabsAuto on /studio; RecordTabs on detail pages; overlay z-ladder; press-scale/hover-lift utilities over ad-hoc transforms.
- **VOICE** Copy: NO em/en dashes (restructure); no emoji; no AI-slop triads or "X, not Y" antithesis; concrete over adjective; no competitor names outside comparison data files; eyebrow casing conventions; sentence-vs-Title-Case consistency per surface.
- **A11Y** aria-label on icon-only buttons; focus-visible via --p-focus; AA contrast pairs from tokens.json#contrast; scrim + Escape + focus-trap on drawers/sheets; prefers-reduced-motion honored on animation; aria-live on async result regions; htmlFor/id on every input; 44px touch targets on mobile surfaces.
- **I18N** User-facing strings t()-wrapped (3-arg fallback pattern); no hardcoded English in shared components; template-literal keys avoided (extractor-invisible) unless catalog keys exist.
- **NAV** Cross-shell URLs via urlFor(); nav.ts SSOT respected (no hardcoded rails); sitemap-EXEMPT reasons for non-navigable routes.

## Report format (per lane)
`reports/UIUX_CANON_AUDIT_2026-07/<lane>.md`:
1. Coverage statement: files walked / total in lane (must be 100%).
2. Summary table: class × count × top offenders.
3. Findings: `| # | class | path:line | rule | suggested fix | effort | risk |` — deduped patterns carry the full file list in a collapsible block.
4. Canon-positive notes: surfaces already exemplary (the plan will use them as reference implementations).
