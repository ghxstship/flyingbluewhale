import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { assertScope, withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type MarketplaceListingUpdate = Database["public"]["Tables"]["marketplace_listings"]["Update"];

/** /api/v1/marketplace-listings/[id] — detail + update + soft-delete. */

const LISTING_STATES = ["draft", "active", "sold", "withdrawn"] as const;

const PatchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(8000).optional(),
  priceCents: z.number().int().nonnegative().optional(),
  listingState: z.enum(LISTING_STATES).optional(),
});

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denied = assertScope(session, "marketplace:read");
    if (denied) return denied;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("marketplace_listings")
      .select(
        "id, org_id, seller_user_id, title, description, price_cents, currency, item_condition, category, listing_state, created_at, updated_at",
      )
      .eq("id", id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) return apiError("internal", error.message);
    if (!data) return apiError("not_found", "Listing not found");
    return apiOk({ listing: data });
  });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const input = await parseJson(req, PatchSchema);
  if (input instanceof Response) return input;
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denied = assertScope(session, "marketplace:write");
    if (denied) return denied;
    const supabase = await createClient();
    const patch: MarketplaceListingUpdate = {};
    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description;
    if (input.priceCents !== undefined) patch.price_cents = input.priceCents;
    if (input.listingState !== undefined) patch.listing_state = input.listingState;
    const { data, error } = await supabase
      .from("marketplace_listings")
      .update(patch)
      .eq("id", id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .select("id, title, listing_state, price_cents, currency, updated_at")
      .maybeSingle();
    if (error) return apiError("internal", error.message);
    if (!data) return apiError("not_found", "Listing not found");
    return apiOk({ listing: data });
  });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denied = assertScope(session, "marketplace:write");
    if (denied) return denied;
    const supabase = await createClient();
    // .select + .is(deleted_at, null) — surface 404 on wrong/foreign id
    // and refuse to re-stamp deleted_at on an already-deleted row.
    const { data, error } = await supabase
      .from("marketplace_listings")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .select("id")
      .maybeSingle();
    if (error) return apiError("internal", error.message);
    if (!data) return apiError("not_found", "Listing not found or already deleted");
    return apiOk({ ok: true });
  });
}
