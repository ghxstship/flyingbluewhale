// Guide access tokens — public-link-plus-code gate for internal personas.
//
// Two responsibilities:
//   1. Generate + hash human-typeable access codes (Crockford base32, grouped).
//   2. Mint + verify a per-project signed JWT cookie that records which
//      personas the bearer has unlocked. Stored httpOnly; rotating
//      GUIDE_ACCESS_SECRET invalidates every outstanding token.
//
// The token format is a compact HMAC-SHA256 JWS (header.payload.signature),
// base64url everywhere. We don't pull in `jose` or `jsonwebtoken` for this —
// the Web Crypto API on Edge + Node is enough and avoids a runtime branch.

import { env } from "@/lib/env";
import type { GuidePersona } from "./types";

const TOKEN_TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days
const COOKIE_NAME_PREFIX = "guide_access_"; // suffix = projectId

export const GUIDE_ACCESS_TTL_SECONDS = TOKEN_TTL_SECONDS;

export function cookieName(projectId: string): string {
  return `${COOKIE_NAME_PREFIX}${projectId}`;
}

// ─── Code generation ────────────────────────────────────────────────────────

// Crockford base32, dropping ambiguous characters (I, L, O, U). 28 symbols.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * Generate a 10-character base32 code grouped as `XXXX-XXXX-XX`. Uses
 * cryptographic randomness so codes are unguessable; the modulo bias for a
 * 32-symbol alphabet sampled from 256 values is negligible (256 / 32 = 8
 * exactly, no bias).
 */
export function generateCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  const chars = Array.from(bytes, (b) => ALPHABET[b & 31]).join("");
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 10)}`;
}

/**
 * Normalize user-typed input: uppercase, strip dashes/whitespace,
 * map common ambiguous typos (I→1, L→1, O→0, U→V) back into the alphabet.
 */
export function normalizeCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .replace(/I/g, "1")
    .replace(/L/g, "1")
    .replace(/O/g, "0")
    .replace(/U/g, "V");
}

export function codePrefix(plainCode: string): string {
  // First 4 chars of the *display* form (with the dash group). Used in
  // the console to disambiguate codes without re-revealing the secret.
  const norm = normalizeCode(plainCode);
  return norm.slice(0, 4);
}

export async function hashCode(plainCode: string): Promise<string> {
  const normalized = normalizeCode(plainCode);
  const bytes = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── JWS (HMAC-SHA256) ──────────────────────────────────────────────────────

type TokenPayload = {
  // Project ID this token is bound to.
  pid: string;
  // Personas this bearer has unlocked. We allow multiple so a user who has
  // codes for both `crew` and `vendor` (e.g. an FOH lead) can keep both.
  per: GuidePersona[];
  // Standard JWT claims.
  iat: number;
  exp: number;
  jti: string;
};

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string): Uint8Array {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function secret(): Uint8Array {
  // Dev fallback so cookies survive `next dev` restarts. Production must
  // set GUIDE_ACCESS_SECRET — rotate it to invalidate every token.
  const s =
    env.GUIDE_ACCESS_SECRET ??
    (process.env.NODE_ENV === "development" ? "dev-only-guide-access-secret-do-not-use-in-prod" : "");
  if (!s) {
    throw new Error("GUIDE_ACCESS_SECRET is not configured");
  }
  return new TextEncoder().encode(s);
}

async function hmac(input: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    secret() as unknown as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, input as unknown as ArrayBuffer);
  return new Uint8Array(sig);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a[i]! ^ b[i]!;
  return out === 0;
}

export async function mintToken(args: {
  projectId: string;
  personas: GuidePersona[];
  ttlSeconds?: number;
}): Promise<{ token: string; jti: string; expSeconds: number }> {
  const now = Math.floor(Date.now() / 1000);
  const ttl = args.ttlSeconds ?? TOKEN_TTL_SECONDS;
  const jti = b64urlEncode(crypto.getRandomValues(new Uint8Array(16)));
  const payload: TokenPayload = {
    pid: args.projectId,
    per: dedupePersonas(args.personas),
    iat: now,
    exp: now + ttl,
    jti,
  };
  const headerB64 = b64urlEncode(new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payloadB64 = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const signing = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const sig = await hmac(signing);
  const token = `${headerB64}.${payloadB64}.${b64urlEncode(sig)}`;
  return { token, jti, expSeconds: ttl };
}

export async function verifyToken(
  token: string | undefined | null,
  expectedProjectId: string,
): Promise<{ personas: GuidePersona[]; jti: string } | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  // parts.length === 3 checked above.
  const headerB64 = parts[0]!;
  const payloadB64 = parts[1]!;
  const sigB64 = parts[2]!;
  let signing: Uint8Array;
  let sigBytes: Uint8Array;
  try {
    signing = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    sigBytes = b64urlDecode(sigB64);
  } catch {
    return null;
  }
  const expected = await hmac(signing);
  if (!constantTimeEqual(expected, sigBytes)) return null;
  let payload: TokenPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64)));
  } catch {
    return null;
  }
  if (!payload || payload.pid !== expectedProjectId) return null;
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp < now) return null;
  const personas = Array.isArray(payload.per) ? (payload.per.filter(Boolean) as GuidePersona[]) : [];
  if (personas.length === 0) return null;
  return { personas, jti: payload.jti };
}

function dedupePersonas(list: GuidePersona[]): GuidePersona[] {
  return Array.from(new Set(list));
}

// ─── Policy table ───────────────────────────────────────────────────────────

// Public-tier personas are anon-readable when `event_guides.published=true`
// — no code required. Everyone else needs either an org session or a
// redeemed access code.
const PUBLIC_PERSONAS = new Set<GuidePersona>(["guest", "custom"]);

export function isPublicPersona(persona: GuidePersona): boolean {
  return PUBLIC_PERSONAS.has(persona);
}
