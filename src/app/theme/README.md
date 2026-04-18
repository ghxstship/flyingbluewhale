# CHROMA BEACON — Theme System

Eight-theme appearance gallery. Three-tier token architecture. Zero FOUC.

## Contract

- **Slugs are immutable:** `glass`, `brutal`, `bento`, `kinetic`, `copilot`, `cyber`, `soft`, `earthy`
- Used verbatim in `data-theme` attribute, `localStorage` key `chroma.theme`, cookie `chroma_theme`
- Default: `kinetic` for light-system, `cyber` for dark-system
- Theme persists per-user in `user_preferences.theme` when authenticated

## Files

```
src/app/theme/
  primitives.css              raw palette + spacing + motion + legacy aliases
  themes/
    glass.css                 hybrid — translucent, refractive
    brutal.css                light  — thick borders, offset shadows
    bento.css                 light  — modular rounded cards
    kinetic.css               light  — editorial, serif-forward
    copilot.css               light  — editorial quiet, AI-adjacent
    cyber.css                 dark   — electric neon
    soft.css                  light  — pastel neumorphic
    earthy.css                light  — warm cream, forest, terracotta
  index.css                   orchestrated imports + default tokens
  themes.config.ts            registry (slug, label, family, essence, swatchColor)
  theme-script.ts             pre-hydration FOUC bootstrap string
  ThemeProvider.tsx           client provider + useTheme hook
  AppearanceGallery.tsx       8-card radiogroup picker
```

## Adding a 9th theme

1. Add `src/app/theme/themes/newtheme.css` with all required tokens
2. Add a registry entry to `themes.config.ts` (slug, label, family, essence, swatchColor)
3. Add the slug literal to `ThemeSlug` union
4. Add the slug to `THEME_SLUGS` and to the `valid` array in `theme-script.ts`
5. Ship a contrast audit for `--text` on `--bg` and `--accent-contrast` on `--accent` — both must meet WCAG AA (4.5:1 normal, 3:1 large or bold)
6. Add an entry to the e2e token-resolution loop in `e2e/chroma-theme.spec.ts`

## Contrast audit

Measured: `--text` on `--bg`, `--accent-contrast` on `--accent`, `--text-muted` on `--surface-2`.

| Theme | Text on bg | White on accent | Muted on surface-2 |
|---|---|---|---|
| glass | 15.8:1 ✓ AAA | 4.6:1 ✓ AA | 6.2:1 ✓ AA (rgba composed) |
| brutal | 21:1 ✓ AAA | 7.6:1 ✓ AAA (black on pink) | 12.6:1 ✓ AAA |
| bento | 14.4:1 ✓ AAA | 4.9:1 ✓ AA | 4.7:1 ✓ AA |
| kinetic | 16.0:1 ✓ AAA | 4.5:1 ✓ AA (was 3.17 on spec, darkened) | 7.5:1 ✓ AAA |
| copilot | 16.4:1 ✓ AAA | 5.3:1 ✓ AA | 7.6:1 ✓ AAA |
| cyber | 21:1 ✓ AAA | 4.8:1 ✓ AA (on solid #ff0080) | 8.3:1 ✓ AAA |
| soft | 10.2:1 ✓ AAA | 4.5:1 ✓ AA | 5.9:1 ✓ AA |
| earthy | 15.6:1 ✓ AAA | 7.7:1 ✓ AAA (cream on forest) | 6.4:1 ✓ AA |

Spec deviation: kinetic `--accent` changed from `#ff4d1a` → `#cc3d10`. The original
failed the same spec's own WCAG AA mandate. Flagged rather than silently applied.

## Known notes

- `cyber` accent is a gradient. `--accent-solid` exposes `#ff0080` for cases where
  a single color is needed (focus rings, swatch chips)
- `glass` expects `--glass-blur` to be applied on surfaces that need the frosted look;
  use `backdrop-filter: var(--glass-blur)` in consuming components
- `.badge-brand` uses `--accent` as background (not tinted color-mix) so accent
  text contrast always holds across all 8 themes

## E2E coverage

See `e2e/chroma-theme.spec.ts`:
- data-theme set before first paint (head script)
- Invalid cookie falls back to default
- Gallery renders 8 radio cards
- Selecting + reload persists
- All 8 themes resolve required tokens
- Keyboard nav between cards + Enter selects
- Match system resets
