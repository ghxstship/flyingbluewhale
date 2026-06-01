import { z } from "zod";
import { apiCreated, apiError, parseJson } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { urlFor } from "@/lib/urls";

/**
 * POST /api/v1/talent-invite
 *
 * Generate a magic-link talent onboarding token. Operator sends the
 * resulting invite_url to a performer; clicking it lands them on
 * /auth/talent-invite/[token] where they complete their talent profile
 * without a full Supabase account signup flow first.
 *
 * Mirrors Surreal's "magic link" artist onboarding (2025).
 */

const Schema = z.object({
  email: z.string().email(),
  posting_id: z.string().uuid().optional(),
  role_hint: z.string().max(120).optional(),
  message: z.string().max(1000).optional(),
  expires_days: z.number().int().min(1).max(30).default(7),
});

export async function POST(req: Request) {
  if (!hasSupabase) return apiError("service_unavailable", "Supabase not configured");

  const input = await parseJson(req, Schema);
  if (input instanceof Response) return input;

  const guard = await withAuth(async (session) => ({ session }));
  if (guard instanceof Response) return guard;
  const { session } = guard;

  const supabase = await createClient();
  const expiresAt = new Date(Date.now() + input.expires_days * 86400 * 1000).toISOString();

  const { data, error } = await supabase
    .from("talent_invite_tokens")
    .insert({
      org_id: session.orgId,
      email: input.email.toLowerCase(),
      posting_id: input.posting_id ?? null,
      role_hint: input.role_hint ?? null,
      message: input.message ?? null,
      expires_at: expiresAt,
    })
    .select("id, token, email, expires_at")
    .single();

  if (error) return apiError("internal", error.message);

  const inviteUrl = urlFor("auth", `/talent-invite/${data.token}`);

  return apiCreated({
    id: data.id,
    email: data.email,
    invite_url: inviteUrl,
    expires_at: data.expires_at,
  });
}
