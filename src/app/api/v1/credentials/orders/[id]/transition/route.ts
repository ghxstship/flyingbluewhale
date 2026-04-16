import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { status: newStatus, reason, notes } = body as { status: string; reason?: string; notes?: string };
    const { data, error } = await supabase
      .from('credential_orders')
      .update({
        status: newStatus as 'requested' | 'approved' | 'denied' | 'issued' | 'picked_up' | 'revoked',
        ...(newStatus === 'approved' && { approved_by: user.id }),
        ...(newStatus === 'denied' && { denied_by: user.id }),
        ...(newStatus === 'issued' && { issued_by: user.id }),
        ...(newStatus === 'revoked' && { revoked_by: user.id, revocation_reason: reason }),
        ...(notes && { notes }),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
}
