// Supabase Edge Function — seeds test orgs (one per plan tier) and a user
// per platform role. Idempotent: re-runs reset passwords and skip-on-conflict
// for memberships.
//
// Auth: header `x-seed-token` must match SEED_TOKEN env (defaulted, NOT for
// production). Returns the test password in the response.
//
// Deno runtime, not Node. Don't import from src/lib.

// @ts-expect-error — Deno runtime imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const PASSWORD = "FlyingBlue!Test2026"; // shared test password

const TIERS = ["portal", "starter", "professional", "enterprise"] as const;
const ROLES = [
  "developer",
  "owner",
  "admin",
  "controller",
  "collaborator",
  "contractor",
  "crew",
  "client",
  "viewer",
  "community",
] as const;

// @ts-expect-error — Deno globals
Deno.serve(async (req: Request) => {
  // @ts-expect-error — Deno globals
  const expected = Deno.env.get("SEED_TOKEN") ?? "seed-flyingbluewhale-2026";
  const provided = req.headers.get("x-seed-token");
  if (provided !== expected) {
    return new Response(JSON.stringify({ ok: false, error: "forbidden" }), { status: 403 });
  }
  // @ts-expect-error — Deno globals
  const url = Deno.env.get("SUPABASE_URL")!;
  // @ts-expect-error — Deno globals
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const created: Record<string, unknown> = { orgs: [], users: [], memberships: [] };

  // 1. Orgs — one per tier
  for (const tier of TIERS) {
    const slug = `test-${tier}`;
    const name = `Test ${tier[0].toUpperCase()}${tier.slice(1)} Org`;
    const { data: existing } = await supabase.from("orgs").select("id").eq("slug", slug).maybeSingle();
    let id = (existing as { id: string } | null)?.id;
    if (!id) {
      const { data, error } = await supabase.from("orgs").insert({ slug, name, tier }).select("id").single();
      if (error) {
        return new Response(JSON.stringify({ ok: false, step: `org:${tier}`, error: error.message }), { status: 500 });
      }
      id = (data as { id: string }).id;
    }
    created.orgs = [...(created.orgs as unknown[]), { id, slug, tier }];
  }

  const orgsByTier: Record<string, string> = {};
  for (const o of created.orgs as Array<{ id: string; tier: string }>) orgsByTier[o.tier] = o.id;

  // 2. Users — one per role; emailed test+{role}@flyingbluewhale.app
  for (const role of ROLES) {
    const email = `test+${role}@flyingbluewhale.app`;
    const userMeta = { name: `Test ${role[0].toUpperCase()}${role.slice(1)}` };

    // Check if exists
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    let user = list?.users.find((u: { email?: string }) => u.email === email);

    if (!user) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: userMeta,
      });
      if (error) {
        return new Response(JSON.stringify({ ok: false, step: `user:${role}`, error: error.message }), { status: 500 });
      }
      user = data.user!;
    } else {
      // Reset password to known value
      await supabase.auth.admin.updateUserById(user.id, { password: PASSWORD, email_confirm: true });
    }

    created.users = [...(created.users as unknown[]), { id: user.id, email, role }];

    // 3. Memberships — every user is a member of every test org with their role
    for (const tier of TIERS) {
      const orgId = orgsByTier[tier];
      const { data: existing } = await supabase
        .from("memberships")
        .select("id")
        .eq("org_id", orgId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!existing) {
        const { error } = await supabase.from("memberships").insert({
          org_id: orgId,
          user_id: user.id,
          role,
        });
        if (error) {
          if (!error.message.includes("duplicate")) {
            return new Response(
              JSON.stringify({ ok: false, step: `membership:${role}@${tier}`, error: error.message }),
              { status: 500 },
            );
          }
        }
        created.memberships = [...(created.memberships as unknown[]), { user_email: email, org_tier: tier, role }];
      }
    }
  }

  // 4. The DISPOSABLE user — deliberately NOT in the ROLES loop above.
  //
  // e2e/lifecycle-account-delete-restore.spec.ts exercises /api/v1/me/delete,
  // which is not org-scoped: it revokes the caller's membership in EVERY org.
  // Every ROLES user is a member of all four test orgs, so pointing that chain
  // at one would rip a shared fixture out of orgs dozens of specs depend on —
  // and a mid-chain failure would strand it there (a member cannot restore
  // their own soft-deleted membership; that write is service-role only).
  //
  // So this user gets exactly ONE membership, in Starter, at the lowest role.
  // That single row IS its blast radius. Keep it out of the loop.
  {
    const email = "test+disposable@flyingbluewhale.app";
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    let user = list?.users.find((u: { email?: string }) => u.email === email);
    if (!user) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { name: "Test Disposable" },
      });
      if (error) {
        return new Response(JSON.stringify({ ok: false, step: "user:disposable", error: error.message }), {
          status: 500,
        });
      }
      user = data.user!;
    } else {
      // Re-seeding after an interrupted run: the account may be left
      // soft-deleted (deleted_at = purge date) with its membership revoked.
      // Clear both so the suite starts from a live account, which is what its
      // first assertion requires.
      await supabase.auth.admin.updateUserById(user.id, { password: PASSWORD, email_confirm: true });
      await supabase.from("users").update({ deleted_at: null, email, name: "Test Disposable" }).eq("id", user.id);
    }
    created.users = [...(created.users as unknown[]), { id: user.id, email, role: "disposable" }];

    const starterOrgId = orgsByTier["starter"];
    const { data: existing } = await supabase
      .from("memberships")
      .select("id")
      .eq("org_id", starterOrgId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing) {
      await supabase.from("memberships").update({ deleted_at: null }).eq("id", (existing as { id: string }).id);
    } else {
      const { error } = await supabase
        .from("memberships")
        .insert({ org_id: starterOrgId, user_id: user.id, role: "member" });
      if (error && !error.message.includes("duplicate")) {
        return new Response(JSON.stringify({ ok: false, step: "membership:disposable@starter", error: error.message }), {
          status: 500,
        });
      }
      created.memberships = [
        ...(created.memberships as unknown[]),
        { user_email: email, org_tier: "starter", role: "member" },
      ];
    }
  }

  return new Response(
    JSON.stringify(
      {
        ok: true,
        password: PASSWORD,
        orgs: created.orgs,
        user_count: (created.users as unknown[]).length,
        membership_count: (created.memberships as unknown[]).length,
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );
});
