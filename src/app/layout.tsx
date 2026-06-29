import type { Metadata, Viewport } from "next";
import {
  // ATLVS kit typography — "MONUMENT" (RATIFIED 2026-06-13, supersedes
  // "Industrial Wide"). Anton — an ultra-condensed all-caps display face —
  // drives headings + metrics; Hanken Grotesk drives body + UI; Space Mono
  // drives eyebrows / IDs / coordinates; Jost is reserved for the spaced
  // crossbar-less wordmark. The retired faces (Archivo, Space Grotesk, Inter,
  // JetBrains Mono — and the cosmic Big Shoulders / Silkscreen) are no longer
  // loaded; `design-system.test.ts` guards against their return.
  Anton,
  Hanken_Grotesk,
  Space_Mono,
  Jost,
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
  manifest: "/manifest.json",
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
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang={locale}
      dir={dir}
      data-theme={ssrTheme}
      data-ui="saas"
      style={{ colorScheme: ssrColorScheme }}
      className={`h-full ${anton.variable} ${hanken.variable} ${spaceMono.variable} ${jost.variable} ${firaSans.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
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
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: swRegister }} />
      </body>
    </html>
  );
}
