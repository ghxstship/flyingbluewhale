import { randomBytes } from "node:crypto";
import { z } from "zod";
import { apiOk, apiCreated, apiError, parseJson } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { emitAudit } from "@/lib/audit";
import { PLATFORM_ROLES, PERSONAS } from "@/lib/supabase/types";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";

/** Sandbox accounts use this email pattern so they are findable + cullable.
 *  Domain renamed from the repo-nickname `flyingbluewhale.test` 2026-07-03
 *  (brand canon bans the nickname in any email/identifier). Pre-rename
 *  sandbox users keep their old address — the domain is only used at
 *  creation, never queried. */
const SANDBOX_EMAIL_PREFIX = "sandbox+";
const SANDBOX_EMAIL_DOMAIN = "atlvs.test";

const SpawnBody = z.object({
  orgSlug: z.string().min(1).max(120),
  role: z.enum(PLATFORM_ROLES),
  persona: z.enum(PERSONAS),
  displayName: z.string().min(1).max(120).optional(),
});

/**
 * Developer-only gate. `isDeveloper` is read ONLY from the DB-backed
 * server session — never from the body or a header.
 */
async function requireDeveloper() {
  const session = await getSession();
  if (!session) return { error: apiError("unauthorized", "Authentication required") } as const;
  if (session.isDeveloper !== true) {
    return { error: apiError("forbidden", "Developer access required") } as const;
  }
  if (!isServiceClientAvailable()) {
    return { error: apiError("service_unavailable", "Service role not configured") } as const;
  }
  return { session } as const;
}

/**
 * POST /api/v1/admin/sandbox-user — spawn a throwaway sandbox user + membership
 * in the named org with a chosen role + persona. Returns the generated
 * credentials so a developer can act as (or log in as) the new user.
 */
export async function POST(req: Request) {
  const gate = await requireDeveloper();
  if ("error" in gate) return gate.error;
  const { session } = gate;

  const parsed = await parseJson(req, SpawnBody);
  if (parsed instanceof Response) return parsed;

  const service = createServiceClient();

  // Resolve target org by slug.
  const { data: org, error: orgErr } = await service
    .from("orgs")
    .select("id, slug")
    .eq("slug", parsed.orgSlug)
    .maybeSingle();
  if (orgErr || !org) return apiError("not_found", `Org "${parsed.orgSlug}" not found`);

  const rand = randomBytes(6).toString("hex");
  const email = `${SANDBOX_EMAIL_PREFIX}${rand}@${SANDBOX_EMAIL_DOMAIN}`;
  // 24 random bytes → URL-safe password well above any complexity policy.
  const password = randomBytes(24).toString("base64url");

  const { data: created, error: createErr } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      sandbox: true,
      created_by: session.userId,
      display_name: parsed.displayName ?? null,
    },
  });
  const userId = created?.user?.id ?? null;
  if (createErr || !userId) {
    return apiError("internal", createErr?.message ?? "Could not create sandbox user");
  }

  const { error: memErr } = await service.from("memberships").insert({
    org_id: org.id,
    user_id: userId,
    role: parsed.role,
    persona: parsed.persona,
  });
  if (memErr) {
    // Roll back the orphaned auth user so a failed membership insert doesn't
    // leak an unusable sandbox account.
    await service.auth.admin.deleteUser(userId).catch(() => {});
    return apiError("internal", memErr.message);
  }

  await emitAudit({
    actorId: session.userId,
    actorEmail: session.email,
    orgId: session.orgId,
    action: "impersonate.sandbox_spawn",
    targetTable: "auth.users",
    targetId: userId,
    metadata: { email, orgSlug: parsed.orgSlug, role: parsed.role, persona: parsed.persona },
  });

  log.info("impersonation.sandbox.spawn", { actor: session.userId, user: userId, org: org.slug });
  return apiCreated({ email, password, userId });
}

/**
 * DELETE /api/v1/admin/sandbox-user — cull every sandbox user (those with
 * `user_metadata.sandbox === true`) and their memberships. Idempotent.
 */
export async function DELETE() {
  const gate = await requireDeveloper();
  if ("error" in gate) return gate.error;
  const { session } = gate;

  const service = createServiceClient();

  // Page through auth users and collect sandbox accounts. The admin list API
  // is paginated; cap at a sane number of pages so a runaway never hangs.
  const sandboxIds: string[] = [];
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return apiError("internal", error.message);
    const users = data?.users ?? [];
    for (const u of users) {
      if ((u.user_metadata as { sandbox?: boolean } | null)?.sandbox === true) {
        sandboxIds.push(u.id);
      }
    }
    if (users.length < 1000) break;
  }

  let deleted = 0;
  for (const id of sandboxIds) {
    // Remove memberships first (FK), then the auth user. Both are best-effort
    // per id so one failure doesn't abort the whole cull.
    await service.from("memberships").delete().eq("user_id", id);
    const { error } = await service.auth.admin.deleteUser(id);
    if (!error) deleted++;
  }

  await emitAudit({
    actorId: session.userId,
    actorEmail: session.email,
    orgId: session.orgId,
    action: "impersonate.sandbox_cull",
    metadata: { deleted, found: sandboxIds.length },
  });

  log.info("impersonation.sandbox.cull", { actor: session.userId, deleted });
  return apiOk({ ok: true, deleted });
}
