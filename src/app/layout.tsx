import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Cormorant_Garamond } from "next/font/google";
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
import "./globals.css";
import "./theme/index.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });
const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["300", "400", "500", "700"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "flyingbluewhale — Unified Production Platform",
    template: "%s · flyingbluewhale",
  },
  description:
    "Internal operations console, external stakeholder portals, and mobile field PWA for live events, fabrication, and creative ops.",
  keywords: ["production management", "live events", "fabrication", "advancing", "ticketing", "PWA"],
  manifest: "/manifest.json",
  openGraph: {
    title: "flyingbluewhale",
    description: "Unified production platform.",
    siteName: "flyingbluewhale",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "flyingbluewhale", description: "Unified production platform." },
  robots: { index: true, follow: true },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "flyingbluewhale" },
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
      className={`h-full ${inter.variable} ${mono.variable} ${serif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
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
