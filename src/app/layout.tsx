import type { Metadata, Viewport } from "next";
import {
  // ATLVS kit typography — "MONUMENT · Wired Scale" (Type v8.0, 2026-07-05).
  // Bebas Neue — a tall condensed caps face, cleaner than Anton at UI sizes —
  // drives the semantic heading stack (h1/h2 + card/section/record/nav titles);
  // Anton is now reserved for DISPLAY + METRICS only (.ps-hero / .hed-* / KPI
  // numbers); Hanken Grotesk drives body + UI + h3/h4; Space Mono drives
  // eyebrows / IDs; Jost is the spaced crossbar-less wordmark. The retired
  // faces (Archivo, Space Grotesk, Inter, JetBrains Mono) stay unloaded;
  // `design-system.test.ts` guards against their return. The six trend display
  // faces load lazily via kit-trends.css `@font-face` — not on the core path.
  Anton,
  Bebas_Neue,
  Hanken_Grotesk,
  Space_Mono,
  Jost,
  // The COMPVSS Rose lockup — the script half of "COMPVSS Rose" on the
  // credential card. The kit loads it from Google Fonts (kit 28
  // apps/field/index.html:9); the repo referenced it in RoseCard and the
  // onboarding and never loaded it, so it fell back to the browser's generic
  // cursive and the card read as unfinished. Rose lockup only — not a text face.
  Pinyon_Script,
  // LEG3ND "legend" type axis (v5) — Airport (Matthew Carter's London Airport
  // signage face) is LICENSED (Revolver Type) and mounted via @font-face when
  // obtained; until then the legend type degrades to these fallbacks.
  // Fira Sans ≈ Airport X (humanist signage body); IBM Plex Mono = data face.
  Fira_Sans,
  IBM_Plex_Mono,
} from "next/font/google";
import { cookies, headers } from "next/headers";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/app/theme/ThemeProvider";
import { themeScript, THEME_COOKIE_NAME } from "@/app/theme/theme-script";
import { isValidThemeSlug, colorSchemeFor } from "@/app/theme/themes.config";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { LiveRegionProvider } from "@/components/ui/LiveRegion";
import { CookieConsent } from "@/components/compliance/CookieConsent";
import { ShortcutDialog } from "@/components/ShortcutDialog";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { isRtl } from "@/lib/i18n/config";
import { BRAND } from "@/lib/brand";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { getRequestT } from "@/lib/i18n/request";
import { getRequestFormatters } from "@/lib/i18n/request";
import { loadMessages } from "@/lib/i18n/server";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { StructuredData, organization } from "@/lib/seo/structured-data";
import { SITE } from "@/lib/seo";
import "./globals.css";
import "./theme/index.css";

// Anton — MONUMENT display face. Single black weight, already condensed
// (no width axis). Drives every heading + metric via --p-heading; rendered
// ALL-CAPS by --p-display-case in the kit theme.
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton", display: "swap" });
// Bebas Neue — MONUMENT heading face (Type v8.0). Single 400 weight, tall
// condensed caps. Resolves --p-heading; reads slightly positive tracking
// (--p-heading-ls) at UI sizes. Anton stays for display/metrics only.
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-bebas-neue", display: "swap" });
// Hanken Grotesk — MONUMENT body/UI face. Variable weight covers 400–800 for
// labels, tables, and forms. Resolves --p-font / --font-body.
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken-grotesk", display: "swap" });
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});
// Jost — wordmark face only. Light weights for the crossbar-less spaced caps.
const pinyon = Pinyon_Script({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pinyon",
  display: "swap",
});
const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jost",
  display: "swap",
});
// LEG3ND "legend" type-axis fallbacks (Airport is licensed/mounted separately).
const firaSans = Fira_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-fira-sans",
  display: "swap",
});
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.baseUrl),
  title: {
    default: `${BRAND.legalName} · ${BRAND.tagline}`,
    template: `%s · ${BRAND.legalName}`,
  },
  description:
    "The production ecosystem from GHXSTSHIP: ATLVS, COMPVSS, GVTEWAY, and LEG3ND on one manifest, from the pitch through show day to the record that outlives the load-out.",
  keywords: [
    "production management",
    "live events",
    "fabrication",
    "advancing",
    "ticketing",
    "PWA",
    "ATLVS",
    "GVTEWAY",
    "COMPVSS",
    BRAND.legalName,
  ],
  // The PWA manifest is COMPVSS-only (start_url/scope /m, signal-yellow
  // theme_color). It's declared by the (mobile) layout's metadata so the
  // other shells don't advertise an installable app that opens /m.
  // Favicon/touch-icon wiring — src/app/icon.svg auto-loads via Next.js
  // convention for the standard favicon. The apple-touch-icon is a real
  // 180px PNG: iOS Safari does NOT render SVG touch icons (the previous
  // SVG pointer produced a screenshot-letter tile on home-screen
  // installs). The shortcut icon points at the bare ink mark for the
  // 16px browser-tab affordance per the v4 logo-kit canon.
  icons: {
    icon: "/icon.svg",
    shortcut: "/brand/atlvs-mark.svg",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: BRAND.legalName,
    description: "ATLVS · COMPVSS · GVTEWAY · LEG3ND: the engine behind new worlds.",
    siteName: BRAND.legalName,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.legalName,
    description: "ATLVS · COMPVSS · GVTEWAY · LEG3ND: the engine behind new worlds.",
  },
  robots: { index: true, follow: true },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "ATLVS" },
};

export const viewport: Viewport = {
  // Audit T8 fix: was a single raw `#0A0A0A` that didn't reflect the actual
  // theme paint. The v8.1 kit light paint is the neutral page bg #F7F8FA; dark
  // paint is the base ink #111318. Native mobile chrome (status bar, app
  // switcher) follows the user's OS preference.
  themeColor: [
    // ATLVS kit canon — --p-bg light / --p-bg dark. Native mobile chrome
    // (status bar, app switcher) matches the kit's neutral canvas.
    { media: "(prefers-color-scheme: light)", color: "#f7f8fa" },
    { media: "(prefers-color-scheme: dark)", color: "#111318" },
  ],
  width: "device-width",
  initialScale: 1,
};

// COMPVSS is the offline-first PWA shell. ATLVS (workspace) and GVTEWAY
// (portal) don't need a service worker — registering one there would steal
// the SW scope and break offline behavior on compvss when a user visits
// multiple shells from the same browser. Path-prefix mode (no subdomains)
// also runs on /m/* — match either the host OR the path so the right shell
// always gets the SW.
const swRegister =
  process.env.NODE_ENV === "production"
    ? `(function(){if(!('serviceWorker' in navigator))return;var h=location.hostname,p=location.pathname;var isMobile=h.indexOf('compvss.')===0||p==='/m'||p.indexOf('/m/')===0;if(!isMobile){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});});return;}window.addEventListener('load',function(){navigator.serviceWorker.register('/service-worker.js').catch(function(){});});})();`
    : `if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});});}`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [{ t, messages }, formatters] = await Promise.all([getRequestT(), getRequestFormatters()]);
  const { locale, bcp47, timezone, currency } = formatters.settings;
  const dir = isRtl(locale) ? "rtl" : "ltr";
  // Load English fallback once for the client `useT()` hook so partial
  // locale catalogs degrade gracefully on the client too.
  const fallbackMessages = locale === DEFAULT_LOCALE ? {} : await loadMessages(DEFAULT_LOCALE);

  // SSR theme from cookie (survives first paint with the right tokens).
  // Client head script reconciles with localStorage on mount. Default is
  // the canonical kit skin — stale ghxstship cookies fall through.
  const cs = await cookies();
  const cookieTheme = cs.get(THEME_COOKIE_NAME)?.value;
  const ssrTheme = isValidThemeSlug(cookieTheme) ? cookieTheme : "atlvs-product";
  const ssrColorScheme = colorSchemeFor(ssrTheme);

  // Per-request CSP nonce, minted in src/proxy.ts and forwarded on the request
  // headers. Stamped onto the two inline bootstrap scripts below so they
  // satisfy `script-src 'nonce-<n>'` without the production CSP needing
  // 'unsafe-inline'. Undefined in contexts with no middleware (e.g. tests).
  //
  // The two <script nonce> tags below carry `suppressHydrationWarning`. Per the
  // CSP spec the browser HIDES the nonce: on insertion it blanks the content
  // attribute (so it can't be exfiltrated with a CSS attribute selector) and
  // keeps the value only on the `.nonce` IDL property. React hydrates against
  // the content attribute, reads "", compares it to the real nonce in the
  // payload and reports an attribute mismatch — on EVERY page load, in every
  // shell. Verified in-browser: getAttribute("nonce") === "" while
  // script.nonce === "<the nonce>", so CSP still matches and the scripts run.
  // React says "this won't be patched up" (attribute mismatches don't trigger
  // recovery or a client re-render), so the warning is pure console noise that
  // buries real hydration errors. Suppressing is the sanctioned escape hatch
  // for a legitimate server/client difference; it changes no CSP behaviour.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang={locale}
      dir={dir}
      data-theme={ssrTheme}
      data-ui="saas"
      style={{ colorScheme: ssrColorScheme }}
      className={`h-full ${anton.variable} ${bebas.variable} ${hanken.variable} ${spaceMono.variable} ${jost.variable} ${pinyon.variable} ${firaSans.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* M2-04 — Organization schema appears on every page so Google's
            knowledge panel can resolve the brand. Populates once at the root
            and inherits across every route. */}
        <StructuredData
          data={organization({
            name: BRAND.legalName,
            url: SITE.baseUrl,
            description: SITE.description,
            logo: `${SITE.baseUrl}/og/logo.png`,
          })}
        />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <a href="#main" className="skip-link">
          {t("a11y.skipToContent")}
        </a>
        <LocaleProvider
          value={{
            locale,
            bcp47,
            timezone,
            currency,
            messages,
            fallbackMessages,
          }}
        >
          <ThemeProvider>
            <TooltipProvider delayDuration={350}>
              <LiveRegionProvider>
                {/* AX-1 — this wrapper previously carried id="main", which made
                    the skip link land on the WHOLE shell (nav included) and
                    duplicated the (platform) layout's <main id="main">. Each
                    shell layout's <main id="main" tabIndex={-1}> is the skip
                    target now. */}
                {/* Dev "Act As" banner — universal across every shell so the
                    Exit control is always reachable while impersonating. Renders
                    nothing for ordinary (non-impersonated) sessions. */}
                <ImpersonationBanner />
                <div className="flex min-w-0 flex-1 flex-col">{children}</div>
                <CookieConsent />
                <ShortcutDialog />
              </LiveRegionProvider>
            </TooltipProvider>
          </ThemeProvider>
        </LocaleProvider>
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          theme="system"
          toastOptions={{
            classNames: {
              toast: "group toast",
              title: "font-medium",
              description: "text-[var(--p-text-2)]",
              // Audit T7 fix: text-white was a raw value bypassing tokens.
              // --p-accent-contrast is set per-product overlay (white on
              // ATLVS red + GVTEWAY blue, near-ink on COMPVSS yellow).
              actionButton: "bg-[var(--p-accent)] text-[var(--p-accent-contrast,white)]",
              cancelButton: "bg-[var(--p-surface-2)]",
            },
          }}
        />
        <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: swRegister }} />
      </body>
    </html>
  );
}
