import "server-only";
import { createHash } from "node:crypto";

// ────────────────────────────────────────────────────────────────────
// SCIM 2.0 helpers — server-only.
//
// Implements the minimum viable subset of SCIM 2.0 (RFC 7644) that Okta and
// Entra ID actually use: User + Group resources, list with `eq`/`pr` filter,
// PATCH with simple "replace" / "add" / "remove" operations.
//
// We deliberately avoid pulling in a full SCIM library. The wire format is
// trivial and the parsing logic is small enough to live here + be unit-tested.
// ────────────────────────────────────────────────────────────────────

export const SCIM_USER_SCHEMA = "urn:ietf:params:scim:schemas:core:2.0:User";
export const SCIM_GROUP_SCHEMA = "urn:ietf:params:scim:schemas:core:2.0:Group";
export const SCIM_LIST_RESPONSE = "urn:ietf:params:scim:api:messages:2.0:ListResponse";
export const SCIM_PATCH_OP = "urn:ietf:params:scim:api:messages:2.0:PatchOp";
export const SCIM_ERROR = "urn:ietf:params:scim:api:messages:2.0:Error";
export const SCIM_SP_CONFIG = "urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig";

// ─── Filter parsing ──────────────────────────────────────────────────

export type ScimFilter = { op: "eq"; attr: string; value: string } | { op: "pr"; attr: string };

/**
 * Parse a SCIM filter string. We support only `eq` and `pr` — the two
 * operators Okta/Entra send in 99% of provisioning calls.
 *
 * Examples:
 *   userName eq "alice@acme.com"
 *   active eq true
 *   emails.value pr
 *
 * Returns null when the filter is empty (no filter ⇒ list everything).
 * Throws ScimError("invalidFilter") on unsupported operators or syntax.
 */
export function parseScimFilter(input: string | null | undefined): ScimFilter | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Presence: "<attr> pr"
  const prMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_.]*)\s+pr$/i);
  if (prMatch) return { op: "pr", attr: prMatch[1] };

  // Equality: '<attr> eq "<value>"' or '<attr> eq <bool|number>'
  const eqMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_.]*)\s+eq\s+(.+)$/i);
  if (eqMatch) {
    const [, attr, raw] = eqMatch;
    let value: string;
    if (raw.startsWith('"') && raw.endsWith('"') && raw.length >= 2) {
      value = raw.slice(1, -1);
    } else {
      value = raw.trim();
    }
    return { op: "eq", attr, value };
  }

  // Anything else — co/sw/ew/gt/ge/lt/le/ne/and/or/not — we reject cleanly.
  throw new ScimError("invalidFilter", "Only `eq` and `pr` operators are supported", 400);
}

/** Hash a SCIM bearer token. Plain sha256 hex. */
export function hashScimToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Generate a random plaintext SCIM token. */
export function generateScimToken(): string {
  // 32 bytes → 256 bits of entropy. Encoded base64url for URL/header safety.
  const buf = new Uint8Array(32);
  // Use Web Crypto when available; fall back to node:crypto.
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(buf);
  } else {
    const { randomBytes } = require("node:crypto") as typeof import("node:crypto");
    randomBytes(32).copy(buf);
  }
  return `scim_${Buffer.from(buf).toString("base64url")}`;
}

// ─── Resource builders ───────────────────────────────────────────────

export type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at?: string | null;
  deleted_at?: string | null;
};

export function buildScimUser(u: UserRow, baseUrl: string): Record<string, unknown> {
  const [givenName, ...rest] = (u.display_name ?? u.email).split(/\s+/);
  const familyName = rest.join(" ").trim();
  return {
    schemas: [SCIM_USER_SCHEMA],
    id: u.id,
    userName: u.email,
    name: {
      givenName: givenName || null,
      familyName: familyName || null,
    },
    displayName: u.display_name ?? u.email,
    emails: [{ value: u.email, primary: true, type: "work" }],
    active: !u.deleted_at,
    meta: {
      resourceType: "User",
      created: u.created_at,
      lastModified: u.updated_at ?? u.created_at,
      location: `${baseUrl}/scim/v2/Users/${u.id}`,
    },
  };
}

export type GroupRow = {
  id: string;
  name: string;
  members?: Array<{ id: string; email?: string | null }>;
  created_at: string;
  updated_at?: string | null;
};

export function buildScimGroup(g: GroupRow, baseUrl: string): Record<string, unknown> {
  return {
    schemas: [SCIM_GROUP_SCHEMA],
    id: g.id,
    displayName: g.name,
    members: (g.members ?? []).map((m) => ({
      value: m.id,
      display: m.email ?? undefined,
      $ref: `${baseUrl}/scim/v2/Users/${m.id}`,
    })),
    meta: {
      resourceType: "Group",
      created: g.created_at,
      lastModified: g.updated_at ?? g.created_at,
      location: `${baseUrl}/scim/v2/Groups/${g.id}`,
    },
  };
}

export function buildScimListResponse<T>(
  resources: T[],
  startIndex: number,
  count: number,
  total: number,
): Record<string, unknown> {
  return {
    schemas: [SCIM_LIST_RESPONSE],
    totalResults: total,
    startIndex,
    itemsPerPage: count,
    Resources: resources,
  };
}

// ─── Errors ──────────────────────────────────────────────────────────

export class ScimError extends Error {
  constructor(
    public readonly scimType: string,
    message: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = "ScimError";
  }
}

export function scimErrorResponse(err: ScimError): Response {
  return new Response(
    JSON.stringify({
      schemas: [SCIM_ERROR],
      detail: err.message,
      scimType: err.scimType,
      status: String(err.status),
    }),
    { status: err.status, headers: { "content-type": "application/scim+json" } },
  );
}

// ─── Service Provider Config ─────────────────────────────────────────

export function buildServiceProviderConfig(): Record<string, unknown> {
  return {
    schemas: [SCIM_SP_CONFIG],
    documentationUri: "https://lytehaus.live/docs/scim",
    patch: { supported: true },
    bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
    filter: { supported: true, maxResults: 200 },
    changePassword: { supported: false },
    sort: { supported: false },
    etag: { supported: false },
    authenticationSchemes: [
      {
        type: "oauthbearertoken",
        name: "OAuth Bearer Token",
        description: "Authenticate with a per-org SCIM bearer token.",
        primary: true,
      },
    ],
    meta: {
      resourceType: "ServiceProviderConfig",
      location: "/scim/v2/ServiceProviderConfig",
    },
  };
}

// ─── Auth ────────────────────────────────────────────────────────────

export type ScimAuthContext = {
  orgId: string;
  tokenId: string;
};

/**
 * Resolve a SCIM Bearer token to an org context.
 * Returns null on missing/invalid token. Caller should respond 401.
 */
export async function resolveScimAuth(req: Request): Promise<ScimAuthContext | null> {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  const plaintext = auth.slice(7).trim();
  if (!plaintext) return null;
  const tokenHash = hashScimToken(plaintext);

  const { isServiceClientAvailable, createServiceClient } = await import("@/lib/supabase/server");
  if (!isServiceClientAvailable()) return null;
  type Loose = import("@/lib/supabase/loose").LooseSupabase;
  const admin = createServiceClient() as unknown as Loose;
  const { data, error } = await admin
    .from("org_scim_tokens")
    .select("id, org_id, enabled")
    .eq("token_hash", tokenHash)
    .eq("enabled", true)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as { id: string; org_id: string };
  // Best-effort cursor update; ignore failures.
  await admin.from("org_scim_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", row.id);
  return { orgId: row.org_id, tokenId: row.id };
}

// ─── PATCH op parsing ────────────────────────────────────────────────

export type ScimPatchOp = {
  op: "add" | "replace" | "remove";
  path?: string;
  value?: unknown;
};

export function parseScimPatch(body: unknown): ScimPatchOp[] {
  if (!body || typeof body !== "object") {
    throw new ScimError("invalidSyntax", "Body must be a JSON object", 400);
  }
  const b = body as { schemas?: unknown; Operations?: unknown };
  const ops = Array.isArray(b.Operations) ? b.Operations : [];
  const out: ScimPatchOp[] = [];
  for (const raw of ops) {
    if (!raw || typeof raw !== "object") continue;
    const r = raw as { op?: unknown; path?: unknown; value?: unknown };
    const op = String(r.op ?? "").toLowerCase();
    if (op !== "add" && op !== "replace" && op !== "remove") {
      throw new ScimError("invalidValue", `Unsupported op: ${op}`, 400);
    }
    out.push({
      op,
      path: typeof r.path === "string" ? r.path : undefined,
      value: r.value,
    });
  }
  return out;
}
