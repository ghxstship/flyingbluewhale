import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type WebhookEndpointUpdate = Database["public"]["Tables"]["webhook_endpoints"]["Update"];

const PatchSchema = z.object({
  url: z.string().url().startsWith("https://").optional(),
  description: z.string().max(200).nullable().optional(),
  events: z.array(z.string().max(64)).min(1).max(32).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const input = await parseJson(req, PatchSchema);
  if (input instanceof Response) return input;
  return withAuth(async (session) => {
    const denial = assertCapability(session, "projects:write");
    if (denial) return denial;
    const supabase = await createClient();
    const patch: WebhookEndpointUpdate = {};
    if (input.url !== undefined) patch.url = input.url;
    if (input.description !== undefined) patch.description = input.description;
    if (input.events !== undefined) patch.events = input.events;
    if (input.isActive !== undefined) patch.is_active = input.isActive;
    const { data, error } = await supabase
      .from("webhook_endpoints")
      .update(patch)
      .eq("id", id)
      .eq("org_id", session.orgId ?? "")
      .select("id, url, description, events, is_active, updated_at")
      .maybeSingle();
    if (error) return apiError("internal", error.message);
    if (!data) return apiError("not_found", "Endpoint not found");
    return apiOk({ endpoint: data });
  });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withAuth(async (session) => {
    const denial = assertCapability(session, "projects:write");
    if (denial) return denial;
    const supabase = await createClient();
    // .select + .is(deleted_at, null) so a wrong/foreign id surfaces as
    // 404 instead of silently returning ok:true. Also prevents an
    // already-soft-deleted row from being re-stamped with a newer
    // deleted_at, which would extend its purge window past its first
    // delete.
    const { data, error } = await supabase
      .from("webhook_endpoints")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("org_id", session.orgId ?? "")
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();
    if (error) return apiError("internal", error.message);
    if (!data) return apiError("not_found", "Endpoint not found or already deleted");
    return apiOk({ ok: true });
  });
}
