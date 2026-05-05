import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { buildScimUser, parseScimPatch, resolveScimAuth, ScimError, scimErrorResponse } from "@/lib/auth/scim";

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
      headers: { "content-type": "application/scim+json" },
    },
  );
}

type UserRow = { id: string; email: string; name: string | null; created_at: string };

async function fetchScopedUser(orgId: string, userId: string): Promise<UserRow | null> {
  const admin = createServiceClient();
  const { data } = await admin
    .from("memberships")
    .select("users!inner(id, email, name, created_at)")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();
  type Row = { users: UserRow } | null;
  return (data as Row)?.users ?? null;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await resolveScimAuth(req);
  if (!auth) return unauthorized();
  if (!isServiceClientAvailable()) return scimErrorResponse(new ScimError("internal", "Service unavailable", 503));
  const { id } = await params;
  const user = await fetchScopedUser(auth.orgId, id);
  if (!user) return scimErrorResponse(new ScimError("notFound", "User not found", 404));
  return new Response(
    JSON.stringify(
      buildScimUser(
        { id: user.id, email: user.email, display_name: user.name, created_at: user.created_at },
        baseUrl(req),
      ),
    ),
    { status: 200, headers: { "content-type": "application/scim+json" } },
  );
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await resolveScimAuth(req);
  if (!auth) return unauthorized();
  if (!isServiceClientAvailable()) return scimErrorResponse(new ScimError("internal", "Service unavailable", 503));
  const { id } = await params;
  const user = await fetchScopedUser(auth.orgId, id);
  if (!user) return scimErrorResponse(new ScimError("notFound", "User not found", 404));

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return scimErrorResponse(new ScimError("invalidSyntax", "Body must be JSON", 400));
  }
  let ops;
  try {
    ops = parseScimPatch(body);
  } catch (e) {
    if (e instanceof ScimError) return scimErrorResponse(e);
    throw e;
  }

  const admin = createServiceClient();
  const updates: Record<string, unknown> = {};
  let deactivate = false;
  let activate = false;
  for (const op of ops) {
    // Okta sends `path: "active"` or unscoped value-objects on replace ops.
    const path = (op.path ?? "").toLowerCase();
    if (path === "active" || (!path && typeof (op.value as { active?: boolean })?.active === "boolean")) {
      const v = path === "active" ? op.value : (op.value as { active?: boolean }).active;
      if (v === false) deactivate = true;
      if (v === true) activate = true;
    } else if (path === "displayname") {
      if (typeof op.value === "string") updates.name = op.value;
    } else if (!path && typeof op.value === "object" && op.value) {
      const v = op.value as { displayName?: string; name?: { formatted?: string } };
      if (typeof v.displayName === "string") updates.name = v.displayName;
      else if (v.name?.formatted) updates.name = v.name.formatted;
    }
  }

  if (Object.keys(updates).length > 0) {
    await (admin as unknown as import("@/lib/supabase/loose").LooseSupabase).from("users").update(updates).eq("id", id);
  }
  if (deactivate) {
    // Deprovision = remove membership in this org. The user record stays
    // (they may belong to other orgs); only their access to *this* org is
    // revoked.
    await admin.from("memberships").delete().eq("org_id", auth.orgId).eq("user_id", id);
    // Treat deactivation as logical "no longer active" — return active:false
    // in the response by short-circuiting display.
    return new Response(
      JSON.stringify({
        schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
        id,
        userName: user.email,
        active: false,
        meta: { resourceType: "User", lastModified: new Date().toISOString() },
      }),
      { status: 200, headers: { "content-type": "application/scim+json" } },
    );
  }
  if (activate) {
    await (admin as unknown as import("@/lib/supabase/loose").LooseSupabase)
      .from("memberships")
      .upsert({ org_id: auth.orgId, user_id: id, role: "member" }, { onConflict: "org_id,user_id" });
  }

  const fresh = await fetchScopedUser(auth.orgId, id);
  if (!fresh) return scimErrorResponse(new ScimError("notFound", "User not found after patch", 404));
  return new Response(
    JSON.stringify(
      buildScimUser(
        { id: fresh.id, email: fresh.email, display_name: fresh.name, created_at: fresh.created_at },
        baseUrl(req),
      ),
    ),
    { status: 200, headers: { "content-type": "application/scim+json" } },
  );
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await resolveScimAuth(req);
  if (!auth) return unauthorized();
  if (!isServiceClientAvailable()) return scimErrorResponse(new ScimError("internal", "Service unavailable", 503));
  const { id } = await params;
  const admin = createServiceClient();
  // Deprovision = remove membership in this org. We do not delete the user
  // row itself — that would clobber audit trails + cross-org membership.
  await admin.from("memberships").delete().eq("org_id", auth.orgId).eq("user_id", id);
  return new Response(null, { status: 204 });
}
