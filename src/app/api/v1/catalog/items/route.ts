import { withAuth, apiOk, apiCreated, apiError, parsePagination } from '@/lib/api/api-response';

/* ═══════════════════════════════════════════════════════
   /api/v1/catalog/items — Catalog Item CRUD
   Hardened: auth guard, sanitized errors, pagination.
   ═══════════════════════════════════════════════════════ */

export const GET = withAuth(async (request, _user, supabase) => {
  const { searchParams } = new URL(request.url);
  const { pageSize, offset } = parsePagination(searchParams);

  let query = supabase
    .from('advance_items')
    .select(`
      *,
      advance_subcategories!inner (
        id, name, slug,
        advance_categories!inner (
          id, name, slug,
          advance_category_groups!inner (id, name, slug)
        )
      ),
      catalog_item_interchange!catalog_item_interchange_item_a_id_fkey (
        id, item_b_id, compatibility_score, relationship_type
      ),
      catalog_item_fitment (id, venue_type, weather, indoor_outdoor, event_type, budget_tier),
      catalog_item_inventory (quantity_owned, quantity_available, warehouse_location)
    `, { count: 'exact' })
    .eq('is_active', true)
    .order('name');

  const search = searchParams.get('search');
  if (search) query = query.ilike('name', `%${search}%`);

  const manufacturer = searchParams.get('manufacturer');
  if (manufacturer) query = query.eq('manufacturer', manufacturer);

  const visibility = searchParams.get('visibility');
  if (visibility) query = query.contains('visibility_tags', [visibility]);

  const subcategory = searchParams.get('subcategory');
  if (subcategory) query = query.eq('advance_subcategories.slug', subcategory);

  query = query.range(offset, offset + pageSize - 1);

  const { data, error: dbError, count } = await query;
  if (dbError) return apiError('Failed to fetch catalog items', 400);

  return apiOk({ data, meta: { total: count ?? 0 } });
});

export const POST = withAuth(async (request, _user, supabase) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const insertData = {
    subcategory_id: String(body.subcategory_id ?? ''),
    name: String(body.name ?? ''),
    slug: String(body.slug ?? ''),
    description: body.description != null ? String(body.description) : null,
    manufacturer: body.manufacturer != null ? String(body.manufacturer) : null,
    model: body.model != null ? String(body.model) : null,
    sku: body.sku != null ? String(body.sku) : null,
    unit: String(body.unit ?? 'each'),
    weight_kg: body.weight_kg != null ? Number(body.weight_kg) : null,
    power_watts: body.power_watts != null ? Number(body.power_watts) : null,
    daily_rate: body.daily_rate != null ? Number(body.daily_rate) : null,
    weekly_rate: body.weekly_rate != null ? Number(body.weekly_rate) : null,
    purchase_price: body.purchase_price != null ? Number(body.purchase_price) : null,
    visibility_tags: Array.isArray(body.visibility_tags) ? body.visibility_tags as string[] : ['production'],
    specifications: (body.specifications ?? {}) as Record<string, string>,
  };

  const { data, error: dbError } = await supabase
    .from('advance_items')
    .insert(insertData)
    .select()
    .single();

  if (dbError) return apiError('Failed to create catalog item', 400);
  return apiCreated(data);
});
