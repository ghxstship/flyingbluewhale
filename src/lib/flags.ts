import { env } from "./env";

/**
 * Feature flags — remote-config-backed, with a safe local fallback.
 *
 * Server-side: call `loadFlags(userContext)` once per request and pass the
 * resulting object to client components via props or React Context.
 * Client-side: no provider is wired yet — consume flags via the server-loaded
 * object passed down as props. (A provider component can be added later; this
 * module is the registry + server loader, not the React glue.)
 *
 * Env: NEXT_PUBLIC_FLAGS_CLIENT_KEY for client; FLAGS_API_HOST optional.
 *
 * Default returns the explicit fallback when no client key is configured —
 * enables local dev + tests without a remote flag service.
 */

export type Flags = {
  command_palette_v2: boolean;
  portal_comments: boolean;
  data_table_saved_views: boolean;
  passkeys: boolean;
};

export const FLAG_DEFAULTS: Flags = {
  command_palette_v2: true,
  portal_comments: true,
  data_table_saved_views: false,
  passkeys: false,
};

/**
 * H2-09 / IK-057 — every flag must carry metadata so we can spot flags
 * that lingered past their intended sunset and retire them.
 *
 * `owner`     — GitHub handle or team email responsible for the rollout.
 * `expiresAt` — ISO date when the flag must either be removed OR explicitly
 *               extended. Unit test fails when a flag lacks either field
 *               OR has an ISO date in the past (past-due flag cleanup).
 */
export type FlagMeta = {
  owner: string;
  expiresAt: string; // ISO date, e.g. "2026-07-01"
  description: string;
};

/**
 * H3-08 / IK-055 — canary cohort attribute.
 *
 * `cohortFromUserId` deterministically maps a user id into a 0-99 bucket.
 * A rollout rule in the remote flag service (or the local fallback) can read this as
 * the `cohort` attribute and gate on `cohort < 10` for a 10% canary,
 * `cohort < 1` for 1%, etc.
 *
 * Same user always lands in the same cohort across requests, which means
 * a user on a canary never sees the flag flicker mid-session. The hash
 * is stable (FNV-1a 32-bit) so rollout can be reproduced offline.
 */
export function cohortFromUserId(userId: string): number {
  let hash = 0x811c9dc5; // FNV-1a offset basis
  for (let i = 0; i < userId.length; i++) {
    hash ^= userId.charCodeAt(i);
    // FNV prime — `>>> 0` coerces to unsigned 32-bit
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash % 100;
}

export const FLAG_REGISTRY: Record<keyof Flags, FlagMeta> = {
  command_palette_v2: {
    owner: "julian.clarkson@ghxstship.pro",
    expiresAt: "2026-08-01",
    description: "Enables v2 command palette with fuzzy search + recents.",
  },
  // ai_opus_for_pro removed 2026-07-03 — expired 2026-07-01 with zero code
  // consumers (model routing ships tier-checked in the AI chat route, never
  // read this flag); the past-due-flag hygiene test enforces removal.
  portal_comments: {
    owner: "julian.clarkson@ghxstship.pro",
    expiresAt: "2026-09-01",
    description: "Guide comment thread on /p/[slug]/guide.",
  },
  data_table_saved_views: {
    owner: "julian.clarkson@ghxstship.pro",
    expiresAt: "2026-09-01",
    description: "Saved filter presets on data tables.",
  },
  passkeys: {
    owner: "julian.clarkson@ghxstship.pro",
    expiresAt: "2026-12-01",
    description: "WebAuthn passkey registration + sign-in flow.",
  },
};

const FLAGS_HOST = env.FLAGS_API_HOST;
const FLAGS_KEY = env.NEXT_PUBLIC_FLAGS_CLIENT_KEY;

type Attributes = {
  userId?: string;
  orgId?: string;
  tier?: "access" | "core" | "professional" | "enterprise";
  locale?: string;
};

type FlagFeature = {
  defaultValue?: unknown;
  rules?: Array<{
    condition?: Record<string, unknown>;
    force?: unknown;
    coverage?: number;
    hashAttribute?: string;
  }>;
};
type FlagPayload = { features?: Record<string, FlagFeature> };

/** Server-side feature flag evaluation. Returns a typed Flags map. */
export async function loadFlags(attrs: Attributes = {}): Promise<Flags> {
  if (!FLAGS_KEY || !FLAGS_HOST) return FLAG_DEFAULTS;
  try {
    const { httpFetch } = await import("./http");
    // 60s edge cache. httpFetch adds 3s timeout + 2 retries on idempotent reads.
    const res = await httpFetch(`${FLAGS_HOST}/api/features/${FLAGS_KEY}`, {
      next: { revalidate: 60 } as unknown as RequestInit["next"],
      timeoutMs: 3000,
    });
    if (!res.ok) return FLAG_DEFAULTS;
    const payload = (await res.json()) as FlagPayload;
    const features = payload.features ?? {};
    const out: Record<string, unknown> = { ...FLAG_DEFAULTS };
    for (const [key, def] of Object.entries(features)) {
      out[key] = evaluateFeature(def, attrs) ?? def.defaultValue ?? out[key];
    }
    return out as Flags;
  } catch {
    return FLAG_DEFAULTS;
  }
}

function evaluateFeature(def: FlagFeature, attrs: Attributes): unknown {
  if (!def.rules) return def.defaultValue;
  for (const rule of def.rules) {
    if (rule.condition && !matchesCondition(rule.condition, attrs)) continue;
    if (typeof rule.coverage === "number") {
      const hashSeed = attrs.userId ?? attrs.orgId ?? "anon";
      const bucket = hashFloat(hashSeed) % 100;
      if (bucket >= rule.coverage * 100) continue;
    }
    return rule.force;
  }
  return def.defaultValue;
}

function matchesCondition(cond: Record<string, unknown>, attrs: Attributes): boolean {
  for (const [k, expected] of Object.entries(cond)) {
    const actual = (attrs as Record<string, unknown>)[k];
    if (actual !== expected) return false;
  }
  return true;
}

function hashFloat(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return Math.abs(h);
}
