import type { Metadata, Viewport } from "next";
import {
  Inter,
  JetBrains_Mono,
  Space_Grotesk,
  // ATLVS kit typography ("Industrial Wide", 2026-06-07 revision).
  // Archivo at the wdth:125 expanded axis drives headings + metrics; Space
  // Grotesk drives body + UI; Space Mono drives eyebrows / IDs / coordinates;
  // Jost is reserved for the spaced crossbar-less wordmark. Big Shoulders +
  // Silkscreen (the retired cosmic display faces) are no longer loaded.
  Space_Mono,
  Jost,
  Archivo,
} from "next/font/google";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/app/theme/ThemeProvider";
import { themeScript, THEME_COOKIE_NAME } from "@/app/theme/theme-script";
import { isValidThemeSlug, colorSchemeFor } from "@/app/theme/themes.config";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { LiveRegionProvider } from "@/components/ui/LiveRegion";
import { CookieConsent } from "@/components/compliance/CookieConsent";
import { ShortcutDialog } from "@/components/ShortcutDialog";
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

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });
const spaceGrot = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });

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
// Archivo — kit canon heading face ("Industrial Wide"). Loaded as a variable
// font with the wdth axis so consumers can request the expanded register via
// `font-stretch: 125%`. weight=variable + axes=['wdth'] lets us slide both
// axes from CSS — heading rules pull weight 800 + stretch 125% to land on the
// kit's heavy expanded register. The body/UI face stays Space Grotesk.
const archivo = Archivo({
  subsets: ["latin"],
  weight: "variable",
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.baseUrl),
  title: {
    default: `${BRAND.legalName} — Production Runs On It`,
    template: `%s · ${BRAND.legalName}`,
  },
  description:
    "ATLVS · COMPVSS · GVTEWAY — proprietary production, workforce, and ticketing software from GHXSTSHIP. Three instruments, one connected bridge for experiential production at scale.",
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
    description: "ATLVS · GVTEWAY · COMPVSS — the Itinerary for cultural tastemakers.",
    siteName: BRAND.legalName,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.legalName,
    description: "ATLVS · GVTEWAY · COMPVSS — the Itinerary for cultural tastemakers.",
  },
  robots: { index: true, follow: true },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "ATLVS" },
};

export const viewport: Viewport = {
  // Audit T8 fix: was a single raw `#0A0A0A` that didn't reflect the actual
  // theme paint. Bermuda Triangle (HVRBOR-aligned) light paint is the cream
  // paper #F5F2EC; dark paint is near-black ink. Native mobile chrome (status
  // bar, app switcher) follows the user's OS preference.
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

  return (
    <html
      lang={locale}
      dir={dir}
      data-theme={ssrTheme}
      data-ui="saas"
      style={{ colorScheme: ssrColorScheme }}
      className={`h-full ${inter.variable} ${mono.variable} ${spaceGrot.variable} ${spaceMono.variable} ${jost.variable} ${archivo.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* M2-04 — Organization schema appears on every page so Google's
            knowledge panel can resolve the brand. Populates once at the root
            and inherits across every route. */}
        <StructuredData
          data={organization({
            name: BRAND.legalName,
            url: SITE.baseUrl,
            description:
              "ATLVS · GVTEWAY · COMPVSS — the Itinerary for cultural tastemakers. Production operations workspace, stakeholder portals, and mobile PWA for events, fabrication, and creative ops.",
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
                <div id="main" className="flex min-w-0 flex-1 flex-col">
                  {children}
                </div>
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
              // --p-accent-contrast is set per-platform overlay (white on
              // pink/cyan/blue/red, black on yellow under bermuda-triangle).
              actionButton: "bg-[var(--p-accent)] text-[var(--p-accent-contrast,white)]",
              cancelButton: "bg-[var(--p-surface-2)]",
            },
          }}
        />
        <script dangerouslySetInnerHTML={{ __html: swRegister }} />
      </body>
    </html>
  );
}
