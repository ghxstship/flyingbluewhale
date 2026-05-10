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
  // .is("deleted_at", null) so a soft-deleted (deprovisioned) user
  // returns 404 to the IdP instead of looking still-active.
  const { data } = await admin
    .from("memberships")
    .select("users!inner(id, email, name, created_at)")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .is("deleted_at", null)
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
    // .is("deleted_at", null) — refuse to update a soft-deleted
    // user's display name. /api/v1/me/delete scrubs name/email to
    // "Deleted user" / "deleted-*@*"; without this filter a SCIM
    // sync from the IdP would silently un-scrub the row.
    await (admin as unknown as import("@/lib/supabase/loose").LooseSupabase)
      .from("users")
      .update(updates)
      .eq("id", id)
      .is("deleted_at", null);
  }
  if (deactivate) {
    // Deprovision = soft-revoke this org's membership. Soft delete
    // (deleted_at) preserves the audit trail of when offboarded by
    // which IdP — hard delete erased the row, losing that record
    // and any audit_log target_id references.
    await (admin as unknown as import("@/lib/supabase/loose").LooseSupabase)
      .from("memberships")
      .update({ deleted_at: new Date().toISOString() })
      .eq("org_id", auth.orgId)
      .eq("user_id", id)
      .is("deleted_at", null);
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
    // Activation: clear deleted_at when restoring. Without it an
    // upsert with onConflict skips deleted_at and a previously
    // soft-deleted user stays offboarded even though SCIM reported
    // success.
    await (admin as unknown as import("@/lib/supabase/loose").LooseSupabase)
      .from("memberships")
      .upsert({ org_id: auth.orgId, user_id: id, role: "member", deleted_at: null }, { onConflict: "org_id,user_id" });
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
  // Deprovision = soft-revoke this org's membership. Soft delete
  // preserves the audit trail of when offboarded by which IdP. We
  // do not delete the user row itself — they may belong to other
  // orgs.
  await (admin as unknown as import("@/lib/supabase/loose").LooseSupabase)
    .from("memberships")
    .update({ deleted_at: new Date().toISOString() })
    .eq("org_id", auth.orgId)
    .eq("user_id", id)
    .is("deleted_at", null);
  return new Response(null, { status: 204 });
}
