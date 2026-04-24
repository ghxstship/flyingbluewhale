/**
 * CHROMA BEACON — pre-hydration theme bootstrap.
 * This string MUST be injected into <head> as a blocking inline <script>
 * before any React code runs, to set [data-theme] + [data-mode] on <html>
 * before first paint. Zero FOUC is a hard requirement.
 */

export const THEME_COOKIE_NAME = "chroma_theme";
export const THEME_STORAGE_KEY = "chroma.theme";
export const MODE_COOKIE_NAME = "fbw_mode";
export const MODE_STORAGE_KEY = "chroma.mode";

export const themeScript = `
(function() {
  try {
    var valid = ['glass','brutal','bento','kinetic','copilot','cyber','soft','earthy'];
    var validModes = ['light','dark','system'];

    // Theme slug (palette)
    var c = document.cookie.match(/(?:^|;\\s*)${THEME_COOKIE_NAME}=([^;]+)/);
    var fromCookie = c ? decodeURIComponent(c[1]) : null;
    var stored = null;
    try { stored = localStorage.getItem('${THEME_STORAGE_KEY}'); } catch (e) {}
    var systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var picked = (fromCookie && valid.indexOf(fromCookie) > -1) ? fromCookie
               : (stored && valid.indexOf(stored) > -1) ? stored
               : (systemPrefersDark ? 'cyber' : 'kinetic');
    document.documentElement.setAttribute('data-theme', picked);

    // Color mode (light / dark / system → resolved)
    var mc = document.cookie.match(/(?:^|;\\s*)${MODE_COOKIE_NAME}=([^;]+)/);
    var modeFromCookie = mc ? decodeURIComponent(mc[1]) : null;
    var modeStored = null;
    try { modeStored = localStorage.getItem('${MODE_STORAGE_KEY}'); } catch (e) {}
    var rawMode = (modeFromCookie && validModes.indexOf(modeFromCookie) > -1) ? modeFromCookie
                : (modeStored && validModes.indexOf(modeStored) > -1) ? modeStored
                : 'system';
    var resolvedMode = rawMode === 'system'
      ? (systemPrefersDark ? 'dark' : 'light')
      : rawMode;
    document.documentElement.setAttribute('data-mode', resolvedMode);
    document.documentElement.style.colorScheme = resolvedMode;
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'kinetic');
    document.documentElement.setAttribute('data-mode', 'light');
    document.documentElement.style.colorScheme = 'light';
  }
})();
`.trim();
