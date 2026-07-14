import * as Sentry from "@sentry/nextjs";
import { isBenignStreamAbortEvent, scrubSentryEvent } from "@/lib/sentry-scrub";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE,
    tracesSampleRate: 0.1,
    // Default PII off (IPs, request bodies, user agents). Everything useful
    // for debugging is already in the structured logger, correlatable via
    // request_id. See docs/audit/06-hardening-report.md IK-041.
    sendDefaultPii: false,
    beforeSend(event) {
      // Drop the benign Node stream-abort race before it burns quota / buries
      // real errors (see `isBenignStreamAbortEvent`); scrub everything else.
      if (isBenignStreamAbortEvent(event)) return null;
      return scrubSentryEvent(event);
    },
  });
}
