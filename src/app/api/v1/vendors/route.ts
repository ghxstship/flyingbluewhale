import { requireAuth } from '@/lib/api/guards';
import { success, error, handleError } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export const GET = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('organization_id');
    const type = searchParams.get('type');

    let query = supabase.from('vendors').select(`*, vendor_contacts(*)`).eq('is_active', true).order('name');

    if (orgId) query = query.eq('organization_id', orgId);
    if (type) query = query.eq('type', type as any);

    const { data, error: dbError } = await query;
    if (dbError) return handleError(dbError);
    return success(data);
});

export const POST = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const supabase = await createClient();
    const body = await request.json();

    const slug = (body.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const { data, error: dbError } = await supabase.from('vendors').insert({
      organization_id: body.organization_id,
      name: body.name,
      slug,
      type: body.type || 'supplier',
      contact: body.contact || {},
      address: body.address || {},
      payment_terms: body.payment_terms || null,
      tax_id: body.tax_id || null,
      website: body.website || null,
      notes: body.notes || null,
      metadata: body.metadata || {},
    }).select().single();

    if (dbError) return handleError(dbError);

    // Create contacts if provided
    if (body.contacts && Array.isArray(body.contacts) && data) {
      for (const contact of body.contacts) {
        await supabase.from('vendor_contacts').insert({
          vendor_id: data.id,
          name: contact.name,
          title: contact.title,
          email: contact.email,
          phone: contact.phone,
          is_primary: contact.is_primary || false,
          notes: contact.notes,
        });
      }
    }

    return success(data, undefined, 201);
});

export const PATCH = requireAuth(async (request: NextRequest, { user }: { user: { id: string } }) => {
  const supabase = await createClient();
    const body = await request.json();

    if (!body.id) return error('id required' , 400);

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.type !== undefined) updates.type = body.type;
    if (body.contact !== undefined) updates.contact = body.contact;
    if (body.address !== undefined) updates.address = body.address;
    if (body.payment_terms !== undefined) updates.payment_terms = body.payment_terms;
    if (body.rating !== undefined) updates.rating = body.rating;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.website !== undefined) updates.website = body.website;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.metadata !== undefined) updates.metadata = body.metadata;

    const { data, error: dbError } = await supabase.from('vendors').update(updates as any).eq('id', body.id).select().single();
    if (dbError) return handleError(dbError);
    return success(data);
});
