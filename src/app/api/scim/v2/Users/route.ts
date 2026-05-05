import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import {
  buildScimListResponse,
  buildScimUser,
  parseScimFilter,
  resolveScimAuth,
  ScimError,
  scimErrorResponse,
} from "@/lib/auth/scim";

export const dynamic = "force-dynamic";

function baseUrl(req: Request): string {
  const u = new URL(req.url);
  return `${u.protocol}//${u.host}`;
}

async function unauthorized(): Promise<Response> {
  return new Response(
    JSON.stringify({
      schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
      detail: "Invalid SCIM token",
      status: "401",
    }),
    {
      status: 401,
      headers: { "content-type": "application/scim+json", "www-authenticate": 'Bearer realm="scim"' },
    },
  );
}

// ─── GET /scim/v2/Users — list ───────────────────────────────────────
export async function GET(req: Request) {
  const auth = await resolveScimAuth(req);
  if (!auth) return unauthorized();
  if (!isServiceClientAvailable()) return scimErrorResponse(new ScimError("internal", "Service unavailable", 503));

  const url = new URL(req.url);
  const startIndex = Math.max(1, Number.parseInt(url.searchParams.get("startIndex") ?? "1", 10) || 1);
  const count = Math.min(200, Math.max(1, Number.parseInt(url.searchParams.get("count") ?? "100", 10) || 100));
  const filterRaw = url.searchParams.get("filter");

  let filter;
  try {
    filter = parseScimFilter(filterRaw);
  } catch (e) {
    if (e instanceof ScimError) return scimErrorResponse(e);
    throw e;
  }

  const admin = createServiceClient();
  // Scope to users who are members of the SCIM-token's org.
  let q = admin
    .from("memberships")
    .select("user_id, users!inner(id, email, name, created_at)", { count: "exact" })
    .eq("org_id", auth.orgId);

  if (filter?.op === "eq" && (filter.attr === "userName" || filter.attr === "emails.value")) {
    q = q.eq("users.email", filter.value);
  } else if (filter?.op === "eq" && filter.attr === "id") {
    q = q.eq("users.id", filter.value);
  } else if (filter?.op === "pr" && filter.attr === "userName") {
    q = q.not("users.email", "is", null);
  }

  const from = startIndex - 1;
  const to = from + count - 1;
  q = q.range(from, to);

  const { data, error, count: total } = await q;
  if (error) return scimErrorResponse(new ScimError("internal", error.message, 500));

  type Row = { user_id: string; users: { id: string; email: string; name: string | null; created_at: string } };
  const rows = (data ?? []) as unknown as Row[];
  const resources = rows.map((r) =>
    buildScimUser(
      {
        id: r.users.id,
        email: r.users.email,
        display_name: r.users.name,
        created_at: r.users.created_at,
      },
      baseUrl(req),
    ),
  );

  return new Response(JSON.stringify(buildScimListResponse(resources, startIndex, resources.length, total ?? 0)), {
    status: 200,
    headers: { "content-type": "application/scim+json" },
  });
}

// ─── POST /scim/v2/Users — create ────────────────────────────────────
export async function POST(req: Request) {
  const auth = await resolveScimAuth(req);
  if (!auth) return unauthorized();
  if (!isServiceClientAvailable()) return scimErrorResponse(new ScimError("internal", "Service unavailable", 503));

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return scimErrorResponse(new ScimError("invalidSyntax", "Body must be JSON", 400));
  }
  const userName = typeof body.userName === "string" ? body.userName.toLowerCase().trim() : "";
  if (!userName) return scimErrorResponse(new ScimError("invalidValue", "userName required", 400));

  const name = (body.name ?? {}) as { givenName?: string; familyName?: string };
  const display =
    (typeof body.displayName === "string" && body.displayName) ||
    [name.givenName, name.familyName].filter(Boolean).join(" ") ||
    null;
  const active = body.active !== false;

  const admin = createServiceClient();

  // Idempotent: if a user already exists with this email, just ensure
  // membership in the org.
  const { data: existing } = await admin
    .from("users")
    .select("id, email, name, created_at")
    .eq("email", userName)
    .maybeSingle();
  let userId: string;
  let row: { id: string; email: string; name: string | null; created_at: string };
  if (existing) {
    row = existing as { id: string; email: string; name: string | null; created_at: string };
    userId = row.id;
    if (!row.name && display) {
      await admin.from("users").update({ name: display }).eq("id", userId);
      row.name = display;
    }
  } else {
    // We don't create auth.users entries here — that requires an email
    // delivery flow. The SCIM contract says "create the user record so
    // future references resolve"; first-time login through SAML will
    // attach an auth.users row (Supabase mints one) and link via the
    // shared id. For now we insert into public.users with a generated id;
    // the trigger handles the auth-side row when the user actually signs in.
    const newId = crypto.randomUUID();
    const { data: created, error } = await admin
      .from("users")
      .insert({ id: newId, email: userName, name: display })
      .select("id, email, name, created_at")
      .single();
    if (error || !created)
      return scimErrorResponse(new ScimError("uniqueness", error?.message ?? "Insert failed", 409));
    row = created as { id: string; email: string; name: string | null; created_at: string };
    userId = row.id;
  }

  // Ensure membership. Inactive users get no membership (SCIM deactivation == access removal).
  if (!active) {
    await admin.from("memberships").delete().eq("org_id", auth.orgId).eq("user_id", userId);
  } else {
    const { error: memErr } = await (admin as unknown as import("@/lib/supabase/loose").LooseSupabase)
      .from("memberships")
      .upsert({ org_id: auth.orgId, user_id: userId, role: "member" }, { onConflict: "org_id,user_id" });
    if (memErr) return scimErrorResponse(new ScimError("internal", memErr.message, 500));
  }
  const resource = buildScimUser(
    { id: row.id, email: row.email, display_name: row.name, created_at: row.created_at },
    baseUrl(req),
  );

  return new Response(JSON.stringify(resource), {
    status: 201,
    headers: { "content-type": "application/scim+json", location: `${baseUrl(req)}/scim/v2/Users/${userId}` },
  });
}
