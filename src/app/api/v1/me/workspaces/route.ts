import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Workspace switcher — powers <WorkspaceSwitcher> at the top of the
 * platform sidebar (IA spec §7 #12, Vercel pattern).
 *
 * GET   — list every org the session user is a member of, with role.
 * PATCH — set `last_org_id` on the user's preferences row so the next
 *         navigation resolves the new tenant. The client calls this then
 *         router.refresh() so server components re-resolve via resolveTenant.
 */

const PatchSchema = z.object({
  orgId: z.string().uuid(),
});

export async function GET() {
  return withAuth(async (session) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("memberships")
      .select("org_id, role, orgs:orgs(id, name, name_override, logo_url, branding)")
      .eq("user_id", session.userId)
      .order("created_at", { ascending: true });
    if (error) return apiError("internal", error.message);
    type Row = {
      org_id: string;
      role: string;
      orgs: { id: string; name: string; name_override: string | null; logo_url: string | null; branding: unknown } | null;
    };
    const rows = ((data as unknown) as Row[]) ?? [];
    const workspaces = rows
      .filter((r) => r.orgs)
      .map((r) => ({
        id: r.org_id,
        name: r.orgs!.name_override ?? r.orgs!.name,
        role: r.role,
        logoUrl: r.orgs!.logo_url,
      }));
    return apiOk({ workspaces, current: session.orgId ?? null });
  });
}

export async function PATCH(req: NextRequest) {
  const input = await parseJson(req, PatchSchema);
  if (input instanceof Response) return input;
  return withAuth(async (session) => {
    const supabase = await createClient();

    // Confirm membership before flipping the pointer — RLS would block
    // silently, but a 403 at the boundary is a clearer failure mode.
    const { data: member } = await supabase
      .from("memberships")
      .select("org_id")
      .eq("user_id", session.userId)
      .eq("org_id", input.orgId)
      .maybeSingle();
    if (!member) return apiError("forbidden", "You are not a member of that workspace");

    const { error } = await (supabase.from("user_preferences") as unknown as {
      upsert: (p: Record<string, unknown>, opts?: Record<string, unknown>) => Promise<{ error: unknown }>;
    })
      .upsert({ user_id: session.userId, last_org_id: input.orgId }, { onConflict: "user_id" });
    if (error) return apiError("internal", (error as { message?: string }).message ?? "write failed");

    return apiOk({ ok: true, orgId: input.orgId });
  });
}
