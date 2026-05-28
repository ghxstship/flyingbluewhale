#!/usr/bin/env node
/**
 * Targeted retest of console routes that 5xx'd in the prior smoke run.
 * Confirms transient build artifacts vs real bugs.
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

const TEST_USERS = [
  { role: "manager", email: "mgmt@gvteway.test", password: "CompvssTest2026!" },
  { role: "member", email: "crew@gvteway.test", password: "CompvssTest2026!" },
];

const prior = JSON.parse(readFileSync("/tmp/atlvs-console-smoke-results.json", "utf8"));
const TARGETS = {};
for (const u of prior) {
  if (!u.routes) continue;
  for (const r of u.routes) {
    if (r.status >= 500) {
      TARGETS[u.role] ??= [];
      TARGETS[u.role].push(r.path);
    }
  }
}

async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return { ok: false, error: `${res.status}` };
  return { ok: true, tokens: await res.json() };
}
function cookies(tokens) {
  const ref = new URL(SUPABASE_URL).host.split(".")[0];
  const session = { ...tokens };
  const payload = `base64-${Buffer.from(JSON.stringify(session)).toString("base64")}`;
  return `sb-${ref}-auth-token=${encodeURIComponent(payload)}`;
}
async function hit(p, cookie) {
  try {
    const res = await fetch(`${APP_BASE}${p}`, { redirect: "manual", headers: { Cookie: cookie }, signal: AbortSignal.timeout(15000) });
    return { status: res.status };
  } catch (e) {
    return { status: 0, error: String(e?.message ?? e) };
  }
}

const out = {};
for (const u of TEST_USERS) {
  const sin = await signIn(u.email, u.password);
  if (!sin.ok) {
    out[u.role] = { error: sin.error };
    continue;
  }
  const c = cookies(sin.tokens);
  const list = TARGETS[u.role] ?? [];
  out[u.role] = { total: list.length, results: [] };
  for (const p of list) {
    const r = await hit(p, c);
    out[u.role].results.push({ path: p, status: r.status });
  }
  out[u.role].still5xx = out[u.role].results.filter((r) => r.status >= 500).length;
  out[u.role].recovered = out[u.role].results.filter((r) => r.status >= 200 && r.status < 400).length;
}
console.info(JSON.stringify(out, null, 2));
writeFileSync("/tmp/atlvs-console-retest.json", JSON.stringify(out, null, 2));
