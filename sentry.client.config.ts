import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "@/lib/sentry-scrub";

/**
 * Client-side Sentry init.
 *
 * Gated by `__consent.analytics === true` — the cookie consent banner controls
 * whether the SDK actually sends events. We still init so error capture works
 * for users who opted in mid-session via the consent panel.
 */

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    sendDefaultPii: false,
    beforeSend(event) {
      // Honor cookie consent — if analytics is off, drop the event entirely.
      if (typeof window !== "undefined") {
        const consent = (window as Window & { __consent?: { analytics?: boolean } }).__consent;
        if (consent && consent.analytics !== true) return null;
      }
      return scrubSentryEvent(event);
    },
  });
}
