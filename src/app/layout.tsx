import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Cormorant_Garamond } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { LiveRegionProvider } from "@/components/ui/LiveRegion";
import { CookieConsent } from "@/components/compliance/CookieConsent";
import { getRequestLocale } from "@/lib/i18n/server";
import { isRtl } from "@/lib/i18n/config";
import "./globals.css";

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

const themeBootstrap = `(function(){try{var t=localStorage.getItem('fbw_theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');var dn=localStorage.getItem('fbw_density');if(dn==='compact')document.documentElement.setAttribute('data-density','compact');}catch(e){}})()`;

const swRegister = process.env.NODE_ENV === "production"
  ? `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/service-worker.js').catch(function(){});});}`
  : `if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});});}`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getRequestLocale();
  const dir = isRtl(locale) ? "rtl" : "ltr";
  return (
    <html
      lang={locale}
      dir={dir}
      className={`h-full ${inter.variable} ${mono.variable} ${serif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <a href="#main" className="skip-link">Skip to content</a>
        <ThemeProvider>
          <TooltipProvider delayDuration={350}>
            <LiveRegionProvider>
              <div id="main" className="flex-1 flex flex-col min-w-0">{children}</div>
              <CookieConsent />
            </LiveRegionProvider>
          </TooltipProvider>
        </ThemeProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--background)",
              color: "var(--foreground)",
              border: "1px solid var(--border-color)",
              fontFamily: "var(--font-inter)",
              fontSize: "0.875rem",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)",
            },
          }}
        />
        <script dangerouslySetInnerHTML={{ __html: swRegister }} />
      </body>
    </html>
  );
}
