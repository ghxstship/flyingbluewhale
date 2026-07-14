import * as Sentry from "@sentry/nextjs";
import { isBenignStreamAbortEvent, scrubSentryEvent } from "@/lib/sentry-scrub";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    beforeSend(event) {
      if (isBenignStreamAbortEvent(event)) return null;
      return scrubSentryEvent(event);
    },
  });
}
