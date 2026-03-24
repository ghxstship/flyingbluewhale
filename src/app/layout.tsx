import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const syne = localFont({
  src: [
    { path: "../fonts/Syne-Bold.woff2", weight: "700", style: "normal" as const },
    { path: "../fonts/Syne-ExtraBold.woff2", weight: "800", style: "normal" as const },
  ],
  variable: "--font-syne",
  display: "swap",
  preload: true,
});

const plusJakarta = localFont({
  src: [
    { path: "../fonts/PlusJakartaSans-Regular.woff2", weight: "400", style: "normal" as const },
    { path: "../fonts/PlusJakartaSans-Medium.woff2", weight: "500", style: "normal" as const },
    { path: "../fonts/PlusJakartaSans-SemiBold.woff2", weight: "600", style: "normal" as const },
    { path: "../fonts/PlusJakartaSans-Bold.woff2", weight: "700", style: "normal" as const },
  ],
  variable: "--font-geist-sans",
  display: "swap",
  preload: true,
});

const jetbrainsMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Know Before You Go — MMW26 Open Air at the Racetrack",
  description:
    "Your guide to Black Coffee + Carlita + Kaz James Open Air at the Racetrack — Miami Music Week 2026 at Hialeah Park Casino.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${syne.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
