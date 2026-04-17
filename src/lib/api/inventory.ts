import { createClient } from '@/lib/supabase/server';

export async function calculateAvailableStock(itemId: string): Promise<number> {
  const supabase = await createClient();

  // 1. Get the baseline inventory
  const { data: inventory, error: invError } = await supabase
    .from('catalog_item_inventory')
    .select('quantity_owned')
    .eq('item_id', itemId)
    .single();

  if (invError || !inventory) {
    return 0; // If no inventory record, safely assume 0
  }

  // 2. Get active cross-project allocations that deplete stock
  // States that consume stock: reserved, confirmed, in_transit, on_site
  const { data: allocations, error: allocError } = await supabase
    .from('catalog_item_allocations')
    .select('quantity')
    .eq('item_id', itemId)
    .in('state', ['reserved', 'confirmed', 'in_transit', 'on_site']);

  if (allocError) {
    throw new Error('Failed to compute stock allocations');
  }

  const allocatedCount = allocations?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
  
  return inventory.quantity_owned - allocatedCount;
}
