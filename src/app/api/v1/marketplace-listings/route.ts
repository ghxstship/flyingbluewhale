import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "@/lib/api";
import { assertScope, withAuth } from "@/lib/auth";
import { listOrgScopedPage } from "@/lib/db/resource";
import { withIdempotency } from "@/lib/idempotency";
import { createClient } from "@/lib/supabase/server";

/** /api/v1/marketplace-listings — crew buy/sell/trade gear, org-scoped. */

const LISTING_STATES = ["draft", "active", "sold", "withdrawn"] as const;
const ITEM_CONDITIONS = ["new", "like_new", "used", "for_parts"] as const;

const CreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(8000).optional(),
  priceCents: z.number().int().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  itemCondition: z.enum(ITEM_CONDITIONS).optional(),
  category: z.string().max(120).optional(),
  listingState: z.enum(LISTING_STATES).optional(),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const pageSizeParam = url.searchParams.get("pageSize");
  const pageSize = pageSizeParam ? Number.parseInt(pageSizeParam, 10) : undefined;
  const state = url.searchParams.get("state");
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denied = assertScope(session, "marketplace:read");
    if (denied) return denied;
    const page = await listOrgScopedPage("marketplace_listings", session.orgId, {
      cursor,
      pageSize: Number.isFinite(pageSize) ? pageSize : undefined,
      orderBy: "created_at",
      ascending: false,
      filters: state ? [{ column: "listing_state", op: "eq", value: state }] : undefined,
    });
    return apiOk(
      {
        orgId: session.orgId,
        listings: page.rows,
        nextCursor: page.nextCursor,
        pageSize: page.pageSize,
        totalCount: page.totalCount,
      },
      { headers: { "x-total-count": String(page.totalCount) } },
    );
  });
}

// Wrapped with `withIdempotency` so client retries don't create duplicate
// listings. Client opt-in via Idempotency-Key header.
async function postHandler(req: NextRequest) {
  const input = await parseJson(req, CreateSchema);
  if (input instanceof Response) return input;
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    const denied = assertScope(session, "marketplace:write");
    if (denied) return denied;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("marketplace_listings")
      .insert({
        org_id: session.orgId,
        seller_user_id: session.userId,
        title: input.title,
        description: input.description ?? null,
        price_cents: input.priceCents ?? null,
        currency: input.currency ?? "USD",
        item_condition: input.itemCondition ?? null,
        category: input.category ?? null,
        listing_state: input.listingState ?? "active",
      })
      .select("id, title, listing_state, price_cents, currency, created_at")
      .single();
    if (error) return apiError("internal", error.message);
    return apiCreated({ listing: data });
  });
}

export const POST = withIdempotency(postHandler);
