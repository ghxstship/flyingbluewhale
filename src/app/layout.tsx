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
const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "700"], variable: "--font-serif", display: "swap" });

// CHROMA BEACON theme fonts — the CSS variable names match what each theme's
// `--font-display` / `--font-body` declarations reference.
const fraunces   = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-instrument-serif", display: "swap" });
const dmSerif    = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--font-dm-serif-display", display: "swap" });
const bricolage  = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const spaceGrot  = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });
const geist      = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono  = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Second Star Technologies — ATLVS, GVTEWAY, COMPVSS",
    template: "%s · Second Star Technologies",
  },
  description:
    "ATLVS · GVTEWAY · COMPVSS — one rig for the whole run-of-show. The production office, every stakeholder&apos;s door, and the crew PWA on the floor. Run the show, not the spreadsheets.",
  keywords: ["production management", "live events", "fabrication", "advancing", "ticketing", "PWA", "ATLVS", "GVTEWAY", "COMPVSS", "Second Star Technologies"],
  manifest: "/manifest.json",
  openGraph: {
    title: "Second Star Technologies",
    description: "ATLVS · GVTEWAY · COMPVSS — run the show, not the spreadsheets.",
    siteName: "Second Star Technologies",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Second Star Technologies",
    description: "ATLVS · GVTEWAY · COMPVSS — run the show, not the spreadsheets.",
  },
  robots: { index: true, follow: true },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Second Star" },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
};

const swRegister = process.env.NODE_ENV === "production"
  ? `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/service-worker.js').catch(function(){});});}`
  : `if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});});}`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getRequestLocale();
  const dir = isRtl(locale) ? "rtl" : "ltr";

  // SSR theme from cookie (survives first paint with the right tokens).
  // Client head script reconciles with localStorage on mount.
  const cs = await cookies();
  const cookieTheme = cs.get(THEME_COOKIE_NAME)?.value;
  const ssrTheme = isValidThemeSlug(cookieTheme) ? cookieTheme : "kinetic";
  const ssrColorScheme = colorSchemeFor(ssrTheme);

  return (
    <html
      lang={locale}
      dir={dir}
      data-theme={ssrTheme}
      style={{ colorScheme: ssrColorScheme }}
      className={`h-full ${inter.variable} ${mono.variable} ${serif.variable} ${fraunces.variable} ${instrument.variable} ${dmSerif.variable} ${bricolage.variable} ${spaceGrot.variable} ${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* M2-04 — Organization schema appears on every page so Google's
            knowledge panel can resolve the brand. Populates once at the root
            and inherits across every route. */}
        <StructuredData
          data={organization({
            name: "Second Star Technologies",
            url: process.env.NEXT_PUBLIC_APP_URL ?? "https://secondstar.tech",
            description:
              "ATLVS · GVTEWAY · COMPVSS — run the show, not the spreadsheets. Internal console, stakeholder portals, and mobile PWA for events, fabrication, and creative ops.",
            logo: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://secondstar.tech"}/og/logo.png`,
          })}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <a href="#main" className="skip-link">Skip to content</a>
        <ThemeProvider>
          <TooltipProvider delayDuration={350}>
            <LiveRegionProvider>
              <div id="main" className="flex-1 flex flex-col min-w-0">{children}</div>
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
              actionButton: "bg-[var(--org-primary)] text-white",
              cancelButton: "bg-[var(--surface-inset)]",
            },
          }}
        />
        <script dangerouslySetInnerHTML={{ __html: swRegister }} />
      </body>
    </html>
  );
}
