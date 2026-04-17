import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { SectionHeading } from '@/components/data/SectionHeading';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Equipment Pull List -- ${slug} -- GVTEWAY` };
}

export default async function EquipmentPullListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch full catalog (production role sees everything)
  const { data: groups } = await supabase
    .from('advance_category_groups')
    .select(`
      id, name, slug, sort_order,
      advance_categories (
        id, name, slug,
        advance_subcategories (
          id, name, slug,
          advance_items (
            id, name, manufacturer, model, unit, daily_rate, weekly_rate, specifications
          )
        )
      )
    `)
    .order('sort_order');

  return (
    <>
      <ModuleHeader
        title="Equipment Pull List"
        subtitle="Full UAC catalog. Select items and quantities for this project."
        backHref={`/${slug}/production/vendor-submissions`}
        backLabel="Vendor Submissions"
        maxWidth="6xl"
      />

      <div className="page-content" style={{ maxWidth: '6xl' }}>
        {/* Status + Actions */}
        <div className="card-elevated p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="muted">Draft</Badge>
            <span className="text-xs text-text-tertiary">Select items from the full catalog below</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">Export CSV</Button>
            <Button variant="primary" size="sm">Submit Pull List</Button>
          </div>
        </div>

        {/* Category groups */}
        {(groups ?? []).map((group) => (
          <section key={group.id} className="mb-10">
            <div className="sticky top-0 bg-bg py-2 z-10 mb-4">
              <SectionHeading accentColor="var(--color-cyan)">{group.name}</SectionHeading>
            </div>

            {(group.advance_categories ?? []).map((cat: {
              id: string; name: string;
              advance_subcategories?: {
                id: string; name: string;
                advance_items?: {
                  id: string; name: string; manufacturer: string | null;
                  model: string | null; unit: string; daily_rate: number | null;
                }[];
              }[];
            }) => (
              <div key={cat.id} className="mb-6">
                <h3 className="text-[0.6875rem] tracking-wider uppercase text-text-secondary mb-3 px-1">{cat.name}</h3>
                {(cat.advance_subcategories ?? []).map((sub) => (
                  <div key={sub.id} className="mb-4">
                    <div className="text-[0.5625rem] tracking-wider uppercase text-text-disabled mb-2 px-1">{sub.name}</div>
                    <div className="flex flex-col gap-1">
                      {(sub.advance_items ?? []).map((item) => (
                        <div key={item.id} className="card p-3 flex items-center justify-between hover:border-cyan/30 transition-colors">
                          <div className="flex-1 flex items-center gap-3">
                            <input type="checkbox" className="accent-cyan w-4 h-4" />
                            <div>
                              <span className="text-sm font-medium text-text-primary">{item.name}</span>
                              <span className="font-mono text-[0.625rem] text-text-disabled ml-2">
                                {item.manufacturer} {item.model}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {item.daily_rate && (
                              <span className="font-mono text-xs text-text-tertiary">${item.daily_rate}/day</span>
                            )}
                            <Input type="number" defaultValue={0} min={0} className="w-16 text-center text-sm py-1 font-mono" aria-label={`Quantity for ${item.name}`} />
                            <span className="text-[0.625rem] tracking-wider uppercase text-text-disabled w-16">{item.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
