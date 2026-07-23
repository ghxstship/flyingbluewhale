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
// Type axis (v5) — Monument (default) ↔ LEG3ND airport-signage. Persisted
// like accent; applied as data-type on <html> (omitted when "monument").
export const TYPE_COOKIE_NAME = "atlvs_type";
export const TYPE_STORAGE_KEY = "atlvs.type";
// Trend axis (v8.1) — end-user PERSONALIZATION skin, orthogonal to every other
// axis. Re-skins shape/elevation/motion/expression, hue-locked to the product
// accent. Default = none (no attribute → the Monument base). Applied as
// data-trend on <html> (omitted when "none").
export const TREND_COOKIE_NAME = "atlvs_trend";
export const TREND_STORAGE_KEY = "atlvs.trend";

export const themeScript = `
(function() {
  try {
    var valid = ['atlvs-product'];
    var validModes = ['light','dark','system'];
    var validAccents = ['soft','default','vivid'];
    var validTypes = ['monument','legend'];
    var validTrends = ['immersive','experimental','dopamine','bold-type','dark','motion','gamified','neumorphic','synthwave','maximalist','collage','brutalist','sustainable'];

    // Theme slug (palette): single canonical kit skin. Stale cookie values
    // (from purged ghxstship / pre-v3 CHROMA slugs) fall through to the default.
    var c = document.cookie.match(/(?:^|;\\s*)${THEME_COOKIE_NAME}=([^;]+)/);
    var fromCookie = c ? decodeURIComponent(c[1]) : null;
    var stored = null;
    try { stored = localStorage.getItem('${THEME_STORAGE_KEY}'); } catch (_) { /* private mode */ }
    var picked = (fromCookie && valid.indexOf(fromCookie) > -1) ? fromCookie
               : (stored && valid.indexOf(stored) > -1) ? stored
               : 'atlvs-product';
    document.documentElement.setAttribute('data-theme', picked);
    // Kit canon selector: paint .ps-* primitives without having to scope
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

    // Accent intensity: kit axis (soft / default / vivid). Cookie + storage only.
    var ac = document.cookie.match(/(?:^|;\\s*)${ACCENT_COOKIE_NAME}=([^;]+)/);
    var accentFromCookie = ac ? decodeURIComponent(ac[1]) : null;
    var accentStored = null;
    try { accentStored = localStorage.getItem('${ACCENT_STORAGE_KEY}'); } catch (_) { /* private mode */ }
    var accent = (accentFromCookie && validAccents.indexOf(accentFromCookie) > -1) ? accentFromCookie
               : (accentStored && validAccents.indexOf(accentStored) > -1) ? accentStored
               : 'default';
    if (accent !== 'default') document.documentElement.setAttribute('data-accent', accent);

    // Type axis (v5): monument (default) / legend. Cookie + storage only.
    var tc = document.cookie.match(/(?:^|;\\s*)${TYPE_COOKIE_NAME}=([^;]+)/);
    var typeFromCookie = tc ? decodeURIComponent(tc[1]) : null;
    var typeStored = null;
    try { typeStored = localStorage.getItem('${TYPE_STORAGE_KEY}'); } catch (_) { /* private mode */ }
    var typeAxis = (typeFromCookie && validTypes.indexOf(typeFromCookie) > -1) ? typeFromCookie
                 : (typeStored && validTypes.indexOf(typeStored) > -1) ? typeStored
                 : 'monument';
    if (typeAxis !== 'monument') document.documentElement.setAttribute('data-type', typeAxis);

    // Trend axis (v8.1): personalization skin. Cookie + storage only; omitted
    // when 'none' so the Monument base renders by default.
    var rc = document.cookie.match(/(?:^|;\\s*)${TREND_COOKIE_NAME}=([^;]+)/);
    var trendFromCookie = rc ? decodeURIComponent(rc[1]) : null;
    var trendStored = null;
    try { trendStored = localStorage.getItem('${TREND_STORAGE_KEY}'); } catch (_) { /* private mode */ }
    var trend = (trendFromCookie && validTrends.indexOf(trendFromCookie) > -1) ? trendFromCookie
              : (trendStored && validTrends.indexOf(trendStored) > -1) ? trendStored
              : 'none';
    // Trend CSS (23KB, kit-trends.css) is NOT on the core path; CLAUDE.md
    // requires it "never on the core path". It loads as a <link> ONLY when a
    // non-default trend is active. Injecting it here (pre-hydration, in <head>)
    // keeps it FOUC-free for users who have already picked a trend; the runtime
    // add/remove is mirrored in ThemeProvider when the user changes trend. The
    // stylesheet + its self-hosted display fonts satisfy CSP (style-src/font-src
    // 'self'); a <link> needs no nonce.
    if (trend !== 'none') {
      document.documentElement.setAttribute('data-trend', trend);
      if (!document.getElementById('atlvs-trend-css')) {
        var trendLink = document.createElement('link');
        trendLink.id = 'atlvs-trend-css';
        trendLink.rel = 'stylesheet';
        trendLink.href = '/theme/kit-trends.css';
        document.head.appendChild(trendLink);
      }
    }

    // colorScheme: atlvs-product is light-family; dark mode overrides
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
