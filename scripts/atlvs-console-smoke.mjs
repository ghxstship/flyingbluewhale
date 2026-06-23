#!/usr/bin/env node
/**
 * ATLVS console role-matrix smoke harness — sister to compvss-smoke.mjs.
 *
 * Auto-discovers every page.tsx under src/app/(platform)/studio, derives
 * the URL path (stripping (group) segments + dropping dynamic segments),
 * dedups, and hits each as every test role. Reports HTTP failures, error
 * boundaries, "Configure Supabase" stubs, and unexpected redirects.
 *
 * Run after `npm run dev`. Skips dynamic-segment-only routes (no fixture
 * IDs) — those need targeted browser walkthroughs.
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
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
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const TEST_USERS = [
  { role: "owner", email: "performer@gvteway.test", password: "CompvssTest2026!" },
  { role: "admin", email: "admin@gvteway.test", password: "CompvssTest2026!" },
  { role: "manager", email: "mgmt@gvteway.test", password: "CompvssTest2026!" },
  { role: "member", email: "crew@gvteway.test", password: "CompvssTest2026!" },
];

const ROOT = "src/app/(platform)/studio";

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (name === "page.tsx") out.push(p);
  }
  return out;
}

function pageFileToRoute(file) {
  // strip "src/app/(platform)" prefix and "/page.tsx" suffix
  let r = file.replace(/^src\/app\/\(platform\)/, "").replace(/\/page\.tsx$/, "");
  // strip route-group segments like /(foo)
  r = r.replace(/\/\([^)]+\)/g, "");
  return r;
}

const ALL_FILES = walk(ROOT);
// Skip pure dynamic routes (no fixture IDs available). Static-prefix
// routes with trailing /[id] are also skipped; static portions land
// elsewhere.
const STATIC_ROUTES = Array.from(
  new Set(
    ALL_FILES
      .map(pageFileToRoute)
      .filter((r) => !r.includes("[") && !r.includes("]")),
  ),
).sort();

const STUB_MARKER = /scaffolded but not yet wired/i;

async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return { ok: false, error: `${res.status} ${await res.text().then((t) => t.slice(0, 200))}` };
  return { ok: true, tokens: await res.json() };
}

function buildSupabaseCookies(tokens) {
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

async function hit(routePath, cookieHeader) {
  const url = `${APP_BASE}${routePath}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: { Cookie: cookieHeader, "User-Agent": "atlvs-console-smoke/1.0" },
      signal: AbortSignal.timeout(15000),
    });
    const status = res.status;
    const body = await res.text();
    const hasError =
      /<title>[^<]*\b(Error|404|500)\b/i.test(body) ||
      /Application error: a server-side exception/i.test(body) ||
      /Configure Supabase/i.test(body);
    const isStub = STUB_MARKER.test(body);
    return { status, length: body.length, hasError, isStub, location: res.headers.get("location") };
  } catch (e) {
    return { status: 0, length: 0, hasError: true, isStub: false, error: String(e?.message ?? e) };
  }
}

console.error(`Walking ${STATIC_ROUTES.length} console routes × ${TEST_USERS.length} roles = ${STATIC_ROUTES.length * TEST_USERS.length} checks`);

const results = [];
for (const u of TEST_USERS) {
  const sin = await signIn(u.email, u.password);
  if (!sin.ok) {
    results.push({ role: u.role, email: u.email, error: `signin: ${sin.error}`, routes: [] });
    continue;
  }
  const cookie = buildSupabaseCookies(sin.tokens);
  const out = { role: u.role, email: u.email, routes: [] };
  let i = 0;
  for (const p of STATIC_ROUTES) {
    i++;
    if (i % 50 === 0) process.stderr.write(`  ${u.role}: ${i}/${STATIC_ROUTES.length}\n`);
    const probe = await hit(p, cookie);
    out.routes.push({ path: p, ...probe });
  }
  results.push(out);
}

const summary = {
  total_routes: STATIC_ROUTES.length,
  total_users: TEST_USERS.length,
  per_user: results.map((r) => ({
    role: r.role,
    email: r.email,
    error: r.error,
    ok2xx: r.routes?.filter((x) => x.status >= 200 && x.status < 300 && !x.hasError).length ?? 0,
    redirect3xx: r.routes?.filter((x) => x.status >= 300 && x.status < 400).length ?? 0,
    client4xx: r.routes?.filter((x) => x.status >= 400 && x.status < 500).length ?? 0,
    server_error5xx: r.routes?.filter((x) => x.status >= 500).length ?? 0,
    boundary_error: r.routes?.filter((x) => x.hasError && x.status >= 200 && x.status < 300).length ?? 0,
    stubs: r.routes?.filter((x) => x.isStub).length ?? 0,
    network_errors: r.routes?.filter((x) => x.status === 0).length ?? 0,
  })),
  failures: results.flatMap(
    (r) =>
      r.routes
        ?.filter(
          (x) =>
            x.status === 0 ||
            x.status >= 500 ||
            (x.hasError && x.status >= 200 && x.status < 300) ||
            x.isStub,
        )
        .map((x) => ({
          role: r.role,
          path: x.path,
          status: x.status,
          hasError: x.hasError,
          isStub: x.isStub,
          error: x.error,
          location: x.location,
        })) ?? [],
  ),
};

console.info(JSON.stringify(summary, null, 2));
writeFileSync("/tmp/atlvs-console-smoke-results.json", JSON.stringify(results, null, 2));
console.error(`\nFull report → /tmp/atlvs-console-smoke-results.json`);
