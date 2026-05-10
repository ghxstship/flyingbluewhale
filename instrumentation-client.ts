// Next.js 15+ client instrumentation hook — runs once in the browser bundle.
// Imports the Sentry client config at module evaluation time so Sentry
// initialises before the first user interaction.
import "./sentry.client.config";
