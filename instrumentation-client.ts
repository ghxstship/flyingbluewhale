/**
 * Client-side instrumentation entrypoint.
 *
 * Next 16 auto-loads `instrumentation-client.ts` (root or src/) — it does
 * NOT load the legacy `sentry.client.config.ts` convention, and this repo
 * doesn't use `withSentryConfig`, so this file is the ONLY path that
 * initializes browser Sentry. The init itself (DSN gate, consent-gated
 * beforeSend, PII scrubbing, sample rates) lives in sentry.client.config.ts
 * — re-exported here so there is a single source of truth.
 */
import * as Sentry from "@sentry/nextjs";

import "./sentry.client.config";

// Instruments App Router navigations for performance tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
