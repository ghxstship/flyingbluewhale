#!/usr/bin/env node
/**
 * GVTEWAY portal route-render smoke. Sister to scripts/compvss-smoke.mjs
 * — same auth flow, but covers /p/[slug]/* surfaces with a real share-
 * link-resolvable project slug.
 *
 * Picks the first non-deleted project in the demo org as the slug, signs
 * in as each of the 4 test users, and GETs every portal route with a
 * uniqueness check on the page's expected text.
 *
 * Run after `npm run dev` is up and warm.
 */

import { readFileSync, writeFileSync } from "node:fs";

const APP_BASE = process.env.APP_BASE ?? "http://localhost:3000";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !ANON) {
  console.error("missing supabase env");
  process.exit(1);
}

const TEST_USERS = [
  { role: "owner", email: "performer@gvteway.test", password: "CompvssTest2026!" },
  { role: "admin", email: "admin@gvteway.test", password: "CompvssTest2026!" },
  { role: "manager", email: "mgmt@gvteway.test", password: "CompvssTest2026!" },
  { role: "member", email: "crew@gvteway.test", password: "CompvssTest2026!" },
];

// Real project slug in the demo org — verified to resolve via
// projectIdFromSlug. Hard-coded so the harness doesn't need a DB round
// trip to discover.
const SLUG = process.env.PORTAL_SLUG ?? "mmw26-hialeah";

const ROUTES = [
  // Shared portal-wide surfaces.
  { path: `/p/${SLUG}`, label: "Portal gateway", expect: "portal|gateway" },
  { path: `/p/${SLUG}/announcements`, label: "Updates feed", expect: "updates" },
  { path: `/p/${SLUG}/inbox`, label: "Notifications inbox", expect: "inbox" },
  { path: `/p/${SLUG}/tasks`, label: "Portal tasks", expect: "my tasks" },
  { path: `/p/${SLUG}/messages`, label: "Portal messages", expect: "messages" },
  { path: `/p/${SLUG}/guide`, label: "Boarding pass", expect: "guide|boarding" },
  { path: `/p/${SLUG}/overview`, label: "Project overview", expect: "overview" },

  // Per-persona indexes.
  { path: `/p/${SLUG}/artist`, label: "Artist", expect: "artist" },
  { path: `/p/${SLUG}/athlete`, label: "Athlete", expect: "athlete" },
  { path: `/p/${SLUG}/client`, label: "Client", expect: "client" },
  { path: `/p/${SLUG}/crew`, label: "Crew", expect: "crew" },
  { path: `/p/${SLUG}/delegation`, label: "Delegation", expect: "delegation" },
  { path: `/p/${SLUG}/guest`, label: "Guest", expect: "guest" },
  { path: `/p/${SLUG}/hospitality`, label: "Hospitality", expect: "hospitality" },
  { path: `/p/${SLUG}/media`, label: "Media", expect: "media" },
  { path: `/p/${SLUG}/producer`, label: "Producer", expect: "producer" },
  { path: `/p/${SLUG}/promoter`, label: "Promoter", expect: "promoter" },
  { path: `/p/${SLUG}/sponsor`, label: "Sponsor", expect: "sponsor" },
  { path: `/p/${SLUG}/stakeholder`, label: "Stakeholder", expect: "stakeholder" },
  { path: `/p/${SLUG}/vendor`, label: "Vendor", expect: "vendor" },
  { path: `/p/${SLUG}/vip`, label: "VIP", expect: "vip" },
  { path: `/p/${SLUG}/volunteer`, label: "Volunteer", expect: "volunteer" },

  // Persona sub-routes — high-value samples (full coverage would be
  // 60+ rows; we exercise the new + critical ones here).
  { path: `/p/${SLUG}/crew/advances`, label: "Crew advancing", expect: "advancing" },
  { path: `/p/${SLUG}/crew/call-sheet`, label: "Crew call-sheet", expect: "call.sheet|crew" },
  { path: `/p/${SLUG}/artist/advancing`, label: "Artist advancing", expect: "advancing|rider" },
  { path: `/p/${SLUG}/vendor/submissions`, label: "Vendor submissions", expect: "submission" },
  { path: `/p/${SLUG}/vendor/purchase-orders`, label: "Vendor POs", expect: "purchase order|po" },
  { path: `/p/${SLUG}/sponsor/activations`, label: "Sponsor activations", expect: "activation" },
  { path: `/p/${SLUG}/sponsor/assets`, label: "Sponsor assets", expect: "asset" },
  { path: `/p/${SLUG}/client/messages`, label: "Client messages", expect: "message" },
  { path: `/p/${SLUG}/client/files`, label: "Client files", expect: "file" },
  { path: `/p/${SLUG}/client/invoices`, label: "Client invoices", expect: "invoice" },
  { path: `/p/${SLUG}/delegation/visa`, label: "Delegation visa", expect: "visa" },
  { path: `/p/${SLUG}/delegation/meetings`, label: "Delegation meetings", expect: "meeting" },
  { path: `/p/${SLUG}/media/info`, label: "Media info", expect: "info|media" },
  { path: `/p/${SLUG}/volunteer/schedule`, label: "Volunteer schedule", expect: "schedule" },
  { path: `/p/${SLUG}/vip/itinerary`, label: "VIP itinerary", expect: "itinerary" },
  { path: `/p/${SLUG}/guest/schedule`, label: "Guest schedule", expect: "schedule" },
  { path: `/p/${SLUG}/producer/portfolio`, label: "Producer portfolio", expect: "portfolio" },
  { path: `/p/${SLUG}/producer/risk`, label: "Producer risk", expect: "risk register" },
  { path: `/p/${SLUG}/producer/approvals`, label: "Producer approvals", expect: "approvals" },
  { path: `/p/${SLUG}/producer/pnl`, label: "Producer P&L", expect: "p&l|p&amp;l" },
  { path: `/p/${SLUG}/promoter/settlements`, label: "Promoter settlements", expect: "settlement" },
  { path: `/p/${SLUG}/promoter/co-pro`, label: "Promoter co-pro", expect: "co-pro" },
  { path: `/p/${SLUG}/promoter/tour-pnl`, label: "Promoter tour P&L", expect: "tour p&l|tour p&amp;l" },
  { path: `/p/${SLUG}/promoter/marketing`, label: "Promoter marketing", expect: "marketing" },
  { path: `/p/${SLUG}/promoter/approvals`, label: "Promoter approvals", expect: "approvals" },
];

const STUB_MARKER = /scaffolded but not yet wired/i;

async function signIn(email, password) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) return { ok: false, error: `${r.status} ${await r.text().then((t) => t.slice(0, 200))}` };
  return { ok: true, tokens: await r.json() };
}

function buildCookies(tokens) {
  const ref = new URL(SUPABASE_URL).host.split(".")[0];
  const session = {
    access_token: tokens.access_token,
    token_type: tokens.token_type,
    expires_in: tokens.expires_in,
    expires_at: tokens.expires_at,
    refresh_token: tokens.refresh_token,
    user: tokens.user,
  };
  const payload = `base64-${Buffer.from(JSON.stringify(session)).toString("base64")}`;
  return `sb-${ref}-auth-token=${encodeURIComponent(payload)}`;
}

async function hit(path, cookie, expectRe) {
  const r = await fetch(`${APP_BASE}${path}`, {
    method: "GET",
    redirect: "manual",
    headers: { Cookie: cookie, "User-Agent": "gvteway-smoke/1.0" },
  });
  const body = await r.text().catch(() => "");
  return {
    status: r.status,
    length: body.length,
    hasError:
      /<title>[^<]*\b(Error|404|500)\b/i.test(body) ||
      /Application error: a server-side exception/i.test(body) ||
      /Configure Supabase/i.test(body),
    isStub: STUB_MARKER.test(body),
    expectFound: expectRe ? expectRe.test(body) : true,
    location: r.headers.get("location"),
  };
}

const results = [];
for (const u of TEST_USERS) {
  const s = await signIn(u.email, u.password);
  if (!s.ok) {
    results.push({ role: u.role, email: u.email, error: s.error, routes: [] });
    continue;
  }
  const cookie = buildCookies(s.tokens);
  const out = { role: u.role, email: u.email, routes: [] };
  for (const r of ROUTES) {
    const re = r.expect ? new RegExp(r.expect, "i") : null;
    const probe = await hit(r.path, cookie, re);
    out.routes.push({ path: r.path, label: r.label, ...probe });
  }
  results.push(out);
}

const summary = {
  slug: SLUG,
  total_routes: ROUTES.length,
  per_user: results.map((r) => ({
    role: r.role,
    email: r.email,
    error: r.error,
    ok2xx: r.routes?.filter((x) => x.status >= 200 && x.status < 300 && !x.hasError).length ?? 0,
    redirect3xx: r.routes?.filter((x) => x.status >= 300 && x.status < 400).length ?? 0,
    not_found_4xx: r.routes?.filter((x) => x.status === 404).length ?? 0,
    server_error5xx: r.routes?.filter((x) => x.status >= 500).length ?? 0,
    boundary_error: r.routes?.filter((x) => x.hasError && x.status >= 200 && x.status < 300).length ?? 0,
    stubs: r.routes?.filter((x) => x.isStub).length ?? 0,
    missing_expected: r.routes?.filter((x) => x.status >= 200 && x.status < 300 && !x.hasError && !x.isStub && !x.expectFound).length ?? 0,
  })),
  failures: results.flatMap(
    (r) =>
      r.routes
        ?.filter((x) => x.status >= 500 || (x.hasError && x.status >= 200 && x.status < 300) || x.isStub)
        .map((x) => ({ role: r.role, path: x.path, label: x.label, status: x.status, hasError: x.hasError, isStub: x.isStub })) ?? [],
  ),
};

console.info(JSON.stringify(summary, null, 2));
writeFileSync("/tmp/gvteway-smoke-results.json", JSON.stringify(results, null, 2));
console.error(`\nFull report → /tmp/gvteway-smoke-results.json`);
