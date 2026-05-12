import { cookies, headers } from "next/headers";
import { z } from "zod";
import { apiOk, apiError, parseJson } from "@/lib/api";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { ratelimit, keyFromRequest } from "@/lib/ratelimit";
import { redeemAccessCode } from "@/lib/db/guide-access";
import {
  cookieName as guideCookieName,
  mintToken,
  verifyToken,
  GUIDE_ACCESS_TTL_SECONDS,
} from "@/lib/guides/access-token";
import type { GuidePersona } from "@/lib/guides/types";

export const dynamic = "force-dynamic";

const PERSONAS = [
  "staff",
  "crew",
  "vendor",
  "brand_ambassador",
  "sponsor",
  "artist",
  "media_press",
  "client",
  "guest",
  "custom",
] as const satisfies readonly GuidePersona[];

const Body = z.object({
  slug: z.string().min(1),
  persona: z.enum(PERSONAS),
  code: z.string().min(4).max(64),
});

export async function POST(req: Request) {
  if (!hasSupabase) return apiError("service_unavailable", "Supabase not configured");

  // Rate-limit by IP/principal up front so brute-forcing a code costs
  // attempts, not pennies.
  const rl = await ratelimit({
    key: keyFromRequest(req, "guide-unlock"),
    max: 10,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return apiError("rate_limited", "Too many attempts. Try again in a minute.");
  }

  const parsed = await parseJson(req, Body);
  if (parsed instanceof Response) return parsed;

  const project = await projectIdFromSlug(parsed.slug);
  if (!project) return apiError("not_found", "Project not found");

  // Guard against tier-5 (public) personas trying to redeem a code — they
  // don't need one, and we don't want to mint cookies for them.
  if (parsed.persona === "guest" || parsed.persona === "custom") {
    return apiError("bad_request", "This guide is public; no code required.");
  }

  // Union with any existing cookie so a holder of multiple codes (e.g. an
  // FOH lead with both crew + vendor) keeps every persona they've unlocked.
  const cookieStore = await cookies();
  const existing = cookieStore.get(guideCookieName(project.id))?.value ?? null;
  const verified = await verifyToken(existing, project.id);
  const personas: GuidePersona[] = Array.from(new Set<GuidePersona>([...(verified?.personas ?? []), parsed.persona]));

  // Mint first so we can pass the jti to the RPC for atomic audit-recording.
  const { token, jti, expSeconds } = await mintToken({
    projectId: project.id,
    personas,
    ttlSeconds: GUIDE_ACCESS_TTL_SECONDS,
  });

  const h = await headers();
  const redeem = await redeemAccessCode({
    projectId: project.id,
    persona: parsed.persona,
    rawCode: parsed.code,
    jti,
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: h.get("user-agent") ?? null,
  });
  if (!redeem.ok) {
    if (redeem.reason === "service_unavailable") {
      return apiError("service_unavailable", "Unable to verify code right now.");
    }
    // Collapse not_found / revoked / expired / exhausted to a single
    // user-facing message — we don't want to leak which codes have been
    // issued, only that *this* attempt didn't grant access.
    return apiError("forbidden", "Invalid or expired code.");
  }

  // Set cookie. SameSite=Lax so the unlock→guide redirect keeps it.
  // Scope to the apex when running on the production host so the cookie
  // works across atlvs/gvteway/compvss subdomains (matches Supabase auth
  // cookie behavior in src/lib/supabase/server.ts).
  const hostHeader = h.get("host") ?? "";
  const host = hostHeader.split(":")[0].toLowerCase();
  const domain = host.endsWith("flytehaus.live") ? ".flytehaus.live" : undefined;
  cookieStore.set(guideCookieName(project.id), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: expSeconds,
    ...(domain ? { domain } : {}),
  });

  return apiOk({
    redirect: `/p/${parsed.slug}/guide?as=${parsed.persona}`,
  });
}
