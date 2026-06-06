// Authenticated HTTP sweep over every enumerated UI route. Records status + redirect.
// Substitutes known seeded IDs for dynamic params. Writes results incrementally.
import { readFileSync, writeFileSync } from "node:fs";
const env = readFileSync("./.env.local", "utf8");
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();
const SUPABASE_URL = get("NEXT_PUBLIC_SUPABASE_URL");
const ANON = get("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const APP_BASE = process.env.APP_BASE ?? "http://localhost:3001";
const ONLY = process.env.ONLY || "static,dynamic"; // which kinds

const { rows } = JSON.parse(readFileSync("/tmp/ui-pages.json", "utf8"));

// Known seeded params (Wynwood org / casa.wynwood owner)
const PARAMS = {
  projectId: "8b88838f-2131-4451-b8b8-0c2a7aa93ca1",
  slug: "casa-wynwood-la-corriente",
  persona: "crew",
  vendorId: "1187c317-a2c4-4c0e-bc65-33be68b363a7",
  poId: "0a245b2b-3688-4068-9480-dcbba0ee4cd1",
  requisitionId: "d72ea43f-b8a0-4758-888a-f7982a76c627",
  proposalId: "03ed8781-6f20-4050-99b5-e07cdafaf062",
  taskId: "cede4258-feda-4b6a-978e-a5eb875932f4",
  itemId: "d4fd71ba-5f5e-4cf5-9636-1038accec956",
  announcementId: "2960a0da-a74a-4cd1-974f-3d41ec96866a",
  assignmentId: "6bbb7550-7f86-4115-a407-d3f091f6808a",
  personId: "2d470e36-8927-41fc-8432-bef1d3e3902a",
  userId: "2d470e36-8927-41fc-8432-bef1d3e3902a",
};
function fillRoute(route) {
  // replace [x] / [...x] with known param or a placeholder
  return route.replace(/\[\.\.\.([^\]]+)\]|\[([^\]]+)\]/g, (m, c1, c2) => {
    const name = c1 || c2;
    return PARAMS[name] || "_";
  });
}

async function signIn() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
    body: JSON.stringify({ email: "casa.wynwood@atlvs.pro", password: "CasaWynwood2026!" }),
  });
  if (!res.ok) throw new Error("signin " + res.status);
  return res.json();
}
function cookie(tokens) {
  const ref = new URL(SUPABASE_URL).host.split(".")[0];
  const s = { access_token: tokens.access_token, token_type: tokens.token_type, expires_in: tokens.expires_in, expires_at: tokens.expires_at, refresh_token: tokens.refresh_token, user: tokens.user };
  return `sb-${ref}-auth-token=${encodeURIComponent("base64-" + Buffer.from(JSON.stringify(s)).toString("base64"))}`;
}

const tokens = await signIn();
const ck = cookie(tokens);
const kinds = ONLY.split(",");
const work = rows.filter((r) => (r.dynamic ? kinds.includes("dynamic") : kinds.includes("static")));
console.log(`sweeping ${work.length} routes (${ONLY})`);

const results = [];
let i = 0;
for (const r of work) {
  i++;
  const url = APP_BASE + fillRoute(r.route);
  const hasPlaceholder = url.includes("/_");
  let status = 0, loc = null, ms = 0;
  const t0 = Date.now();
  try {
    const res = await fetch(url, { headers: { Cookie: ck, "User-Agent": "ui-sweep/1.0" }, redirect: "manual", signal: AbortSignal.timeout(60000) });
    status = res.status; loc = res.headers.get("location"); ms = Date.now() - t0;
  } catch (e) { status = -1; loc = String(e).slice(0, 40); ms = Date.now() - t0; }
  results.push({ shell: r.shell, route: r.route, urlTested: fillRoute(r.route), dynamic: r.dynamic, hasPlaceholder, status, loc, ms });
  if (i % 20 === 0) { writeFileSync("/tmp/ui-sweep-results.json", JSON.stringify(results, null, 1)); console.log(`  ${i}/${work.length} … last ${r.route} → ${status} (${ms}ms)`); }
}
writeFileSync("/tmp/ui-sweep-results.json", JSON.stringify(results, null, 1));
const by = {};
for (const r of results) { const k = r.status; by[k] = (by[k]||0)+1; }
console.log("DONE", work.length, "status breakdown:", JSON.stringify(by));
