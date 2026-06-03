/**
 * CHROMA BEACON — pre-hydration theme bootstrap.
 * This string MUST be injected into <head> as a blocking inline <script>
 * before any React code runs, to set [data-theme] + [data-mode] on <html>
 * before first paint. Zero FOUC is a hard requirement.
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

export const themeScript = `
(function() {
  try {
    var valid = ['ghxstship','bermuda-triangle','glass','brutal','bento','kinetic','copilot','cyber','soft','earthy'];
    var validModes = ['light','dark','system'];
    // Themes whose family is intrinsically dark (mirrors
    // colorSchemeFor() in src/app/theme/themes.config.ts). The script
    // and the SSR helper MUST agree — if SSR puts color-scheme=dark
    // and the client bootstrap then overwrites it with light, the
    // page flashes light scrollbars + form controls before the React
    // tree hydrates. Hard-code the list rather than ship a JSON blob.
    var darkThemes = ['ghxstship','cyber','glass'];

    // Theme slug (palette). Default = ghxstship (Deep Space Voyage) —
    // the GHXSTSHIP canon since the rebrand. Falls back to legacy
    // bermuda-triangle only via cookie/localStorage override.
    var c = document.cookie.match(/(?:^|;\\s*)${THEME_COOKIE_NAME}=([^;]+)/);
    var fromCookie = c ? decodeURIComponent(c[1]) : null;
    var stored = null;
    // localStorage throws in private browsing; ignore and fall back to system preference.
    try { stored = localStorage.getItem('${THEME_STORAGE_KEY}'); } catch (_) { /* private mode */ }
    var systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var picked = (fromCookie && valid.indexOf(fromCookie) > -1) ? fromCookie
               : (stored && valid.indexOf(stored) > -1) ? stored
               : 'ghxstship';
    document.documentElement.setAttribute('data-theme', picked);

    // Color mode (light / dark / system → resolved). Read the canonical
    // cookie first; fall back to the pre-brand-sweep name so existing
    // installs don't lose their preference on the deploy that ships the
    // rename. ThemeProvider rewrites under the canonical name on next mount.
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
    // colorScheme follows the theme's intrinsic family — dark themes
    // (cyber, glass) get dark scrollbars + form controls regardless of
    // the user's mode preference. This matches the SSR layout.tsx
    // behavior (colorSchemeFor()) so there's no flash on hydration.
    var themeColorScheme = darkThemes.indexOf(picked) > -1 ? 'dark' : 'light';
    document.documentElement.style.colorScheme = themeColorScheme;
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'ghxstship');
    document.documentElement.setAttribute('data-mode', 'dark');
    document.documentElement.style.colorScheme = 'dark';
  }
})();
`.trim();
