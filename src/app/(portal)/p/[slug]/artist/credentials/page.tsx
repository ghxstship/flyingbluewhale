import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { SectionHeading } from '@/components/data/SectionHeading';
import { StatusBadge } from '@/components/data/StatusBadge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { 
  const { slug } = await params; 
  return { title: `Credentials -- ${slug} -- GVTEWAY` }; 
}

export default async function ArtistCredentialsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: orders } = user 
    ? await supabase.from('credential_orders').select(`*, credential_types (name, color)`).eq('user_id', user.id).order('created_at', { ascending: false }) 
    : { data: null };

  return (
    <>
      <ModuleHeader
        title="Credentials"
        subtitle="Request and track your event credentials"
        backHref={`/${slug}/artist`}
        backLabel="Artist Portal"
        maxWidth="4xl"
      />

      <div className="page-content" style={{ maxWidth: '4xl' }}>
        <section className="card p-6 mb-8">
          <SectionHeading>Request Credential</SectionHeading>
          <form className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-[0.625rem] tracking-wider uppercase text-text-tertiary block mb-2">Type</label>
              <select className="input w-full bg-surface-raised border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-cyan">
                <option>Artist</option>
                <option>Crew</option>
                <option>VIP</option>
              </select>
            </div>
            <div>
              <label className="text-[0.625rem] tracking-wider uppercase text-text-tertiary block mb-2">Quantity</label>
              <Input type="number" defaultValue={1} min={1} className="w-full" />
            </div>
            <div className="flex">
              <Button variant="primary" className="w-full h-[38px]">Request</Button>
            </div>
          </form>
        </section>

        <section>
          <SectionHeading>My Credentials</SectionHeading>
          {(orders?.length ?? 0) === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-text-tertiary text-sm">No credentials yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {orders?.map((o) => { 
                const ct = o.credential_types as { name: string; color: string } | null; 
                return (
                  <div key={o.id} className="card p-5 flex items-center gap-4 hover:border-cyan transition-colors">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-heading text-sm shrink-0" 
                      style={{ background: (ct?.color || '#00E5FF') + '20', color: ct?.color || '#00E5FF' }}
                    >
                      {ct?.name?.[0] || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-text-primary">{ct?.name || 'Credential'}</span>
                        <StatusBadge status={o.status} />
                      </div>
                      <p className="text-xs text-text-tertiary">Qty: {o.quantity} · {new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    {o.status === 'issued' && (
                      <Button variant="ghost" size="sm" className="text-cyan border border-cyan/30">Download Badge</Button>
                    )}
                  </div>
                ); 
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
