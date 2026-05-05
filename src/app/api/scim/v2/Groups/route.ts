import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import {
  buildScimGroup,
  buildScimListResponse,
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
    { status: 401, headers: { "content-type": "application/scim+json" } },
  );
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

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

  const admin = createServiceClient() as unknown as LooseSupabase;
  let q = admin
    .from("teams")
    .select("id, name, slug, created_at, updated_at", { count: "exact" })
    .eq("org_id", auth.orgId);

  if (filter?.op === "eq" && filter.attr === "displayName") {
    q = q.eq("name", filter.value);
  } else if (filter?.op === "eq" && filter.attr === "id") {
    q = q.eq("id", filter.value);
  }

  const from = startIndex - 1;
  const to = from + count - 1;
  q = q.range(from, to);

  const { data, error, count: total } = await q;
  if (error) return scimErrorResponse(new ScimError("internal", error.message, 500));

  const teams = (data ?? []) as Array<{ id: string; name: string; created_at: string; updated_at: string | null }>;
  const teamIds = teams.map((t) => t.id);

  // Fetch members for the page.
  const memberRows = teamIds.length
    ? ((await admin.from("team_members").select("team_id, user_id, users!inner(id, email)").in("team_id", teamIds))
        .data ?? [])
    : [];
  type MemberRow = { team_id: string; user_id: string; users: { id: string; email: string | null } };
  const byTeam = new Map<string, MemberRow[]>();
  for (const m of memberRows as unknown as MemberRow[]) {
    const list = byTeam.get(m.team_id) ?? [];
    list.push(m);
    byTeam.set(m.team_id, list);
  }

  const resources = teams.map((t) =>
    buildScimGroup(
      {
        id: t.id,
        name: t.name,
        created_at: t.created_at,
        updated_at: t.updated_at,
        members: (byTeam.get(t.id) ?? []).map((m) => ({ id: m.users.id, email: m.users.email })),
      },
      baseUrl(req),
    ),
  );

  return new Response(JSON.stringify(buildScimListResponse(resources, startIndex, resources.length, total ?? 0)), {
    status: 200,
    headers: { "content-type": "application/scim+json" },
  });
}

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
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  if (!displayName) return scimErrorResponse(new ScimError("invalidValue", "displayName required", 400));

  const admin = createServiceClient() as unknown as LooseSupabase;
  const slug = slugify(displayName) || `team-${Date.now()}`;
  const { data: team, error } = await admin
    .from("teams")
    .insert({ org_id: auth.orgId, name: displayName, slug })
    .select("id, name, created_at, updated_at")
    .single();
  if (error || !team) return scimErrorResponse(new ScimError("uniqueness", error?.message ?? "Insert failed", 409));
  const teamRow = team as { id: string; name: string; created_at: string; updated_at: string | null };

  const members = Array.isArray(body.members) ? (body.members as Array<{ value?: string }>) : [];
  if (members.length) {
    const rows = members
      .filter((m) => typeof m.value === "string")
      .map((m) => ({ team_id: teamRow.id, user_id: m.value as string }));
    if (rows.length) await admin.from("team_members").upsert(rows, { onConflict: "team_id,user_id" });
  }

  const resource = buildScimGroup(
    {
      id: teamRow.id,
      name: teamRow.name,
      created_at: teamRow.created_at,
      updated_at: teamRow.updated_at,
      members: members.filter((m) => m.value).map((m) => ({ id: m.value as string })),
    },
    baseUrl(req),
  );
  return new Response(JSON.stringify(resource), {
    status: 201,
    headers: { "content-type": "application/scim+json", location: `${baseUrl(req)}/scim/v2/Groups/${teamRow.id}` },
  });
}
