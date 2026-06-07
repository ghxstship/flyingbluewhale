/**
 * ATLVS Technologies — pre-hydration theme bootstrap.
 *
 * This string MUST be injected into <head> as a blocking inline <script>
 * before any React code runs, to set [data-theme] + [data-mode] +
 * [data-ui="saas"] on <html> before first paint. Zero FOUC is a hard
 * requirement.
 *
 * One canonical theme: atlvs-product. The kit's `data-ui="saas"` selector
 * is set in parallel so kit-canon authoring works alongside the codebase's
 * `data-theme` convention.
 */

export const THEME_COOKIE_NAME = "chroma_theme";
export const THEME_STORAGE_KEY = "chroma.theme";
export const MODE_COOKIE_NAME = "atlvs_mode";
/** Legacy cookie name from the pre-brand-sweep era. Read-only fallback so
 * existing users keep their color-mode preference for one deploy cycle;
 * the canonical writer is `MODE_COOKIE_NAME` above. Remove after one
 * release. */
export const LEGACY_MODE_COOKIE_NAME = "fbw_mode";
export const MODE_STORAGE_KEY = "chroma.mode";
export const ACCENT_COOKIE_NAME = "atlvs_accent";
export const ACCENT_STORAGE_KEY = "atlvs.accent";

export const themeScript = `
(function() {
  try {
    var valid = ['atlvs-product'];
    var validModes = ['light','dark','system'];
    var validAccents = ['soft','default','vivid'];

    // Theme slug (palette) — single canonical kit skin. Stale cookie values
    // (from purged ghxstship / pre-v3 CHROMA slugs) fall through to the default.
    var c = document.cookie.match(/(?:^|;\\s*)${THEME_COOKIE_NAME}=([^;]+)/);
    var fromCookie = c ? decodeURIComponent(c[1]) : null;
    var stored = null;
    try { stored = localStorage.getItem('${THEME_STORAGE_KEY}'); } catch (_) { /* private mode */ }
    var picked = (fromCookie && valid.indexOf(fromCookie) > -1) ? fromCookie
               : (stored && valid.indexOf(stored) > -1) ? stored
               : 'atlvs-product';
    document.documentElement.setAttribute('data-theme', picked);
    // Kit canon selector — paint .ps-* primitives without having to scope
    // every selector to [data-theme="atlvs-product"].
    document.documentElement.setAttribute('data-ui', 'saas');

    // Color mode (light / dark / system → resolved).
    var systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var mc = document.cookie.match(/(?:^|;\\s*)${MODE_COOKIE_NAME}=([^;]+)/)
          || document.cookie.match(/(?:^|;\\s*)${LEGACY_MODE_COOKIE_NAME}=([^;]+)/);
    var modeFromCookie = mc ? decodeURIComponent(mc[1]) : null;
    var modeStored = null;
    try { modeStored = localStorage.getItem('${MODE_STORAGE_KEY}'); } catch (_) { /* private mode */ }
    var rawMode = (modeFromCookie && validModes.indexOf(modeFromCookie) > -1) ? modeFromCookie
                : (modeStored && validModes.indexOf(modeStored) > -1) ? modeStored
                : 'system';
    var resolvedMode = rawMode === 'system'
      ? (systemPrefersDark ? 'dark' : 'light')
      : rawMode;
    document.documentElement.setAttribute('data-mode', resolvedMode);

    // Accent intensity — kit axis (soft / default / vivid). Cookie + storage only.
    var ac = document.cookie.match(/(?:^|;\\s*)${ACCENT_COOKIE_NAME}=([^;]+)/);
    var accentFromCookie = ac ? decodeURIComponent(ac[1]) : null;
    var accentStored = null;
    try { accentStored = localStorage.getItem('${ACCENT_STORAGE_KEY}'); } catch (_) { /* private mode */ }
    var accent = (accentFromCookie && validAccents.indexOf(accentFromCookie) > -1) ? accentFromCookie
               : (accentStored && validAccents.indexOf(accentStored) > -1) ? accentStored
               : 'default';
    if (accent !== 'default') document.documentElement.setAttribute('data-accent', accent);

    // colorScheme — atlvs-product is light-family; dark mode overrides
    // come from [data-mode="dark"] selectors in the theme CSS.
    document.documentElement.style.colorScheme = resolvedMode === 'dark' ? 'dark' : 'light';
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'atlvs-product');
    document.documentElement.setAttribute('data-ui', 'saas');
    document.documentElement.setAttribute('data-mode', 'light');
    document.documentElement.style.colorScheme = 'light';
  }
})();
`.trim();
