import type { Metadata, Viewport } from "next";
import {
  Inter,
  JetBrains_Mono,
  Cormorant_Garamond,
  // CHROMA BEACON theme typography — loaded once, consumed per palette via
  // `--font-body` / `--font-display` in each theme's CSS.
  Fraunces,
  Instrument_Serif,
  DM_Serif_Display,
  Bricolage_Grotesque,
  Space_Grotesk,
  Geist,
  Geist_Mono,
  // Bermuda Triangle typography — aligned with HVRBOR.CLUB brand stack:
  // Anton (display), Bebas Neue (subdisplay), DM Sans (body/UI),
  // Share Tech Mono (data / labels / eyebrows).
  Anton,
  Bebas_Neue,
  Share_Tech, // retained for legacy CHROMA themes that opt in
  Share_Tech_Mono,
  DM_Sans,
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
import { getRequestLocale } from "@/lib/i18n/server";
import { isRtl } from "@/lib/i18n/config";
import { StructuredData, organization } from "@/lib/seo/structured-data";
import "./globals.css";
import "./theme/index.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-serif",
  display: "swap",
});

// CHROMA BEACON theme fonts — the CSS variable names match what each theme's
// `--font-display` / `--font-body` declarations reference.
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});
const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif-display",
  display: "swap",
});
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const spaceGrot = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

// Bermuda Triangle — HVRBOR-aligned brand stack.
// Anton (display) + Bebas Neue (subdisplay) + DM Sans (body) + Share Tech Mono (data).
// Share Tech (regular) is retained as a CSS variable for legacy theme escapes;
// active body type is DM Sans.
const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton", display: "swap" });
const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas-neue",
  display: "swap",
});
const shareTech = Share_Tech({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-share-tech",
  display: "swap",
});
const shareTechMono = Share_Tech_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-share-tech-mono",
  display: "swap",
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://lytehaus.tech"),
  title: {
    default: "LYTEHAUS Technologies — ATLVS, GVTEWAY, COMPVSS",
    template: "%s · LYTEHAUS Technologies",
  },
  description:
    "ATLVS · GVTEWAY · COMPVSS — the Itinerary for cultural tastemakers. The bridge, the ports of call, the open deck. From horizon to homecoming.",
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
    "LYTEHAUS Technologies",
  ],
  manifest: "/manifest.json",
  openGraph: {
    title: "LYTEHAUS Technologies",
    description: "ATLVS · GVTEWAY · COMPVSS — the Itinerary for cultural tastemakers.",
    siteName: "LYTEHAUS Technologies",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LYTEHAUS Technologies",
    description: "ATLVS · GVTEWAY · COMPVSS — the Itinerary for cultural tastemakers.",
  },
  robots: { index: true, follow: true },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "LYTEHAUS" },
};

export const viewport: Viewport = {
  // Audit T8 fix: was a single raw `#0A0A0A` that didn't reflect the actual
  // theme paint. Bermuda Triangle (HVRBOR-aligned) light paint is the cream
  // paper #F5F2EC; dark paint is near-black ink. Native mobile chrome (status
  // bar, app switcher) follows the user's OS preference.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f2ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

// COMPVSS is the offline-first PWA shell. ATLVS (console) and GVTEWAY
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
  const locale = await getRequestLocale();
  const dir = isRtl(locale) ? "rtl" : "ltr";

  // SSR theme from cookie (survives first paint with the right tokens).
  // Client head script reconciles with localStorage on mount.
  const cs = await cookies();
  const cookieTheme = cs.get(THEME_COOKIE_NAME)?.value;
  const ssrTheme = isValidThemeSlug(cookieTheme) ? cookieTheme : "bermuda-triangle";
  const ssrColorScheme = colorSchemeFor(ssrTheme);

  return (
    <html
      lang={locale}
      dir={dir}
      data-theme={ssrTheme}
      style={{ colorScheme: ssrColorScheme }}
      className={`h-full ${inter.variable} ${mono.variable} ${serif.variable} ${fraunces.variable} ${instrument.variable} ${dmSerif.variable} ${bricolage.variable} ${spaceGrot.variable} ${geist.variable} ${geistMono.variable} ${anton.variable} ${bebasNeue.variable} ${shareTech.variable} ${shareTechMono.variable} ${dmSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* M2-04 — Organization schema appears on every page so Google's
            knowledge panel can resolve the brand. Populates once at the root
            and inherits across every route. */}
        <StructuredData
          data={organization({
            name: "LYTEHAUS Technologies",
            url: process.env.NEXT_PUBLIC_APP_URL ?? "https://lytehaus.tech",
            description:
              "ATLVS · GVTEWAY · COMPVSS — the Itinerary for cultural tastemakers. Internal console, stakeholder portals, and mobile PWA for events, fabrication, and creative ops.",
            logo: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://lytehaus.tech"}/og/logo.png`,
          })}
        />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
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
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          theme="system"
          toastOptions={{
            classNames: {
              toast: "group toast",
              title: "font-medium",
              description: "text-[var(--text-secondary)]",
              // Audit T7 fix: text-white was a raw value bypassing tokens.
              // --org-on-primary is set per-platform overlay (white on
              // pink/cyan/blue/red, black on yellow under bermuda-triangle).
              actionButton: "bg-[var(--org-primary)] text-[var(--org-on-primary,white)]",
              cancelButton: "bg-[var(--surface-inset)]",
            },
          }}
        />
        <script dangerouslySetInnerHTML={{ __html: swRegister }} />
      </body>
    </html>
  );
}
