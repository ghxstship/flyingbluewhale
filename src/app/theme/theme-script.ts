/**
 * CHROMA BEACON — pre-hydration theme bootstrap.
 * This string MUST be injected into <head> as a blocking inline <script>
 * before any React code runs, to set [data-theme] on <html> before first
 * paint. Zero FOUC is a hard requirement.
 */

export const THEME_COOKIE_NAME = "chroma_theme";
export const THEME_STORAGE_KEY = "chroma.theme";

export const themeScript = `
(function() {
  try {
    var valid = ['glass','brutal','bento','kinetic','copilot','cyber','soft','earthy'];
    var c = document.cookie.match(/(?:^|;\\s*)${THEME_COOKIE_NAME}=([^;]+)/);
    var fromCookie = c ? decodeURIComponent(c[1]) : null;
    var stored = null;
    try { stored = localStorage.getItem('${THEME_STORAGE_KEY}'); } catch (e) {}
    var picked = (fromCookie && valid.indexOf(fromCookie) > -1) ? fromCookie
               : (stored && valid.indexOf(stored) > -1) ? stored
               : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'cyber' : 'kinetic');
    document.documentElement.setAttribute('data-theme', picked);
    document.documentElement.style.colorScheme = (picked === 'cyber' || picked === 'glass') ? 'dark' : 'light';
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'kinetic');
    document.documentElement.style.colorScheme = 'light';
  }
})();
`.trim();
