import type { Metadata } from "next";
import { Anton, Bebas_Neue, Share_Tech, Share_Tech_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const shareTech = Share_Tech({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-share-tech",
  display: "swap",
});

const shareTechMono = Share_Tech_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-share-tech-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GVTEWAY -- Universal Production Advancing",
  description:
    "Enterprise-grade production advancing platform. One catalog, two views. Talent and production track management for live events.",
  keywords: [
    "production advancing",
    "talent management",
    "event production",
    "unified catalog",
    "live events",
  ],
  openGraph: {
    title: "GVTEWAY -- Universal Production Advancing",
    description:
      "Enterprise-grade production advancing platform for live events.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${bebasNeue.variable} ${shareTech.variable} ${shareTechMono.variable}`}
    >
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <main id="main">{children}</main>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1A1A1A",
              color: "#F5F5F5",
              border: "1px solid #2A2A2A",
              fontFamily: "var(--font-sans)",
              fontSize: "0.875rem",
            },
            success: {
              iconTheme: {
                primary: "#00E676",
                secondary: "#0A0A0A",
              },
            },
            error: {
              iconTheme: {
                primary: "#FF5252",
                secondary: "#0A0A0A",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
