import { apiError, apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

/**
 * POST /api/v1/talent-invite/[token]/consume
 *
 * Mark a talent invite token as used by the now-authenticated user.
 * Called immediately after Supabase auth signup/signin on the invite page.
 */

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!hasSupabase) return apiError("service_unavailable", "Supabase not configured");
  const { token } = await params;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;

  const supabase = await createClient();

  const { data: invite } = await supabase
    .from("talent_invite_tokens")
    .select("id, used_at, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!invite) return apiError("not_found", "Invite token not found");
  if (invite.used_at) return apiOk({ already_consumed: true });
  if (new Date(invite.expires_at) < new Date()) return apiError("conflict", "Token has expired");

  const { error } = await supabase
    .from("talent_invite_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", invite.id);

  if (error) return apiError("internal", error.message);
  return apiOk({ consumed: true });
}
