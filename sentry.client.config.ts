import * as Sentry from "@sentry/nextjs";

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
    beforeSend(event) {
      // Honor cookie consent — if analytics is off, drop the event
      if (typeof window !== "undefined") {
        const consent = (window as Window & { __consent?: { analytics?: boolean } }).__consent;
        if (consent && consent.analytics !== true) return null;
      }
      // Strip PII from URL paths (anything that looks like an ID)
      if (event.request?.url) {
        event.request.url = event.request.url.replace(
          /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
          ":uuid",
        );
      }
      return event;
    },
  });
}
