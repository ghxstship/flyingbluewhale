#!/usr/bin/env node
/**
 * COMPVSS role-matrix smoke harness — exercises every /m route under each
 * test role through real auth cookies set against a running dev server.
 *
 * For each of the 4 test users:
 *   1. POST /api/v1/auth/login (or signInWithPassword via supabase REST)
 *      to mint a session cookie pair.
 *   2. GET each /m/* route with the cookie jar.
 *   3. Report status + a snippet of returned HTML so we can confirm the
 *      page rendered the expected primitive (no error boundaries).
 *
 * Run after `npm run dev`. Reads SUPABASE_URL + ANON from .env.local.
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

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

// Test users mapped to ADR-0009 MobileRole values. The platform `role`
// field stays for legacy reporting; `mobileRole` is what the smoke
// matrix uses to pick which surfaces to exercise per user. Run with
// SMOKE_MODE=legacy to fall back to "every route × every user" — the
// pre-ADR-0009 188-check matrix — for regression diffing.
const TEST_USERS = [
  { role: "owner", mobileRole: "performer", email: "performer@gvteway.test", password: "CompvssTest2026!" },
  { role: "admin", mobileRole: "admin", email: "admin@gvteway.test", password: "CompvssTest2026!" },
  { role: "manager", mobileRole: "guard", email: "mgmt@gvteway.test", password: "CompvssTest2026!" },
  { role: "member", mobileRole: "crew", email: "crew@gvteway.test", password: "CompvssTest2026!" },
];

const SMOKE_MODE = process.env.SMOKE_MODE === "legacy" ? "legacy" : "role-matrix";

// Every /m route under test. `expect` is the unique title text the page
// must render (case-insensitive substring match against the response
// body). If a page returns 200 but its expected title isn't present we
// flag it — that catches stubs, error boundaries that swallowed the
// crash, and accidental redirects-to-empty.
const ROUTES = [
  { path: "/m", label: "Home", expect: "field" },
  { path: "/m/gate", label: "Gate", expect: "gate" },
  { path: "/m/shift", label: "Shift", expect: "shift" },
  { path: "/m/alerts", label: "Alerts", expect: "alerts" },
  { path: "/m/settings", label: "Me / Settings", expect: "settings|sign out|preferences" },
  // Workforce-parity surfaces (0046/0047)
  { path: "/m/feed", label: "Updates feed", expect: "updates" },
  { path: "/m/inbox", label: "Inbox", expect: "inbox" },
  { path: "/m/learning", label: "Learning", expect: "learning" },
  { path: "/m/time-off", label: "Time off list", expect: "time off" },
  { path: "/m/time-off/new", label: "Time off form", expect: "new time-off request" },
  { path: "/m/kudos", label: "Kudos", expect: "kudos" },
  { path: "/m/polls", label: "Polls", expect: "polls" },
  { path: "/m/surveys", label: "Surveys list", expect: "surveys" },
  { path: "/m/docs", label: "My docs", expect: "my documents" },
  { path: "/m/docs/new", label: "Upload doc form", expect: "upload document" },
  { path: "/m/directory", label: "Directory", expect: "directory" },
  { path: "/m/onboarding", label: "Onboarding", expect: "onboarding" },
  { path: "/m/advances", label: "My advancing (mobile)", expect: "my assignments" },
  { path: "/m/settings/notifications", label: "Notif prefs", expect: "notifications" },
  // Existing field-ops surfaces
  { path: "/m/clock", label: "Time clock", expect: "check-in" },
  { path: "/m/shift/swap", label: "Shift swap", expect: "swap shift" },
  { path: "/m/check-in", label: "Check-in", expect: "scan ticket|check in|check-in" },
  { path: "/m/incidents", label: "Incidents", expect: "incident" },
  { path: "/m/incidents/new", label: "Incident form", expect: "incident report|new incident|report incident" },
  // Kit 29 §C: /m/incident is an alias of /m/incidents — one shared surface
  // (the alias opens preset to the "My Reports" filter, applied client-side).
  { path: "/m/incident", label: "My incidents (alias)", expect: "incident" },
  { path: "/m/incident/new", label: "Quick-file incident", expect: "quick file" },
  { path: "/m/checkin", label: "Check-in summary", expect: "check-in summary" },
  { path: "/m/medic", label: "Medic", expect: "medic" },
  { path: "/m/medic/new", label: "Medic form", expect: "medical|new" },
  { path: "/m/safeguarding", label: "Safeguarding", expect: "safeguard" },
  { path: "/m/driver", label: "Driver", expect: "driver|run" },
  { path: "/m/ad", label: "A&D", expect: "a&d|advance|withdraw|consumption" },
  { path: "/m/ros", label: "Run of Show", expect: "run of show|ros" },
  { path: "/m/guard", label: "Guard", expect: "guard" },
  { path: "/m/wms", label: "Warehouse", expect: "warehouse|wms|stock" },
  { path: "/m/punch", label: "Punch list", expect: "punch list" },
  { path: "/m/daily-log", label: "Daily log", expect: "daily log" },
  { path: "/m/handover", label: "Handover", expect: "handover" },
  { path: "/m/requests", label: "Requests", expect: "request" },
  { path: "/m/requests/new", label: "Request form", expect: "new request|submit" },
  { path: "/m/coc", label: "Chain of custody", expect: "chain of custody|custody" },
  { path: "/m/wayfind", label: "Wayfind", expect: "wayfind|map" },
  { path: "/m/gigs", label: "Open gigs", expect: "gigs|open" },
  { path: "/m/wallet", label: "Wallet", expect: "wallet|credential" },
  { path: "/m/crew", label: "Crew", expect: "crew" },
  { path: "/m/crew/clock", label: "Crew clock", expect: "clock" },
  { path: "/m/inventory/scan", label: "Inventory scan", expect: "scan|inventory" },
  { path: "/m/notifications", label: "Notifications", expect: "notification" },
  { path: "/m/guide", label: "Guide", expect: "guide|boarding" },
];

const STUB_MARKER = /scaffolded but not yet wired/i;

// ADR-0009 Migration #4 — role × surface matrix replaces the prior 47×4
// "every route × every user" sweep. Each role's surface list is the
// union of its tab bar + role-priority tools (from ROLE_PRIORITY_HREFS
// in src/lib/nav.ts) + a handful of universally-needed surfaces (Home,
// Inbox, Settings, Guide). Admin tests the full surface list since
// their role is "touches everything".
const UNIVERSAL_ROUTES = ["/m", "/m/inbox", "/m/alerts", "/m/settings", "/m/guide"];
const ROLE_SURFACES = {
  performer: [
    ...UNIVERSAL_ROUTES,
    "/m/performer",
    "/m/shift",
    "/m/advances",
    "/m/feed",
    "/m/time-off",
    "/m/docs",
    "/m/kudos",
    "/m/learning",
  ],
  crew: [
    ...UNIVERSAL_ROUTES,
    "/m/crew",
    "/m/shift",
    "/m/clock",
    "/m/ros",
    "/m/daily-log",
    "/m/punch",
    "/m/time-off",
    "/m/feed",
    "/m/kudos",
    "/m/docs",
    "/m/directory",
    "/m/learning",
  ],
  driver: [
    ...UNIVERSAL_ROUTES,
    "/m/driver",
    "/m/wayfind",
    "/m/ad",
    "/m/handover",
    "/m/coc",
    "/m/wms",
  ],
  medic: [...UNIVERSAL_ROUTES, "/m/medic", "/m/medic/new", "/m/safeguarding", "/m/incidents"],
  guard: [
    ...UNIVERSAL_ROUTES,
    "/m/guard",
    "/m/gate",
    "/m/incidents",
    "/m/incidents/new",
    "/m/incident",
    "/m/incident/new",
    "/m/wallet",
    "/m/check-in",
  ],
  admin: null, // null = "test every route" — admin touches everything
};

function routesForUser(user) {
  if (SMOKE_MODE === "legacy") return ROUTES;
  const list = ROLE_SURFACES[user.mobileRole];
  if (list === null || list === undefined) return ROUTES; // admin → full
  const byPath = new Map(ROUTES.map((r) => [r.path, r]));
  return list.map((p) => byPath.get(p) ?? { path: p, label: p, expect: "" }).filter(Boolean);
}

async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    return { ok: false, error: `${res.status} ${await res.text().then((t) => t.slice(0, 200))}` };
  }
  const tokens = await res.json();
  return { ok: true, tokens };
}

function buildSupabaseCookies(tokens) {
  // Mirror @supabase/ssr's cookie shape — `sb-<ref>-auth-token` carries
  // the full session JSON. Project ref is the host's first segment.
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
  // Most installs use a single cookie. Some chunk it; the server reads
  // both with @supabase/ssr. We set the unchunked variant.
  return [`sb-${ref}-auth-token=${encodeURIComponent(payload)}`].join("; ");
}

async function hit(routePath, cookieHeader, expectRe) {
  const url = `${APP_BASE}${routePath}`;
  const res = await fetch(url, {
    method: "GET",
    redirect: "manual",
    headers: { Cookie: cookieHeader, "User-Agent": "compvss-smoke/1.0" },
  });
  const status = res.status;
  let body = "";
  try {
    body = await res.text();
  } catch {}
  // Detect Next error boundary
  const hasError =
    /<title>[^<]*\b(Error|404|500)\b/i.test(body) ||
    /Application error: a server-side exception/i.test(body) ||
    /Configure Supabase/i.test(body);
  const isStub = STUB_MARKER.test(body);
  const expectFound = expectRe ? expectRe.test(body) : true;
  return {
    status,
    length: body.length,
    hasError,
    isStub,
    expectFound,
    location: res.headers.get("location"),
  };
}

const results = [];
for (const u of TEST_USERS) {
  if (!u.password) {
    results.push({ role: u.role, email: u.email, error: "missing password", routes: [] });
    continue;
  }
  const signIn1 = await signIn(u.email, u.password);
  if (!signIn1.ok) {
    results.push({ role: u.role, email: u.email, error: `signin: ${signIn1.error}`, routes: [] });
    continue;
  }
  const cookie = buildSupabaseCookies(signIn1.tokens);
  const out = { role: u.role, mobileRole: u.mobileRole, email: u.email, routes: [] };
  const targetRoutes = routesForUser(u);
  for (const r of targetRoutes) {
    const expectRe = r.expect ? new RegExp(r.expect, "i") : null;
    const probe = await hit(r.path, cookie, expectRe);
    out.routes.push({ path: r.path, label: r.label, ...probe });
  }
  results.push(out);
}

const totalChecks = results.reduce((acc, r) => acc + (r.routes?.length ?? 0), 0);
const summary = {
  mode: SMOKE_MODE,
  total_routes: ROUTES.length,
  total_users: TEST_USERS.filter((u) => u.password).length,
  total_checks: totalChecks,
  per_user: results.map((r) => ({
    role: r.role,
    mobileRole: r.mobileRole,
    email: r.email,
    error: r.error,
    routes_tested: r.routes?.length ?? 0,
    ok2xx: r.routes?.filter((x) => x.status >= 200 && x.status < 300 && !x.hasError).length ?? 0,
    redirect3xx: r.routes?.filter((x) => x.status >= 300 && x.status < 400).length ?? 0,
    server_error5xx: r.routes?.filter((x) => x.status >= 500).length ?? 0,
    boundary_error: r.routes?.filter((x) => x.hasError && x.status >= 200 && x.status < 300).length ?? 0,
    stubs: r.routes?.filter((x) => x.isStub).length ?? 0,
    missing_expected: r.routes?.filter((x) => x.status >= 200 && x.status < 300 && !x.hasError && !x.isStub && !x.expectFound).length ?? 0,
  })),
  failures: results.flatMap(
    (r) =>
      r.routes
        ?.filter(
          (x) =>
            x.status >= 500 ||
            (x.hasError && x.status >= 200 && x.status < 300) ||
            x.isStub ||
            (x.status >= 200 && x.status < 300 && !x.hasError && !x.expectFound),
        )
        .map((x) => ({
          role: r.role,
          path: x.path,
          label: x.label,
          status: x.status,
          hasError: x.hasError,
          isStub: x.isStub,
          missing_expected: !x.expectFound,
          location: x.location,
        })) ?? [],
  ),
};

console.info(JSON.stringify(summary, null, 2));
writeFileSync("/tmp/compvss-smoke-results.json", JSON.stringify(results, null, 2));
console.error(`\nFull report → /tmp/compvss-smoke-results.json`);
