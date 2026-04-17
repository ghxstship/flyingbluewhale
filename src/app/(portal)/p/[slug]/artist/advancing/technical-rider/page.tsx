import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { SectionHeading } from '@/components/data/SectionHeading';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return {
    title: `Technical Rider -- ${slug} -- GVTEWAY`,
    description: `Confirm or override backline equipment for your set.`,
  };
}

export default async function TechnicalRiderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch talent-facing catalog items (backline)
  const { data: backlineItems } = await supabase
    .from('advance_items')
    .select(`
      id, name, manufacturer, model, unit, specifications, visibility_tags,
      advance_subcategories!inner (
        id, name,
        advance_categories!inner (
          id, name, slug
        )
      )
    `)
    .contains('visibility_tags', ['talent_facing'])
    .eq('is_active', true)
    .order('name');

  // Group items by subcategory
  const grouped = (backlineItems ?? []).reduce<Record<string, { name: string; items: typeof backlineItems }>>((acc, item) => {
    const sub = item.advance_subcategories as unknown as { id: string; name: string };
    if (!acc[sub.id]) {
      acc[sub.id] = { name: sub.name, items: [] };
    }
    acc[sub.id].items!.push(item);
    return acc;
  }, {});

  return (
    <>
      <ModuleHeader
        title="Technical Rider"
        subtitle="Review the default backline below. Confirm each item, override with a substitute, or add custom requirements."
        backHref={`/${slug}/artist/advancing`}
        backLabel="Advancing"
        maxWidth="4xl"
      />

      <div className="page-content" style={{ maxWidth: '4xl' }}>
        {/* Status bar */}
        <div className="card-elevated p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="muted">Draft</Badge>
            <span className="text-xs text-text-tertiary">Auto-saves as you make changes</span>
          </div>
          <Button variant="primary" size="sm">Submit Rider</Button>
        </div>

        {/* Item groups */}
        {Object.entries(grouped).map(([subId, group]) => (
          <section key={subId} className="mb-10">
            <div className="sticky top-0 bg-bg py-2 z-10 mb-4">
              <div className="flex items-center gap-3">
                <SectionHeading accentColor="var(--color-cyan)">{group.name}</SectionHeading>
                <span className="badge text-[0.5rem] tracking-wider uppercase bg-surface-raised text-text-disabled border border-border">
                  {group.items!.length} items
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {group.items!.map((item) => (
                <div key={item.id} className="card p-4 flex items-center justify-between hover:border-cyan/30 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-primary font-medium">{item.name}</span>
                      <span className="font-mono text-[0.625rem] text-text-disabled">
                        {item.manufacturer} {item.model}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      defaultValue={0}
                      min={0}
                      max={99}
                      className="w-16 text-center text-sm py-1 font-mono"
                      aria-label={`Quantity for ${item.name}`}
                    />
                    <select
                      className="input py-1.5 px-3 w-28 bg-surface-raised border border-border rounded-md text-xs text-text-primary focus:outline-none focus:border-cyan"
                      defaultValue="confirm"
                      aria-label={`Action for ${item.name}`}
                    >
                      <option value="confirm">Confirm</option>
                      <option value="override">Override</option>
                      <option value="remove">Remove</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Custom additions */}
        <section className="mt-12 card p-8 border-cyan/20 bg-cyan/5">
          <SectionHeading>Custom Requirements</SectionHeading>
          <p className="text-sm text-text-tertiary mb-6 leading-relaxed">
            Need something not in the catalog? Add it here and the production team will review.
          </p>
          <textarea
            className="input w-full h-32 resize-none p-4 text-sm bg-surface border border-cyan/40 focus:outline-none focus:border-cyan text-text-primary rounded-md shadow-inner"
            placeholder="Describe any additional equipment, special requirements, or notes for the production team..."
            aria-label="Custom requirements"
          />
        </section>
      </div>
    </>
  );
}
