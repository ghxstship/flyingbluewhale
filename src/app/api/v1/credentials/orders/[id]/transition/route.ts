import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const updateFields: Record<string, unknown> = { status: body.status };
  if (body.status === 'approved') updateFields.approved_by = user.id;
  else if (body.status === 'denied') updateFields.denied_by = user.id;
  else if (body.status === 'issued') updateFields.issued_by = user.id;
  else if (body.status === 'revoked') { updateFields.revoked_by = user.id; updateFields.revocation_reason = body.reason; }
  if (body.notes) updateFields.notes = body.notes;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).from('credential_orders').update(updateFields).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: (error as { message: string }).message }, { status: 400 });
  return NextResponse.json({ data });
}
