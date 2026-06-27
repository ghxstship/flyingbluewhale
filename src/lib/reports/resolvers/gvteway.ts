import "server-only";
import type { MetricResolver, ResolverMap } from "./types";
import { countWhere, NOT_COMPUTED } from "./types";
import type { LooseSupabase } from "@/lib/supabase/loose";

/**
 * GVTEWAY (Public Interface & Marketplace) metric resolvers — kit v6.3 Reports
 * engine. Every query is org-scoped on `org_id = ctx.orgId`.
 *
 * Schema reality (verified against the live DB):
 *   - There is NO dedicated `orders` table. Commerce "orders" are modeled as
 *     `store_carts` that reached `cart_state='converted'`; the order's line
 *     total comes from `store_cart_items` (qty * unit_price_cents). The
 *     `transactions` ledger (utx_kind / utx_state, *_minor cents) carries the
 *     financial side (invoices, refunds).
 *   - Tickets are `assignments WHERE catalog_kind='ticket'` (deleted_at IS NULL);
 *     check-in = fulfillment_state='redeemed'. Guest list = guest_list_entries
 *     (entry_state arrived/pending/denied, checked_in_at).
 *   - Marketplace hiring funnel = job_postings + job_applications.
 *   - No marketing-spend, web-analytics/session, chargeback, or vendor-revenue
 *     -split table exists, so cac / roas / ltv / activation_roi /
 *     chargeback_rate / conversion_rate / take_rate / vendor_gmv /
 *     sponsorship_revenue / nps resolve to null (never fabricated).
 *
 * Units: currency → dollars (minor/100); pct → 0–100; ratio/float → raw; int.
 */

// Dynamic table names → sanctioned LooseSupabase escape hatch (RLS stays the
// authz boundary), same contract as `countWhere`. No raw `any`.
type Db = LooseSupabase;

/** Sum of converted-cart line value (qty * unit_price_cents), in cents. */
async function convertedGmvCents(db: Db, orgId: string): Promise<number | null> {
  const { data: carts, error: cErr } = await db
    .from("store_carts")
    .select("id")
    .eq("org_id", orgId)
    .eq("cart_state", "converted");
  if (cErr || !carts) return null;
  if (carts.length === 0) return 0;
  const ids = (carts as { id: string }[]).map((c) => c.id);
  const { data: items, error: iErr } = await db
    .from("store_cart_items")
    .select("quantity, unit_price_cents, cart_id")
    .eq("org_id", orgId)
    .in("cart_id", ids);
  if (iErr || !items) return null;
  let cents = 0;
  for (const it of items as { quantity: number | null; unit_price_cents: number | null }[]) {
    cents += (it.quantity ?? 0) * (it.unit_price_cents ?? 0);
  }
  return cents;
}

/** Count converted carts (= "orders") for the org. */
async function orderCount(db: Db, orgId: string): Promise<number | null> {
  const { count, error } = await db
    .from("store_carts")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("cart_state", "converted");
  if (error) return null;
  return count ?? 0;
}

// ── Commerce ────────────────────────────────────────────────────────────────

/** GMV — gross merchandise value of converted carts, in dollars. */
const gmv: MetricResolver = async ({ db, orgId }) => {
  const cents = await convertedGmvCents(db as unknown as Db, orgId);
  return cents === null ? null : cents / 100;
};

/** Average order value — GMV / order count, in dollars. */
const aov: MetricResolver = async ({ db, orgId }) => {
  const cents = await convertedGmvCents(db as unknown as Db, orgId);
  if (cents === null) return null;
  const orders = await orderCount(db as unknown as Db, orgId);
  if (orders === null || orders === 0) return null;
  return cents / 100 / orders;
};

/** Refund rate — refund transaction amount / invoice amount, as a percent. */
const refund_rate: MetricResolver = async ({ db, orgId }) => {
  const { data, error } = await db
    .from("transactions")
    .select("kind, total_minor")
    .eq("org_id", orgId)
    .in("kind", ["invoice", "refund"]);
  if (error || !data) return null;
  let invoice = 0;
  let refund = 0;
  for (const t of data as { kind: string; total_minor: number | null }[]) {
    if (t.kind === "invoice") invoice += t.total_minor ?? 0;
    else if (t.kind === "refund") refund += Math.abs(t.total_minor ?? 0);
  }
  if (invoice === 0) return null;
  return (refund / invoice) * 100;
};

/** Cart abandonment — abandoned carts / (abandoned + converted), as a percent. */
const cart_abandonment: MetricResolver = async ({ db, orgId }) => {
  const base = db.from("store_carts").select("*", { count: "exact", head: true }).eq("org_id", orgId);
  const [aband, conv] = await Promise.all([
    base.eq("cart_state", "abandoned"),
    db.from("store_carts").select("*", { count: "exact", head: true }).eq("org_id", orgId).eq("cart_state", "converted"),
  ]);
  if (aband.error || conv.error) return null;
  const a = aband.count ?? 0;
  const c = conv.count ?? 0;
  const denom = a + c;
  if (denom === 0) return null;
  return (a / denom) * 100;
};

/** Repeat purchase rate — buyers with >1 converted cart / buyers with ≥1, percent. */
const repeat_rate: MetricResolver = async ({ db, orgId }) => {
  const { data, error } = await db
    .from("store_carts")
    .select("user_id")
    .eq("org_id", orgId)
    .eq("cart_state", "converted")
    .not("user_id", "is", null);
  if (error || !data) return null;
  const counts = new Map<string, number>();
  for (const r of data as { user_id: string }[]) counts.set(r.user_id, (counts.get(r.user_id) ?? 0) + 1);
  const buyers = counts.size;
  if (buyers === 0) return null;
  let repeat = 0;
  for (const n of counts.values()) if (n > 1) repeat += 1;
  return (repeat / buyers) * 100;
};

// ── Tickets & attendance ──────────────────────────────────────────────────────

/** Tickets sold — assignments of catalog_kind 'ticket' (non-deleted). */
const tickets_sold: MetricResolver = (ctx) =>
  countWhere(ctx, "assignments", { catalog_kind: "ticket", deleted_at: null });

/** Sell-through — redeemed tickets / total tickets, as a percent. */
const sell_through: MetricResolver = async (ctx) => {
  const total = await countWhere(ctx, "assignments", { catalog_kind: "ticket", deleted_at: null });
  if (total === null || total === 0) return null;
  const redeemed = await countWhere(ctx, "assignments", {
    catalog_kind: "ticket",
    deleted_at: null,
    fulfillment_state: "redeemed",
  });
  if (redeemed === null) return null;
  return (redeemed / total) * 100;
};

/** Capacity utilization — (tickets + guest-list entries) vs same denominator;
 *  with no venue-capacity column, report attendance load = arrived / invited. */
const capacity_utilization: MetricResolver = async (ctx) => {
  const tickets = await countWhere(ctx, "assignments", { catalog_kind: "ticket", deleted_at: null });
  const guests = await countWhere(ctx, "guest_list_entries", { deleted_at: null });
  if (tickets === null && guests === null) return null;
  const invited = (tickets ?? 0) + (guests ?? 0);
  if (invited === 0) return null;
  const redeemed = await countWhere(ctx, "assignments", {
    catalog_kind: "ticket",
    deleted_at: null,
    fulfillment_state: "redeemed",
  });
  const arrived = await countWhere(ctx, "guest_list_entries", { deleted_at: null, entry_state: "arrived" });
  const present = (redeemed ?? 0) + (arrived ?? 0);
  return (present / invited) * 100;
};

/** Check-in rate — present (redeemed tickets + arrived guests) / total, percent. */
const check_in_rate: MetricResolver = capacity_utilization;

/** No-show rate — 1 − ticket redemption rate, as a percent (tickets only). */
const no_show_rate: MetricResolver = async (ctx) => {
  const total = await countWhere(ctx, "assignments", { catalog_kind: "ticket", deleted_at: null });
  if (total === null || total === 0) return null;
  const redeemed = await countWhere(ctx, "assignments", {
    catalog_kind: "ticket",
    deleted_at: null,
    fulfillment_state: "redeemed",
  });
  if (redeemed === null) return null;
  return ((total - redeemed) / total) * 100;
};

/** Per-cap spend — GMV / tickets sold, in dollars per attendee. */
const per_cap_spend: MetricResolver = async (ctx) => {
  const cents = await convertedGmvCents(ctx.db as unknown as Db, ctx.orgId);
  if (cents === null) return null;
  const tickets = await countWhere(ctx, "assignments", { catalog_kind: "ticket", deleted_at: null });
  if (tickets === null || tickets === 0) return null;
  return cents / 100 / tickets;
};

// ── Marketplace / hiring ──────────────────────────────────────────────────────

/** Active listings — published storefront products (the marketplace catalog). */
const active_listings: MetricResolver = (ctx) =>
  countWhere(ctx, "store_products", { product_state: "published", deleted_at: null });

/** Application rate — total applications / published job postings (apps/posting). */
const application_rate: MetricResolver = async (ctx) => {
  const postings = await countWhere(ctx, "job_postings", { job_posting_phase: "published", deleted_at: null });
  if (postings === null || postings === 0) return null;
  const apps = await countWhere(ctx, "job_applications", {});
  if (apps === null) return null;
  return apps / postings;
};

/** Time to hire — avg days from posting publish to booking, for booked apps. */
const time_to_hire: MetricResolver = async ({ db, orgId }) => {
  const { data, error } = await db
    .from("job_applications")
    .select("reviewed_at, applied_at, job_posting_id, job_postings(published_at)")
    .eq("org_id", orgId)
    .eq("job_application_state", "booked");
  if (error || !data) return null;
  const rows = data as {
    reviewed_at: string | null;
    applied_at: string | null;
    job_postings: { published_at: string | null } | { published_at: string | null }[] | null;
  }[];
  let sumDays = 0;
  let n = 0;
  for (const r of rows) {
    const end = r.reviewed_at;
    if (!end) continue;
    const jp = Array.isArray(r.job_postings) ? r.job_postings[0] : r.job_postings;
    const start = jp?.published_at ?? r.applied_at;
    if (!start) continue;
    const days = (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000;
    if (!Number.isFinite(days) || days < 0) continue;
    sumDays += days;
    n += 1;
  }
  if (n === 0) return null;
  return sumDays / n;
};

// ── No backing data in schema → honest null (never fabricated) ────────────────

/** Needs web-analytics/session counts (no sessions table). */
const conversion_rate: MetricResolver = NOT_COMPUTED;
/** Needs a vendor revenue-split / platform-fee agreement table (absent). */
const take_rate: MetricResolver = NOT_COMPUTED;
/** Needs per-vendor order attribution (no vendor-scoped orders). */
const vendor_gmv: MetricResolver = NOT_COMPUTED;
/** Needs marketing-spend (no campaign-spend table). */
const cac: MetricResolver = NOT_COMPUTED;
/** Needs marketing-spend + attributed revenue (no spend table). */
const roas: MetricResolver = NOT_COMPUTED;
/** Needs lifetime cohort revenue per customer (no durable buyer identity). */
const ltv: MetricResolver = NOT_COMPUTED;
/** Needs a real NPS survey instrument (reviews are 1–5 ratings, not NPS). */
const nps: MetricResolver = NOT_COMPUTED;
/** Needs payment-processor chargeback events (no chargeback field). */
const chargeback_rate: MetricResolver = NOT_COMPUTED;
/** Needs sponsorship revenue ledger (sponsor_entitlements has no $ amount). */
const sponsorship_revenue: MetricResolver = NOT_COMPUTED;
/** Needs activation marketing-spend vs attributed revenue (no spend table). */
const activation_roi: MetricResolver = NOT_COMPUTED;

export const gvtewayResolvers: ResolverMap = {
  gmv,
  tickets_sold,
  sell_through,
  capacity_utilization,
  aov,
  conversion_rate,
  check_in_rate,
  no_show_rate,
  take_rate,
  active_listings,
  vendor_gmv,
  refund_rate,
  cart_abandonment,
  cac,
  roas,
  ltv,
  repeat_rate,
  nps,
  per_cap_spend,
  chargeback_rate,
  sponsorship_revenue,
  activation_roi,
  time_to_hire,
  application_rate,
};
