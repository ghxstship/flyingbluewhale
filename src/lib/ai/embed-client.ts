import "server-only";

import { headers, cookies } from "next/headers";
import { SITE } from "@/lib/seo";

/**
 * Server-side self-call to POST /api/v1/ai/embed-source — the one write path
 * into the RAG corpus (same contract the /studio/ai/corpus reindex walk
 * uses). Forwards the caller's cookies so withAuth on the endpoint resolves
 * the same session; the endpoint is idempotent per (model, content hash), so
 * re-posting unchanged text is a cheap no-op while edited text re-embeds.
 *
 * Request-scoped only (reads next/headers) — do not call from cron/queue
 * contexts; those should call indexSource directly with a service session.
 */
export async function postEmbedSource(args: {
  sourceType: string;
  sourceId: string;
  text: string;
  projectId?: string | null;
}): Promise<{ error?: string }> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto =
    h.get("x-forwarded-proto") ?? (host.includes("localhost") || host.includes("lvh.me") ? "http" : "https");
  const origin = host ? `${proto}://${host}` : SITE.baseUrl;
  if (!origin) return { error: "Could not resolve the embed-source endpoint origin." };

  const cookieHeader = (await cookies())
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  try {
    const res = await fetch(`${origin}/api/v1/ai/embed-source`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: cookieHeader },
      body: JSON.stringify({
        source_type: args.sourceType,
        source_id: args.sourceId,
        project_id: args.projectId ?? undefined,
        text: args.text,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.text();
      return { error: `${res.status}: ${body.slice(0, 160)}` };
    }
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "fetch failed" };
  }
}
