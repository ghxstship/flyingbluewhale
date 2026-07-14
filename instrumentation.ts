/**
 * Next.js instrumentation hook — runs once per runtime.
 * Wires Sentry init for server + edge runtimes.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export async function onRequestError(
  error: unknown,
  request: Request,
  context: { routerKind: "Pages Router" | "App Router"; routePath: string; routeType: "render" | "route" | "action" | "middleware" },
) {
  // Benign Node TransformStream cancel/write race on aborted streamed
  // responses (uptime monitors closing the connection mid-flight). Not an app
  // fault; reporting it only buries real errors. See `isBenignStreamAbort`.
  const { isBenignStreamAbort } = await import("@/lib/sentry-scrub");
  if (isBenignStreamAbort(error)) return;
  // Lazy-import so we don't pay the cost in builds that don't use Sentry
  const Sentry = await import("@sentry/nextjs").catch(() => null);
  if (!Sentry) return;
  Sentry.captureException(error, {
    extra: { url: request.url, ...context },
  });
}
