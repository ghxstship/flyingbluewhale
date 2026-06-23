"use server";

import { headers, cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { walkOrgSources } from "@/lib/ai/corpus";
import { SITE } from "@/lib/seo";
import { log } from "@/lib/log";

export type State = { error?: string; ok?: true; indexed?: number; skipped?: number } | null;

/**
 * Reindex the org corpus. Enumerates reindexable source rows (deliverables,
 * submittals, RFIs) under the caller's org and POSTs each to the existing
 * /api/v1/ai/embed-source endpoint via a server-side fetch — exactly the
 * contract that endpoint expects, so this surface stays a thin operator
 * driver rather than re-implementing the embedding write path.
 *
 * Cookies are forwarded so withAuth on the endpoint resolves the same
 * session. The endpoint is idempotent per (org, source_type, source_id,
 * model), so re-running is safe and cheap.
 *
 * NOTE: this is a manual, request-scoped walk. True scheduled indexing needs
 * a cron registration (e.g. a Vercel Cron / Supabase scheduled function that
 * hits an authenticated batch route). That is intentionally out of scope —
 * flag it to the operator in the UI.
 */
export async function reindexCorpus(): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Manager role or higher required." };

  const supabase = (await createClient()) as unknown as LooseSupabase;

  let sources;
  try {
    sources = await walkOrgSources(supabase, session.orgId);
  } catch (e) {
    log.error("corpus.walk.failed", { err: e instanceof Error ? e.message : String(e) });
    return { error: "Could not enumerate corpus sources." };
  }

  if (sources.length === 0) {
    return { error: "No deliverables, submittals, or RFIs with text to index." };
  }

  // Resolve an absolute origin for the self-call. Prefer the live request
  // host (works on preview deploys + subdomain mode); fall back to the
  // configured apex. Force http for the loopback dev host.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") || host.includes("lvh.me") ? "http" : "https");
  const origin = host ? `${proto}://${host}` : SITE.baseUrl;
  if (!origin) return { error: "Could not resolve the embed-source endpoint origin." };

  const cookieHeader = (await cookies())
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  let indexed = 0;
  let skipped = 0;
  let firstError: string | null = null;

  for (const src of sources) {
    try {
      const res = await fetch(`${origin}/api/v1/ai/embed-source`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: cookieHeader },
        body: JSON.stringify({
          source_type: src.source_type,
          source_id: src.source_id,
          project_id: src.project_id ?? undefined,
          text: src.text,
        }),
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.text();
        if (!firstError) firstError = `${res.status}: ${body.slice(0, 160)}`;
        skipped += 1;
        continue;
      }
      const json = (await res.json()) as { data?: { inserted?: number } };
      if ((json.data?.inserted ?? 0) > 0) indexed += 1;
      else skipped += 1;
    } catch (e) {
      if (!firstError) firstError = e instanceof Error ? e.message : "fetch failed";
      skipped += 1;
    }
  }

  revalidatePath("/studio/ai/corpus");

  if (indexed === 0 && firstError) {
    // Everything failed — surface the first cause (commonly "no embedding
    // provider configured"). The endpoint returns that when neither
    // OPENAI_API_KEY nor VOYAGE_API_KEY is set.
    return { error: `Reindex failed. ${firstError}` };
  }

  return { ok: true, indexed, skipped };
}
