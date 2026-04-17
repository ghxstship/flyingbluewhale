import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    let query = supabase.from('advance_items').select(`*, advance_subcategories!inner (id, name, slug, advance_categories!inner (id, name, slug, advance_category_groups!inner (id, name, slug))), catalog_item_interchange!catalog_item_interchange_item_a_id_fkey (id, item_b_id, compatibility_score, relationship_type), catalog_item_fitment (id, venue_type, weather, indoor_outdoor, event_type, budget_tier), catalog_item_inventory (quantity_owned, quantity_available, warehouse_location)`).eq('is_active', true).order('name');
    const search = searchParams.get('search');
    if (search) query = query.ilike('name', `%${search}%`);
    const manufacturer = searchParams.get('manufacturer');
    if (manufacturer) query = query.eq('manufacturer', manufacturer);
    const visibility = searchParams.get('visibility');
    if (visibility) query = query.contains('visibility_tags', [visibility]);
    const subcategory = searchParams.get('subcategory');
    if (subcategory) query = query.eq('advance_subcategories.slug', subcategory);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');
    query = query.range(offset, offset + limit - 1);
    const { data, error: dbError, count } = await query;
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    return NextResponse.json({ data, meta: { count, limit, offset } });
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { data, error: dbError } = await supabase.from('advance_items').insert({ subcategory_id: body.subcategory_id, name: body.name, slug: body.slug, description: body.description, manufacturer: body.manufacturer, model: body.model, sku: body.sku, unit: body.unit || 'each', weight_kg: body.weight_kg, power_watts: body.power_watts, daily_rate: body.daily_rate, weekly_rate: body.weekly_rate, purchase_price: body.purchase_price, visibility_tags: body.visibility_tags || ['production'], specifications: body.specifications || {} }).select().single();
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 400 });
    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
}
