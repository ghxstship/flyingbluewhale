import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { scan_type, scan_data } = body;

    if (scan_type === 'credential') {
      const { data: order, error } = await supabase.from('credential_orders').select(`*`).eq('id', scan_data).single();
      if (error || !order) return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
      await supabase.from('credential_check_ins').insert({ credential_order_id: order.id, checked_in_by: user.id, method: 'scan', location_id: body.location_id || null });
      if (order.status === 'issued') await supabase.from('credential_orders').update({ status: 'picked_up' }).eq('id', order.id);
      return NextResponse.json({ data: { type: 'credential', order, action: 'checked_in' } });
    } else if (scan_type === 'catering') {
      const { data: allocation, error } = await supabase.from('catering_allocations').select(`*`).eq('id', scan_data).single();
      if (error || !allocation) return NextResponse.json({ error: 'Allocation not found' }, { status: 404 });
      await supabase.from('catering_check_ins').insert({ allocation_id: allocation.id, checked_in_by: user.id });
      await supabase.from('catering_allocations').update({ status: 'checked_in' }).eq('id', allocation.id);
      return NextResponse.json({ data: { type: 'catering', allocation, action: 'checked_in' } });
    } else if (scan_type === 'equipment') {
      const { data: allocation, error } = await supabase.from('catalog_item_allocations').select(`*`).eq('barcode', scan_data).single();
      if (error || !allocation) return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
      const action = body.action || (allocation.state === 'on_site' ? 'checkout' : 'return');
      if (action === 'checkout') await supabase.from('catalog_item_allocations').update({ state: 'checked_out', checked_out_by: user.id }).eq('id', allocation.id);
      else if (action === 'return') await supabase.from('catalog_item_allocations').update({ state: 'returned', checked_in_by: user.id, return_condition: 'good', return_notes: body.notes }).eq('id', allocation.id);
      return NextResponse.json({ data: { type: 'equipment', allocation, action } });
    }
    return NextResponse.json({ error: 'Invalid scan_type' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
}
