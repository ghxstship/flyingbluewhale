import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor config — Round 78 (G-033).
 *
 * The COMPVSS field app is a Next.js PWA at compvss.atlvs.pro. Capacitor
 * wraps that PWA in native iOS + Android shells for App Store / Play
 * Store distribution. Because the app is server-rendered (App Router),
 * we use the remote-loading pattern (server.url) rather than a static
 * export — the Capacitor wrapper is essentially a WKWebView / WebView
 * pointing at the deployed PWA, leveraging the existing service worker
 * for offline behavior.
 *
 * App Store / Play Store distribution runbook: see docs/mobile/CAPACITOR.md.
 */

const isDev = process.env.NODE_ENV !== "production" || process.env.CAP_DEV === "1";

const config: CapacitorConfig = {
  appId: "pro.atlvs.compvss",
  appName: "COMPVSS",
  // webDir is required by the CLI but unused at runtime when server.url
  // is set. Points at the standard Next build output so `cap sync` has
  // something to copy as a fallback.
  webDir: ".next/standalone/public",
  server: {
    // Production: load the deployed PWA over HTTPS. The COMPVSS PWA
    // already enforces auth + handles offline via service worker, so
    // the Capacitor wrapper is purely a distribution layer.
    url: isDev ? "http://10.0.2.2:3000/m" : "https://compvss.atlvs.pro/m",
    cleartext: isDev,
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#0A0A0A",
    scheme: "ATLVS",
  },
  android: {
    backgroundColor: "#0A0A0A",
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: isDev,
  },
};

export default config;
